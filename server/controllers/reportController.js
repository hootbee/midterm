const { Report, deleteAllReportsByAuctionItemId } = require('../models/reportModel');
const { AuctionItem } = require('../models/auctionItemModel');

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

// @desc    Delete all reports for a specific auction item
// @route   DELETE /api/reports/:auctionItemId
// @access  Admin
const deleteAllReportsForAuctionItem = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const result = await deleteAllReportsByAuctionItemId(auctionItemId);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No reports found for this auction item.' });
    }

    res.json({ message: 'All reports for the auction item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting all reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Manually create a report for a specific auction item
// @route   POST /api/reports/:auctionItemId
// @access  Private
const createReportForItem = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const { reason } = req.body;
    const reporterUuid = req.user.uuid;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required.' });
    }

    const auctionItem = await AuctionItem.findById(auctionItemId);
    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction item not found.' });
    }

    const existingReport = await Report.findOne({ auctionItemId, reporterUuid });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this item.' });
    }

    const newReport = new Report({
      auctionItemId,
      reason,
      reporterUuid,
    });
    await newReport.save();

    auctionItem.reportCount += 1;
    await auctionItem.save();

    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getReportsForItem,
  deleteAllReportsForAuctionItem,
  createReportForItem,
};
