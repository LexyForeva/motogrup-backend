const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { uploadProfile, uploadToCloudinary } = require('../config/cloudinary');

// GET /api/users/profile/:id
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -tcNo -resetPasswordToken -resetPasswordExpire')
      .populate('following', 'firstName lastName nickname avatar')
      .populate('followers', 'firstName lastName nickname avatar');
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'nickname', 'bio', 'birthDate', 'phone',
      'bloodType', 'motorcycle', 'experienceLevel', 'interests', 'instagram', 'emergencyContact',
      'notificationSettings', 'avatar', 'coverPhoto'];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -refreshToken -tcNo');
    res.json({ success: true, data: user, message: 'Profil güncellendi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/upload-avatar
router.post('/upload-avatar', protect, uploadProfile.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'profiles', 'image');
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password -refreshToken -tcNo');

    res.json({ success: true, data: user, avatarUrl, message: 'Profil fotoğrafı güncellendi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/follow/:id
router.post('/follow/:id', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Kendinizi takip edemezsiniz.' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });

    const me = await User.findById(req.user._id);
    const isFollowing = me.following.includes(req.params.id);

    if (isFollowing) {
      me.following.pull(req.params.id);
      target.followers.pull(req.user._id);
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.user._id);
    }
    await me.save(); await target.save();

    res.json({ success: true, isFollowing: !isFollowing, message: isFollowing ? 'Takipten çıkıldı.' : 'Takip edildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users?search=
router.get('/', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { nickname: new RegExp(search, 'i') },
        { memberNumber: new RegExp(search, 'i') }
      ];
    }
    const users = await User.find(query)
      .select('firstName lastName nickname avatar memberNumber role stats motorcycle experienceLevel')
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Mevcut şifre hatalı.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Şifre güncellendi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
