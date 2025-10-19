const { AuctionItem, findAllAuctionItems, findById } = require('../models/auctionItemModel');
const { findUserByEmail } = require('../models/userModel');

// @desc    Create a new auction item
// @route   POST /api/auctions
// @access  Private
const createAuctionItem = async (req, res) => {
  try {
    const { title, startPrice, endTime } = req.body;
    const { email, uuid } = req.user; // Get user info from the token payload (set by authMiddleware)

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file.' });
    }

    // Basic validation
    if (!title || !startPrice || !endTime) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    // Fetch seller's reputation score from MariaDB
    const seller = await findUserByEmail(email);
    if (!seller) {
      // This should not happen if the token is valid, but as a safeguard:
      return res.status(404).json({ message: 'Seller not found.' });
    }

    const newItem = new AuctionItem({
      title,
      startPrice,
      endTime,
      imagePath: req.file.path, // Get file path from multer
      sellerEmail: email,
      sellerUuid: uuid,
      sellerReputationScore: seller.reputation_score, // Add the score
    });

    const savedItem = await newItem.save();

    res.status(201).json(savedItem);

  } catch (error) {
    console.error('Error creating auction item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAuctionItems = async (req, res) => {
  try {
    const items = await findAllAuctionItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching auction items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single auction item by ID
// @route   GET /api/auctions/:id
// @access  Public
const getAuctionItemById = async (req, res) => {
  try {
    const item = await findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Auction item not found' });
    }
  } catch (error) {
    console.error('Error fetching single auction item:', error);
    // Handle cases like invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAuctionItem,
  getAuctionItems,
  getAuctionItemById,
};
