const DMRoom = require('../models/dmRoomModel');
const DMMessage = require('../models/dmMessageModel');

// Helper function to ensure participants array is sorted for consistent room lookup
const getSortedParticipants = (user1Uuid, user2Uuid) => {
  return [user1Uuid, user2Uuid].sort();
};

// @desc    Get or create a DM room with another user
// @route   POST /api/dm/room
// @access  Private
const getOrCreateDMRoom = async (req, res) => {
  try {
    const { targetUserUuid } = req.body;
    const currentUserUuid = req.user.uuid; // From authMiddleware

    if (!targetUserUuid) {
      return res.status(400).json({ message: 'Target user UUID is required.' });
    }

    if (currentUserUuid === targetUserUuid) {
      return res.status(400).json({ message: 'Cannot create a DM room with yourself.' });
    }

    const participants = getSortedParticipants(currentUserUuid, targetUserUuid);
    const participantsKey = participants.join('_');

    let dmRoom = await DMRoom.findOne({ participantsKey });

    if (!dmRoom) {
      dmRoom = new DMRoom({ participants, participantsKey });
      await dmRoom.save();
    }

    res.status(200).json(dmRoom);
  } catch (error) {
    console.error('Error getting or creating DM room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all DM rooms for the authenticated user
// @route   GET /api/dm/rooms
// @access  Private
const getDMRooms = async (req, res) => {
  try {
    const currentUserUuid = req.user.uuid;

    const dmRooms = await DMRoom.find({ participants: currentUserUuid })
      .populate('lastMessage') // Populate last message if needed
      .sort({ updatedAt: -1 });

    res.status(200).json(dmRooms);
  } catch (error) {
    console.error('Error fetching DM rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for a specific DM room
// @route   GET /api/dm/room/:roomId/messages
// @access  Private
const getDMMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserUuid = req.user.uuid;

    const dmRoom = await DMRoom.findById(roomId);

    if (!dmRoom) {
      return res.status(404).json({ message: 'DM room not found.' });
    }

    // Ensure the current user is a participant in the room
    if (!dmRoom.participants.includes(currentUserUuid)) {
      return res.status(403).json({ message: 'Not authorized to access this DM room.' });
    }

    const messages = await DMMessage.find({ roomId }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a DM room
// @route   DELETE /api/dm/room/:roomId/leave
// @access  Private
const leaveDMRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserUuid = req.user.uuid;

    const dmRoom = await DMRoom.findById(roomId);

    if (!dmRoom) {
      return res.status(404).json({ message: 'DM room not found.' });
    }

    // Ensure the current user is a participant in the room
    if (!dmRoom.participants.includes(currentUserUuid)) {
      return res.status(403).json({ message: 'Not authorized to leave this DM room.' });
    }

    // Remove the current user from participants
    dmRoom.participants = dmRoom.participants.filter(
      (uuid) => uuid !== currentUserUuid
    );

    if (dmRoom.participants.length === 0) {
      // If no participants left, delete all messages and the room
      await DMMessage.deleteMany({ roomId: dmRoom._id });
      await DMRoom.deleteOne({ _id: dmRoom._id });
      return res.status(200).json({ message: 'DM room and all messages deleted successfully.' });
    } else {
      // Otherwise, save the updated room
      await dmRoom.save();
      return res.status(200).json({ message: 'Successfully left DM room.' });
    }
  } catch (error) {
    console.error('Error leaving DM room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Permanently delete a DM room along with all messages
// @route   DELETE /api/dm/room/:roomId
// @access  Private (participants or admin)
const deleteDMRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const dmRoom = await DMRoom.findById(roomId);

    if (!dmRoom) {
      return res.status(404).json({ message: 'DM room not found.' });
    }

    if (!isAdmin && !dmRoom.participants.includes(currentUserUuid)) {
      return res.status(403).json({ message: 'Not authorized to delete this DM room.' });
    }

    await DMMessage.deleteMany({ roomId: dmRoom._id });
    await DMRoom.deleteOne({ _id: dmRoom._id });

    res.status(200).json({ message: 'DM room and messages deleted successfully.' });
  } catch (error) {
    console.error('Error deleting DM room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to send system-generated DMs
const SYSTEM_UUID = 'SYSTEM'; // A unique UUID for the system sender
let ioInstance; // To hold the Socket.IO instance

const setIoInstance = (io) => {
  ioInstance = io;
};

const sendSystemDM = async (receiverUuid, content) => {
  try {
    const participants = getSortedParticipants(SYSTEM_UUID, receiverUuid);
    const participantsKey = participants.join('_');

    let dmRoom = await DMRoom.findOne({ participantsKey });

    if (!dmRoom) {
      dmRoom = new DMRoom({ participants, participantsKey });
      await dmRoom.save();
    }

    const newMessage = new DMMessage({
      roomId: dmRoom._id,
      senderUuid: SYSTEM_UUID,
      receiverUuid,
      content,
    });
    await newMessage.save();

    dmRoom.lastMessage = newMessage._id;
    dmRoom.updatedAt = new Date();
    await dmRoom.save();

    // Emit message via Socket.IO if instance is available
    if (ioInstance) {
      ioInstance.to(dmRoom._id.toString()).emit('dm:message', newMessage);
    }
    console.log(`System DM sent to ${receiverUuid} in room ${dmRoom._id}: ${content}`);
  } catch (error) {
    console.error('Error sending system DM:', error);
  }
};

module.exports = {
  getOrCreateDMRoom,
  getDMRooms,
  getDMMessages,
  leaveDMRoom,
  deleteDMRoom,
  sendSystemDM,
  setIoInstance, // Export setIoInstance to allow setting the io instance from index.js
};
