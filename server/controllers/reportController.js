const Report = require('../models/reportModel');

// @desc    Get all reports for a specific auction item
// @route   GET /api/reports/:auctionItemId
// @access  Admin
const getReportsForItem = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const reports = await Report.find({ auctionItemId });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getReportsForItem,
};
