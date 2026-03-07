const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const { Post, Notification, Announcement } = require('../models/index');

// Stats
router.get('/stats', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const [users, events, posts, announcements] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),
      Announcement.countDocuments({ isActive: true })
    ]);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    res.json({ success: true, data: { users, events, posts, announcements, newUsersThisMonth } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Users management
router.get('/users', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [
      { firstName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { memberNumber: new RegExp(search, 'i') }
    ];
    if (role) query.role = role;
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, isActive }, { new: true });
    res.json({ success: true, data: user, message: 'Kullanıcı güncellendi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Kullanıcı devre dışı bırakıldı.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Events management
router.get('/events', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'firstName lastName').sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/events/:id/approve', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json({ success: true, data: event, message: 'Etkinlik onaylandı.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Announcements
router.get('/announcements', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/announcements', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.user._id });
    
    if (req.body.notify) {
      const users = await User.find({ isActive: true, _id: { $ne: req.user._id } }).select('_id');
      await Notification.insertMany(users.map(u => ({
        recipient: u._id,
        sender: req.user._id,
        type: req.body.isEmergency ? 'emergency' : 'announcement',
        title: req.body.isEmergency ? '🚨 ACİL DUYURU' : '📢 Duyuru',
        message: req.body.title
      })));
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/announcements/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Duyuru silindi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Give badge manually
router.post('/badges/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user.badges.find(b => b.badgeId === req.body.badgeId)) {
      user.badges.push({ badgeId: req.body.badgeId });
      user.stats.totalBadges = user.badges.length;
      await user.save();
    }
    res.json({ success: true, message: 'Rozet verildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
