const mongoose = require('mongoose');

const dmMessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DMRoom',
    required: true,
  },
  senderUuid: {
    type: String,
    required: true,
  },
  receiverUuid: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DMMessage = mongoose.model('DMMessage', dmMessageSchema);

module.exports = DMMessage;
