const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Çok fazla istek. Lütfen 15 dakika sonra tekrar deneyin.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Çok fazla giriş denemesi.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/academy', require('./routes/academy'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/riding', require('./routes/riding'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/weather', require('./routes/weather'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MotoGrup API çalışıyor! 🏍️', env: process.env.NODE_ENV });
});

// Seed endpoint (geçici - production'da kaldırılmalı)
app.get('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const Event = require('./models/Event');
    const { Post, Lesson, Announcement } = require('./models/index');
    
    // Clear existing data
    await Promise.all([User.deleteMany(), Event.deleteMany(), Post.deleteMany(), Lesson.deleteMany(), Announcement.deleteMany()]);
    
    // Drop indexes
    try {
      await User.collection.dropIndexes();
    } catch (e) {}
    
    // Create seed data (sadece admin)
    const admin = await User.create({
      email: 'admin@motogrup.com',
      password: 'Admin123!',
      firstName: 'Mehmet',
      lastName: 'Yılmaz',
      nickname: 'TURBO',
      role: 'admin',
      birthDate: new Date('1985-06-15'),
      phone: '0532 111 2233',
      bloodType: 'A+',
      motorcycle: { brand: 'Harley-Davidson', model: 'Fat Boy', plate: '34 TRB 01', year: 2020, type: 'Cruiser' },
      experienceLevel: 'Uzman',
      interests: ['Tur', 'Cruise', 'Modifikasyon'],
      stats: { totalKm: 45000, totalEvents: 87, totalPhotos: 234, totalBadges: 8 }
    });
    
    res.json({ success: true, message: 'Seed data yüklendi! Admin: admin@motogrup.com / Admin123!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadı.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motogrup');
    console.log(`✅ MongoDB bağlandı: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🏍️  MotoGrup API ${PORT} portunda çalışıyor (${process.env.NODE_ENV})`);
  });
});

module.exports = app;
