const mongoose = require('mongoose');

const auctionItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imagePath: { // Storing the path to the uploaded file
    type: String,
    required: true,
  },
  filePath: { // Storing the path to the protected auction file
    type: String,
    required: true,
  },
  startPrice: {
    type: Number,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  sellerEmail: { // To link to the user who created it
    type: String,
    required: true,
  },
  sellerUuid: {
    type: String,
    required: true,
  },
  sellerReputationScore: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  highestBidderUuid: {
    type: String,
    default: null,
  },
  bids: [
    {
      bidderUuid: String,
      amount: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

// Function to find all auction items
const findAllAuctionItems = async () => {
  // Sort by newest first
  return await AuctionItem.find().sort({ createdAt: -1 });
};

// Function to find a single auction item by ID
const findById = async (id) => {
  return await AuctionItem.findById(id);
};

module.exports = {
  AuctionItem,
  findAllAuctionItems,
  findById,
};
