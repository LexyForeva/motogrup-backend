const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Auth
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  refreshToken: { type: String, select: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isEmailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
  isActive: { type: Boolean, default: true },

  // Temel bilgiler
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  nickname: { type: String, trim: true },
  memberNumber: { type: String, unique: true },
  avatar: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  bio: { type: String, maxlength: 300 },

  // Kişisel
  birthDate: Date,
  phone: String,
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', ''] },
  tcNo: { type: String, select: false },

  // Motor bilgileri
  motorcycle: {
    brand: String,
    model: String,
    plate: String,
    year: Number,
    type: { type: String, enum: ['Cruiser', 'Sport', 'Touring', 'Enduro', 'Scooter', 'Naked', 'Adventure', 'Chopper', 'Diğer', ''] },
    photo: String
  },

  // Deneyim
  experienceLevel: { type: String, enum: ['Başlangıç', 'Orta', 'İleri', 'Uzman', ''] },
  interests: [{ type: String, enum: ['Tur', 'Yarış', 'Off-road', 'Cruise', 'Bakım', 'Modifikasyon'] }],

  // Sosyal
  instagram: String,
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Acil durum
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  // İstatistikler
  stats: {
    totalKm: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    totalPhotos: { type: Number, default: 0 },
    totalBadges: { type: Number, default: 0 }
  },

  // Rozetler
  badges: [{
    badgeId: String,
    earnedAt: { type: Date, default: Date.now }
  }],

  // Tamamlanan eğitimler
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],

  // Bildirim ayarları
  notificationSettings: {
    newEvent: { type: Boolean, default: true },
    eventReminder: { type: Boolean, default: true },
    emergency: { type: Boolean, default: true },
    social: { type: Boolean, default: true },
    badge: { type: Boolean, default: true },
    maintenance: { type: Boolean, default: true }
  },

  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

// Üye numarası otomatik
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('User').countDocuments();
    this.memberNumber = `MG${String(count + 1).padStart(5, '0')}`;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function () {
  if (!this.birthDate) return null;
  return Math.floor((Date.now() - this.birthDate) / (365.25 * 24 * 60 * 60 * 1000));
});

module.exports = mongoose.model('User', userSchema);
