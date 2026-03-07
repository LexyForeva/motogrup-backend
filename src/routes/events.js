const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const { Notification } = require('../models/index');

// GET /api/events
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, upcoming, difficulty } = req.query;
    const query = { isActive: true, isApproved: true };
    if (upcoming === 'true') query.date = { $gte: new Date() };
    if (difficulty) query.difficulty = difficulty;

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName nickname avatar')
      .populate('participants.user', 'firstName lastName nickname avatar')
      .sort({ date: 1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Event.countDocuments(query);
    res.json({ success: true, data: events, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName nickname avatar')
      .populate('participants.user', 'firstName lastName nickname avatar motorcycle');
    if (!event) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı.' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events
router.post('/', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id, isApproved: req.user.role === 'admin' });
    
    // Notify all members
    const users = await User.find({ isActive: true, _id: { $ne: req.user._id } }).select('_id');
    const notifications = users.map(u => ({
      recipient: u._id,
      sender: req.user._id,
      type: 'new_event',
      title: '🏍️ Yeni Etkinlik!',
      message: `"${event.title}" etkinliği oluşturuldu.`,
      link: `/events/${event._id}`
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, data: event, message: 'Etkinlik oluşturuldu.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı.' });
    res.json({ success: true, data: event, message: 'Etkinlik güncellendi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/join
router.post('/:id/join', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı.' });

    const isJoined = event.participants.some(p => p.user.toString() === req.user._id.toString());
    
    if (isJoined) {
      event.participants = event.participants.filter(p => p.user.toString() !== req.user._id.toString());
      await event.save();
      res.json({ success: true, isJoined: false, message: 'Etkinlikten ayrıldınız.' });
    } else {
      if (event.participants.filter(p=>p.status==='confirmed').length >= event.capacity) {
        return res.status(400).json({ success: false, message: 'Etkinlik kontenjanı doldu.' });
      }
      event.participants.push({ user: req.user._id });
      await event.save();

      // Update user stats
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalEvents': 1 } });

      res.json({ success: true, isJoined: true, message: 'Etkinliğe katıldınız.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Etkinlik silindi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
