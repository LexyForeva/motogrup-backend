const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const BADGES = [
  { id: 'first-tour', name: 'İlk Tur', icon: '🥇', description: 'İlk etkinliğine katıldın!', condition: 'events >= 1' },
  { id: 'km-100', name: '100 KM', icon: '🛣️', description: '100 km sürüş tamamlandı', condition: 'km >= 100' },
  { id: 'km-500', name: '500 KM', icon: '🛣️', description: '500 km sürüş tamamlandı', condition: 'km >= 500' },
  { id: 'km-1000', name: '1000 KM', icon: '🏅', description: '1000 km sürüş tamamlandı!', condition: 'km >= 1000' },
  { id: 'photographer', name: 'Fotoğrafçı', icon: '📸', description: '10+ fotoğraf paylaştın', condition: 'photos >= 10' },
  { id: 'event-lover', name: 'Etkinlik Aşığı', icon: '🎯', description: '5+ etkinliğe katıldın', condition: 'events >= 5' },
  { id: 'star-member', name: 'Yıldız Üye', icon: '⭐', description: '1 yılı aşkın üyelik', condition: 'membership >= 365' },
  { id: 'hot-member', name: 'Ateşli Üye', icon: '🔥', description: 'Çok aktif üye', condition: 'events >= 10' },
];

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const earnedIds = user.badges.map(b => b.badgeId);
    const badgesWithStatus = BADGES.map(badge => ({
      ...badge,
      earned: earnedIds.includes(badge.id),
      earnedAt: user.badges.find(b => b.badgeId === badge.id)?.earnedAt
    }));
    res.json({ success: true, data: badgesWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/check', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const earnedIds = user.badges.map(b => b.badgeId);
    const newBadges = [];

    const check = (badgeId, condition) => {
      if (!earnedIds.includes(badgeId) && condition) {
        user.badges.push({ badgeId });
        newBadges.push(BADGES.find(b => b.id === badgeId));
      }
    };

    const daysSince = (Date.now() - user.createdAt) / (24 * 60 * 60 * 1000);
    check('first-tour', user.stats.totalEvents >= 1);
    check('km-100', user.stats.totalKm >= 100);
    check('km-500', user.stats.totalKm >= 500);
    check('km-1000', user.stats.totalKm >= 1000);
    check('photographer', user.stats.totalPhotos >= 10);
    check('event-lover', user.stats.totalEvents >= 5);
    check('hot-member', user.stats.totalEvents >= 10);
    check('star-member', daysSince >= 365);

    if (newBadges.length > 0) {
      user.stats.totalBadges = user.badges.length;
      await user.save();
    }

    res.json({ success: true, newBadges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
