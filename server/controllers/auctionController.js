const { AuctionItem, findAllAuctionItems, findById, deleteById, updateById } = require('../models/auctionItemModel');
const { findUserByEmail } = require('../models/userModel');
const fs = require('fs');
const path = require('path');

// @desc    Create a new auction item
// @route   POST /api/auctions
// @access  Private
const createAuctionItem = async (req, res) => {
  try {
    const { title, content, startPrice, endTime } = req.body;
    const { email, uuid } = req.user; // Get user info from the token payload (set by authMiddleware)

    // Check if files were uploaded
    if (!req.files || !req.files.photo || !req.files.itemFile) {
      return res.status(400).json({ message: 'Please upload both a thumbnail photo and an item file.' });
    }

    // Basic validation
    if (!title || !content || !startPrice || !endTime) {
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
      content,
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
    const { search, type } = req.query;

    const { items, totalItems } = await findAllAuctionItems({ page, limit, search, type });

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

// @desc    Delete an auction item
// @route   DELETE /api/auctions/:id
// @access  Private (owner only)
const deleteAuctionItem = async (req, res) => {
  try {
    const item = await findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    // Check if the user is the owner of the auction item OR if the user is an admin
    if (item.sellerUuid !== req.user.uuid && !req.user.admin) {
      return res.status(403).json({ message: 'User not authorized to delete this item' });
    }

    // Delete the files from the filesystem
    const imagePath = path.resolve(item.imagePath);
    const filePath = path.resolve(item.filePath);

    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting image file:', err);
    });

    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting item file:', err);
    });

    await deleteById(req.params.id);

    res.json({ message: 'Auction item removed' });
  } catch (error) {
    console.error('Error deleting auction item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an auction item
// @route   PUT /api/auctions/:id
// @access  Private (owner only)
const updateAuctionItem = async (req, res) => {
  try {
    const item = await findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    // Check if the user is the owner of the auction item
    if (item.sellerUuid !== req.user.uuid) {
      return res.status(403).json({ message: 'User not authorized to update this item' });
    }

    // For now, only update text fields. File updates can be added later.
    const { title, content, startPrice, endTime } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (startPrice) updateData.startPrice = startPrice;
    if (endTime) updateData.endTime = endTime;

    const updatedItem = await updateById(req.params.id, updateData);

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating auction item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Report = require('../models/reportModel');

// ... (other controller functions)

const reportAuctionItem = async (req, res) => {
  try {
    const { reason } = req.body;
    const auctionItemId = req.params.id;
    const reporterUuid = req.user.uuid;

    if (!reason) {
      return res.status(400).json({ message: 'A reason for the report must be provided.' });
    }

    // Check if the user has already reported this item
    const existingReport = await Report.findOne({ auctionItemId, reporterUuid });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this item.' });
    }

    // Create a new report
    const newReport = new Report({
      auctionItemId,
      reason,
      reporterUuid,
    });
    await newReport.save();

    // Increment the report count on the auction item
    await AuctionItem.findByIdAndUpdate(auctionItemId, { $inc: { reportCount: 1 } });

    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all reported auction items
// @route   GET /api/auctions/reported
// @access  Admin
const getReportedItems = async (req, res) => {
  try {
    const items = await AuctionItem.find({ reportCount: { $gt: 0 } }).sort({ reportCount: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching reported items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAuctionItem,
  getAuctionItems,
  getAuctionItemById,
  downloadItemFile,
  deleteAuctionItem,
  updateAuctionItem,
  reportAuctionItem,
  getReportedItems,
};