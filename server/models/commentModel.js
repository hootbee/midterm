const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  auctionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionItem',
    required: true,
  },
  commenterUuid: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  commentOrder: {
    type: Number, // Used for '익명N' generation
    default: null, // Null for seller, or if not yet assigned
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
});

// Update updatedAt field on save
commentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
