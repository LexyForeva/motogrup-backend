const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Maintenance } = require('../models/index');

router.get('/', protect, async (req, res) => {
  try {
    const records = await Maintenance.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const record = await Maintenance.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const record = await Maintenance.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Maintenance.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Kayıt silindi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
