const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  date: { type: Date, required: true },
  endDate: Date,
  startPoint: { type: String, required: true },
  route: String,
  distance: Number,
  estimatedDuration: String,
  difficulty: { type: String, enum: ['Kolay', 'Orta', 'Zor'], default: 'Orta' },
  capacity: { type: Number, default: 50 },
  coverImage: String,
  tags: [String],
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['confirmed', 'maybe', 'declined'], default: 'confirmed' }
  }],
  meetingPoints: [{ name: String, time: String, coords: String }]
}, { timestamps: true });

eventSchema.virtual('participantCount').get(function () {
  return this.participants.filter(p => p.status === 'confirmed').length;
});

module.exports = mongoose.model('Event', eventSchema);
