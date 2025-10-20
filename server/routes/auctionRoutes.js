const express = require('express');
const router = express.Router();
const { createAuctionItem, getAuctionItems, getAuctionItemById, downloadItemFile, deleteAuctionItem } = require('../controllers/auctionController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

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

// @route   GET /api/auctions
// @desc    Get all auction items
// @access  Public
router.get('/', getAuctionItems);

// @route   GET /api/auctions/:id
// @desc    Get single auction item
// @access  Public
router.get('/:id', getAuctionItemById);

// @route   GET /api/auctions/:id/download
// @desc    Download an item file after winning
// @access  Private
router.get('/:id/download', authMiddleware, downloadItemFile);

// @route   DELETE /api/auctions/:id
// @desc    Delete an auction item
// @access  Private
router.delete('/:id', authMiddleware, deleteAuctionItem);

module.exports = router;