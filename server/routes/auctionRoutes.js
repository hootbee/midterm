const express = require('express');
const router = express.Router();
const { createAuctionItem, getAuctionItems, getAuctionItemById } = require('../controllers/auctionController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/auctions
// @desc    Create a new auction item
// @access  Private
router.post('/', authMiddleware, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err });
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

module.exports = router;
