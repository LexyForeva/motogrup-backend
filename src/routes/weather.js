const express = require('express');
const router = express.Router();
const { getWeather } = require('../services/weather');

// GET /api/weather
router.get('/', async (req, res) => {
  try {
    const weather = await getWeather();
    if (weather.error) {
      return res.status(503).json({ success: false, message: weather.error });
    }
    res.json({ success: true, data: weather });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
