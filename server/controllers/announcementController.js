const Announcement = require('../models/announcementModel');

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required for an announcement.' });
    }

    const announcement = new Announcement({
      title,
      content,
    });

    const createdAnnouncement = await announcement.save();
    res.status(201).json(createdAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get the announcement currently set as banner
// @route   GET /api/announcements/banner
// @access  Public
const getBannerAnnouncement = async (req, res) => {
  try {
    const banner = await Announcement.findOne({ isBanner: true }).sort({ updatedAt: -1 });
    if (!banner) {
      return res.status(404).json({ message: 'No banner announcement found.' });
    }
    res.status(200).json(banner);
  } catch (error) {
    console.error('Error fetching banner announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isBanner } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    // isBanner can be explicitly set to false, so check for undefined
    if (isBanner !== undefined) {
      announcement.isBanner = isBanner;
    }

    const updatedAnnouncement = await announcement.save();
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    await announcement.deleteOne();
    res.status(200).json({ message: 'Announcement removed.' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle banner status of an announcement
// @route   PUT /api/announcements/:id/toggle-banner
// @access  Private/Admin
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    // If this announcement is being set as banner, ensure only one banner is active
    if (!announcement.isBanner) { // If it's currently not a banner and we're about to make it one
      await Announcement.updateMany({ isBanner: true }, { isBanner: false });
    }

    announcement.isBanner = !announcement.isBanner;
    const updatedAnnouncement = await announcement.save();

    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getBannerAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleBannerStatus,
};
