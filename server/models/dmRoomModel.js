const mongoose = require('mongoose');

const dmRoomSchema = new mongoose.Schema({
  participants: [
    {
      type: String, // UUID of the user
      required: true,
    },
  ],
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

dmRoomSchema.index({ participants: 1 }, { unique: true }); // Ensure unique rooms for a pair of participants

const DMRoom = mongoose.model('DMRoom', dmRoomSchema);

module.exports = DMRoom;
