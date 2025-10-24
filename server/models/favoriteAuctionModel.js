const mongoose = require('mongoose');

const favoriteAuctionSchema = new mongoose.Schema({
  userUuid: {
    type: String,
    required: true,
  },
  auctionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionItem',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can favorite an item only once
favoriteAuctionSchema.index({ userUuid: 1, auctionItemId: 1 }, { unique: true });

const FavoriteAuction = mongoose.model('FavoriteAuction', favoriteAuctionSchema);

module.exports = FavoriteAuction;
