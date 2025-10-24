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

    let dmRoom = await DMRoom.findOne({ participants: { $all: participants } });

    if (!dmRoom) {
      dmRoom = new DMRoom({ participants });
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

module.exports = {
  getOrCreateDMRoom,
  getDMRooms,
  getDMMessages,
};
