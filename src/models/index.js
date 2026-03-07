const mongoose = require('mongoose');

// POST
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000 },
  images: [String],
  type: { type: String, enum: ['post', 'photo', 'event_share', 'achievement'], default: 'post' },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  shares: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// NOTIFICATION
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['new_event', 'event_reminder', 'emergency', 'like', 'comment', 'follow', 'badge', 'maintenance', 'announcement'], required: true },
  title: { type: String, required: true },
  message: String,
  link: String,
  isRead: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// LESSON (Academy)
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['sürüş-teknikleri', 'grup-kuralları', 'motor-bakımı', 'ilk-yardım'], required: true },
  youtubeUrl: String,
  thumbnailUrl: String,
  duration: String,
  difficulty: { type: String, enum: ['Kolay', 'Orta', 'Zor'], default: 'Orta' },
  instructor: String,
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tags: [String]
}, { timestamps: true });

// MAINTENANCE
const maintenanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Yağ Değişimi', 'Genel Bakım', 'Lastik Bakımı', 'Parça Değişimi', 'Temizlik', 'Diğer'], required: true },
  description: String,
  date: { type: Date, required: true },
  km: Number,
  nextKm: Number,
  cost: Number,
  notes: String,
  shop: String,
  attachments: [String]
}, { timestamps: true });

// RIDING LOG
const ridingLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  distance: { type: Number, required: true },
  duration: Number,
  avgSpeed: Number,
  maxSpeed: Number,
  route: String,
  startPoint: String,
  endPoint: String,
  weather: { type: String, enum: ['Güneşli', 'Bulutlu', 'Yağmurlu', 'Karlı', 'Rüzgarlı'] },
  notes: String,
  photos: [String],
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
}, { timestamps: true });

// ANNOUNCEMENT
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'danger', 'success'], default: 'info' },
  isEmergency: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: Date
}, { timestamps: true });

module.exports = {
  Post: mongoose.model('Post', postSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Lesson: mongoose.model('Lesson', lessonSchema),
  Maintenance: mongoose.model('Maintenance', maintenanceSchema),
  RidingLog: mongoose.model('RidingLog', ridingLogSchema),
  Announcement: mongoose.model('Announcement', announcementSchema)
};
