const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { RidingLog } = require('../models/index');
const User = require('../models/User');

router.get('/', protect, async (req, res) => {
  try {
    const { userId, year, month } = req.query;
    const targetUser = userId || req.user._id;
    const query = { user: targetUser };
    if (year) {
      const start = new Date(year, month ? month - 1 : 0, 1);
      const end = month ? new Date(year, month, 0) : new Date(parseInt(year) + 1, 0, 1);
      query.date = { $gte: start, $lt: end };
    }
    const logs = await RidingLog.find(query).sort({ date: -1 });
    const totalKm = logs.reduce((sum, l) => sum + l.distance, 0);
    res.json({ success: true, data: logs, totalKm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const log = await RidingLog.create({ ...req.body, user: req.user._id });
    // Update user total km
    const user = await User.findById(req.user._id);
    user.stats.totalKm = (user.stats.totalKm || 0) + req.body.distance;
    await user.save();
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const log = await RidingLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (log) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalKm': -log.distance } });
    }
    res.json({ success: true, message: 'Kayıt silindi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
