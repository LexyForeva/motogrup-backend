const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Post, Notification } = require('../models/index');
const User = require('../models/User');
const { uploadPost, uploadToCloudinary } = require('../config/cloudinary');

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const query = { isActive: true };
    if (userId) query.author = userId;

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName nickname avatar memberNumber motorcycle')
      .populate('comments.author', 'firstName lastName nickname avatar')
      .populate('comments.replies.author', 'firstName lastName nickname avatar')
      .populate('relatedEvent', 'title date')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Post.countDocuments(query);
    res.json({ success: true, data: posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, author: req.user._id });
    if (req.body.images?.length > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalPhotos': req.body.images.length } });
    }
    const populated = await post.populate('author', 'firstName lastName nickname avatar memberNumber motorcycle');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/posts/upload-media
router.post('/upload-media', protect, uploadPost.array('media', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });
    }

    const uploadPromises = req.files.map(file => {
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      return uploadToCloudinary(file.buffer, 'posts', resourceType);
    });

    const urls = await Promise.all(uploadPromises);
    res.json({ success: true, urls, message: 'Medya yüklendi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Gönderi bulunamadı.' });

    const liked = post.likes.includes(req.user._id);
    if (liked) post.likes.pull(req.user._id);
    else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          title: '❤️ Yeni Beğeni',
          message: `${req.user.firstName} gönderinizi beğendi.`,
          link: `/posts/${post._id}`
        });
      }
    }
    await post.save();
    res.json({ success: true, liked: !liked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Gönderi bulunamadı.' });

    const comment = { author: req.user._id, content: req.body.content };
    post.comments.push(comment);
    await post.save();

    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        title: '💬 Yeni Yorum',
        message: `${req.user.firstName} gönderinize yorum yaptı.`,
        link: `/posts/${post._id}`
      });
    }

    const updated = await Post.findById(post._id)
      .populate('comments.author', 'firstName lastName nickname avatar');
    res.json({ success: true, data: updated.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Gönderi bulunamadı.' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role === 'member') {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok.' });
    }
    await Post.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Gönderi silindi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
