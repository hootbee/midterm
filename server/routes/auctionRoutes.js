const express = require('express');
const router = express.Router();
const { createAuctionItem, getAuctionItems, getAuctionItemById, downloadItemFile, deleteAuctionItem, updateAuctionItem, reportAuctionItem, getReportedItems, resetReportsForItem, getBidAuctions } = require('../controllers/auctionController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/auctions
// @desc    Get all auction items
// @access  Public
router.get('/', getAuctionItems);

// @route   GET /api/auctions/reported
// @desc    Get all reported auction items (Admin only)
// @access  Admin
router.get('/reported', authMiddleware, adminMiddleware, getReportedItems);

// @route   GET /api/auctions/:id
// @desc    Get single auction item
// @access  Public
router.get('/:id', getAuctionItemById);

// @route   GET /api/auctions/:id/download
// @desc    Download an item file after winning
// @access  Private
router.get('/:id/download', authMiddleware, downloadItemFile);

// @route   POST /api/auctions
// @desc    Create a new auction item
// @access  Private
router.post('/', authMiddleware, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      // Ensure a string message is sent for client-side alerts.
      const errorMessage = (typeof err === 'string') ? err : (err.message || 'File upload error');
      console.error('Multer Error:', errorMessage); // Also log the specific error on the server
      return res.status(400).json({ message: errorMessage });
    }
    // If file upload is successful, call the controller
    createAuctionItem(req, res);
  });
});

// @route   POST /api/auctions/:id/report
// @desc    Report an auction item
// @access  Private
router.post('/:id/report', authMiddleware, reportAuctionItem);

// @route   PUT /api/auctions/:id
// @desc    Update an auction item
// @access  Private
router.put('/:id', authMiddleware, updateAuctionItem);

// @route   DELETE /api/auctions/:id
// @desc    Delete an auction item
// @access  Private
router.delete('/:id', authMiddleware, deleteAuctionItem);


// @route   PUT /api/auctions/:id/reset-reports
// @desc    Reset all reports for an auction item (Admin only)
// @access  Admin
router.put('/:id/reset-reports', authMiddleware, adminMiddleware, resetReportsForItem);

// @route   GET /api/auctions/bids/me
// @desc    Get all auction items the user has bid on
// @access  Private
router.get('/bids/me', authMiddleware, getBidAuctions);

module.exports = router;
