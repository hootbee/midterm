const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  isBanner: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt field on save
announcementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
