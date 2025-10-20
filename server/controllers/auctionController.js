const { AuctionItem, findAllAuctionItems, findById } = require('../models/auctionItemModel');
const { findUserByEmail } = require('../models/userModel');

// @desc    Create a new auction item
// @route   POST /api/auctions
// @access  Private
const createAuctionItem = async (req, res) => {
  try {
    const { title, startPrice, endTime } = req.body;
    const { email, uuid } = req.user; // Get user info from the token payload (set by authMiddleware)

    // Check if files were uploaded
    if (!req.files || !req.files.photo || !req.files.itemFile) {
      return res.status(400).json({ message: 'Please upload both a thumbnail photo and an item file.' });
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
      imagePath: `uploads/${req.files.photo[0].filename}`,
      filePath: `private_uploads/${req.files.itemFile[0].filename}`,
      sellerEmail: email,
      sellerUuid: uuid,
      sellerReputationScore: seller.reputation_score,
      currentPrice: startPrice,
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const { items, totalItems } = await findAllAuctionItems({ page, limit });

    res.json({
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
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

// @desc    Download the file for a won auction
// @route   GET /api/auctions/:id/download
// @access  Private
const downloadItemFile = async (req, res) => {
  try {
    const item = await findById(req.params.id);

    // 1. Check if item exists
    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    // 2. Check if auction has ended
    if (new Date() < new Date(item.endTime)) {
      return res.status(403).json({ message: 'Auction has not ended yet.' });
    }

    // 3. Check if user is the winner
    if (req.user.uuid !== item.highestBidderUuid) {
      return res.status(403).json({ message: 'You are not the winner of this auction.' });
    }

    // 4. Send the file for download
    const path = require('path');
    const filePath = path.resolve(item.filePath);
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).send({ message: 'Could not download the file.' });
      }
    });

  } catch (error) {
    console.error('Error downloading item file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAuctionItem,
  getAuctionItems,
  getAuctionItemById,
  downloadItemFile,
};
