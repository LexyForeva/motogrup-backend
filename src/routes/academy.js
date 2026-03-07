// academy.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Lesson } = require('../models/index');
const User = require('../models/User');

router.get('/', protect, async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    const lessons = await Lesson.find(query).sort({ category: 1, order: 1 });
    res.json({ success: true, data: lessons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/complete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.completedLessons.includes(req.params.id)) {
      user.completedLessons.push(req.params.id);
      await user.save();
      await Lesson.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }
    res.json({ success: true, message: 'Ders tamamlandı olarak işaretlendi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    const liked = lesson.likes.includes(req.user._id);
    if (liked) lesson.likes.pull(req.user._id);
    else lesson.likes.push(req.user._id);
    await lesson.save();
    res.json({ success: true, liked: !liked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
