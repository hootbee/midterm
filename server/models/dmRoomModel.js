const mongoose = require('mongoose');

const dmRoomSchema = new mongoose.Schema({
  participants: [
    {
      type: String, // UUID of the user
      required: true,
    },
  ],
  participantsKey: {
    type: String,
    required: true,
    unique: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DMMessage',
    default: null,
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

const DMRoom = mongoose.model('DMRoom', dmRoomSchema);

module.exports = DMRoom;
