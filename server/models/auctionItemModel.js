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
const findAllAuctionItems = async ({ page, limit }) => {
  const skip = (page - 1) * limit;
  const totalItems = await AuctionItem.countDocuments();
  const items = await AuctionItem.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return { items, totalItems };
};

// Function to find a single auction item by ID
const findById = async (id) => {
  return await AuctionItem.findById(id);
};

// Function to delete an auction item by ID
const deleteById = async (id) => {
  return await AuctionItem.findByIdAndDelete(id);
};

module.exports = {
  AuctionItem,
  findAllAuctionItems,
  findById,
  deleteById,
};
