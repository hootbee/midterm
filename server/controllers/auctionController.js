const { AuctionItem, findAllAuctionItems, findById, deleteById, updateById, resetReportCountById } = require('../models/auctionItemModel');
const { Report } = require('../models/reportModel');
const { findUserByEmail, findUserByUuid, updateReputationByUuid, findUsersByUuids } = require('../models/userModel');
const { sendSystemDM } = require('./dmController'); // Import sendSystemDM
fs = require('fs');
const path = require('path');

// Function to process ended auctions
const processEndedAuctions = async () => {
  console.log('--- Running processEndedAuctions ---');
  try {
    const now = new Date();
    console.log('Current time (UTC):', now.toISOString());
    const endedAuctions = await AuctionItem.find({ endTime: { $lte: now }, status: 'active' });
    console.log(`Found ${endedAuctions.length} ended auctions.`);

    for (const item of endedAuctions) {
      console.log('Processing auction item:', item._id);
      item.status = 'ended';
      if (item.highestBidderUuid) {
        item.winnerUuid = item.highestBidderUuid;
        item.transactionStatus = 'pending_payment';

        console.log(`Auction ${item._id} won by ${item.winnerUuid}. Sending DMs...`);
        // Send DM to winner
        await sendSystemDM(item.winnerUuid, `축하합니다! \'${item.title}\' 경매에 낙찰되셨습니다. 판매자와 연락하여 거래를 진행해주세요.`);
        // Send DM to seller
        await sendSystemDM(item.sellerUuid, `\'${item.title}\' 경매가 종료되었습니다. 낙찰자(${item.winnerUuid.substring(0, 8)}...)와 연락하여 거래를 진행해주세요.`);
        console.log(`DMs for auction ${item._id} sent.`);
      } else {
        console.log(`Auction ${item._id} ended with no bids. Sending DM to seller...`);
        // No bids, auction ended without a winner
        await sendSystemDM(item.sellerUuid, `\'${item.title}\' 경매가 입찰자 없이 종료되었습니다.`);
        console.log(`DM for auction ${item._id} sent.`);
      }
      await item.save();
      console.log(`Auction ${item._id} ended and processed successfully.`);
    }
  } catch (error) {
    console.error('Error processing ended auctions:', error);
  }
  console.log('--- Finished processEndedAuctions ---');
};

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

const FavoriteAuction = require('../models/favoriteAuctionModel');

const getAuctionItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const { search, type } = req.query;

    let favoriteAuctionIds = [];
    if (req.user) {
      const userFavorites = await FavoriteAuction.find({ userUuid: req.user.uuid });
      favoriteAuctionIds = userFavorites.map(fav => fav.auctionItemId.toString());
    }

    const { items, totalItems } = await findAllAuctionItems({ page, limit, search, type });

    const sellerUuids = [...new Set(items.map(item => item.sellerUuid))];
    const sellers = await findUsersByUuids(sellerUuids);
    const sellerReputationMap = sellers.reduce((acc, seller) => {
      acc[seller.uuid] = seller.reputation_score;
      return acc;
    }, {});

    const itemsWithFavorites = items.map(item => ({
      ...item.toObject(),
      sellerReputationScore: sellerReputationMap[item.sellerUuid] || item.sellerReputationScore,
      isFavorited: favoriteAuctionIds.includes(item._id.toString()),
    }));

    itemsWithFavorites.sort((a, b) => b.isFavorited - a.isFavorited);

    res.json({
      items: itemsWithFavorites,
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
      const seller = await findUserByUuid(item.sellerUuid);
      if (seller) {
        item.sellerReputationScore = seller.reputation_score;
      }
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
    const filePath = path.resolve(__dirname, '..', item.filePath);
    
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
    const imagePath = path.resolve(__dirname, '..', item.imagePath);
    const filePath = path.resolve(__dirname, '..', item.filePath);

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

// @desc    Mark auction as paid
// @route   PUT /api/auctions/:id/mark-paid
// @access  Private (Winner or Admin)
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const item = await findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    if (item.status !== 'ended') {
      return res.status(400).json({ message: 'Auction has not ended yet.' });
    }

    if (item.winnerUuid !== currentUserUuid && !isAdmin) {
      return res.status(403).json({ message: 'Only the winner or admin can mark this as paid.' });
    }

    if (item.transactionStatus === 'paid') {
      return res.status(400).json({ message: 'Item already marked as paid.' });
    }

    item.transactionStatus = 'paid';
    const updatedItem = await item.save();

    // Notify seller that payment has been made
    await sendSystemDM(item.sellerUuid, `\'${item.title}\' 경매의 낙찰자(${item.winnerUuid.substring(0, 8)}...)가 결제를 완료했습니다.`);

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error marking auction as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark auction as completed
// @route   PUT /api/auctions/:id/mark-completed
// @access  Private (Winner or Admin)
const markCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const item = await findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    if (item.status !== 'ended') {
      return res.status(400).json({ message: 'Auction has not ended yet.' });
    }

    if (item.winnerUuid !== currentUserUuid && !isAdmin) {
      return res.status(403).json({ message: 'Only the winner or admin can mark this as completed.' });
    }

    if (item.transactionStatus !== 'paid') {
      return res.status(400).json({ message: 'Item has not been paid yet.' });
    }

    if (item.transactionStatus === 'completed') {
      return res.status(400).json({ message: 'Item already marked as completed.' });
    }

    item.transactionStatus = 'completed';
    item.status = 'sold'; // Auction is fully sold
    const updatedItem = await item.save();

    // Update seller's reputation
    const seller = await findUserByUuid(item.sellerUuid);
    if (seller) {
      const newReputation = seller.reputation_score + 50;
      await updateReputationByUuid(item.sellerUuid, newReputation);
    }

    // Notify seller that transaction is completed
    await sendSystemDM(item.sellerUuid, `\'${item.title}\' 경매 거래가 완료되었습니다. 수고하셨습니다.`);

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error marking auction as completed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel an auction
// @route   POST /api/auctions/:id/cancel
// @access  Private (Seller or Admin)
const cancelAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const item = await findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    if (item.sellerUuid !== currentUserUuid && !isAdmin) {
      return res.status(403).json({ message: 'Only the seller or admin can cancel this auction.' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Only active auctions can be cancelled.' });
    }

    // Optionally, refund bids if any
    // For now, just change status
    item.status = 'cancelled';
    const updatedItem = await item.save();

    // Notify bidders if any
    if (item.bids && item.bids.length > 0) {
      const uniqueBidders = [...new Set(item.bids.map(bid => bid.bidderUuid))];
      for (const bidderUuid of uniqueBidders) {
        await sendSystemDM(bidderUuid, `\'${item.title}\' 경매가 취소되었습니다.`);
      }
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error cancelling auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Extend the end time for an auction
// @route   PUT /api/auctions/:id/extend
// @access  Private (Seller or Admin)
const extendAuctionEndTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { extendMinutes } = req.body;
    const currentUserUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const minutesToExtend = parseInt(extendMinutes, 10);
    if (isNaN(minutesToExtend) || minutesToExtend <= 0) {
      return res.status(400).json({ message: 'extendMinutes must be a positive number.' });
    }

    const item = await findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Auction item not found.' });
    }

    if (item.sellerUuid !== currentUserUuid && !isAdmin) {
      return res.status(403).json({ message: 'Only the seller or admin can extend this auction.' });
    }

    const newEndTime = new Date(item.endTime.getTime() + minutesToExtend * 60000);
    item.endTime = newEndTime;
    await item.save();

    res.status(200).json({ message: 'Auction end time extended successfully.', endTime: item.endTime });
  } catch (error) {
    console.error('Error extending auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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


const resetReportsForItem = async (req, res) => {
  try {
    const auctionItemId = req.params.id;

    // 1. Delete all reports for the auction item
    await Report.deleteMany({ auctionItemId: auctionItemId });

    // 2. Reset the reportCount on the auction item
    const updatedItem = await AuctionItem.findByIdAndUpdate(
      auctionItemId,
      { reportCount: 0 },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    res.json({ message: '신고 내역이 성공적으로 초기화되었습니다.', item: updatedItem });
  } catch (error) {
    console.error('Error resetting reports:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


const getBidAuctions = async (req, res) => {
  try {
    const bidderUuid = req.user.uuid; // from authMiddleware
    const items = await AuctionItem.find({ 
      'bids.bidderUuid': bidderUuid,
      hidden_for_bidders: { $ne: bidderUuid } 
    }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const hideAuctionsForBidder = async (req, res) => {
  try {
    const bidderUuid = req.user.uuid;
    const { auctionIds } = req.body;

    if (!Array.isArray(auctionIds)) {
      return res.status(400).json({ message: 'auctionIds must be an array.' });
    }

    await AuctionItem.updateMany(
      { _id: { $in: auctionIds }, 'bids.bidderUuid': bidderUuid },
      { $addToSet: { hidden_for_bidders: bidderUuid } }
    );

    res.json({ message: 'Selected auctions have been hidden from your bid history.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all auction items the current user is selling
// @route   GET /api/auctions/selling/me
// @access  Private
const getSellingAuctions = async (req, res) => {
  try {
    const sellerUuid = req.user.uuid; // from authMiddleware
    const items = await AuctionItem.find({ 
      sellerUuid, 
      hidden_for_seller: { $ne: true } 
    }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const hideAuctionsForSeller = async (req, res) => {
  try {
    const sellerUuid = req.user.uuid;
    const { auctionIds } = req.body;

    if (!Array.isArray(auctionIds)) {
      return res.status(400).json({ message: 'auctionIds must be an array.' });
    }

    await AuctionItem.updateMany(
      { _id: { $in: auctionIds }, sellerUuid, status: { $ne: 'active' } },
      { $set: { hidden_for_seller: true } }
    );

    res.json({ message: 'Selected auctions have been hidden from your selling history.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
  resetReportsForItem,
  getBidAuctions,
  getSellingAuctions, // Export the new function
  processEndedAuctions, // Export for scheduler
  markPaid,
  markCompleted,
  cancelAuction,
  extendAuctionEndTime,
  hideAuctionsForBidder,
  hideAuctionsForSeller,
};
