const FavoriteAuction = require('../models/favoriteAuctionModel');
const AuctionItem = require('../models/auctionItemModel'); // Assuming AuctionItem model is available

// @desc    Add or remove an auction item from favorites
// @route   POST /api/favorites/toggle
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const { auctionItemId } = req.body;
    const userUuid = req.user.uuid; // From authMiddleware

    if (!auctionItemId) {
      return res.status(400).json({ message: 'Auction item ID is required.' });
    }

    // Check if already favorited
    const existingFavorite = await FavoriteAuction.findOne({ userUuid, auctionItemId });

    if (existingFavorite) {
      // If exists, remove from favorites
      await FavoriteAuction.deleteOne({ _id: existingFavorite._id });
      res.status(200).json({ message: 'Item removed from favorites.', favorited: false });
    } else {
      // If not exists, add to favorites
      const newFavorite = new FavoriteAuction({
        userUuid,
        auctionItemId,
      });
      await newFavorite.save();
      res.status(200).json({ message: 'Item added to favorites.', favorited: true, favorite: newFavorite });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all favorite auction items for the authenticated user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userUuid = req.user.uuid;

    const favorites = await FavoriteAuction.find({ userUuid }).populate('auctionItemId');

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if an auction item is favorited by the authenticated user
// @route   GET /api/favorites/status/:auctionItemId
// @access  Private
const getFavoriteStatus = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const userUuid = req.user.uuid;

    const existingFavorite = await FavoriteAuction.findOne({ userUuid, auctionItemId });

    res.status(200).json({ isFavorited: !!existingFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a specific auction item from favorites
// @route   DELETE /api/favorites/:auctionItemId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const userUuid = req.user.uuid;

    const deletedFavorite = await FavoriteAuction.findOneAndDelete({ userUuid, auctionItemId });

    if (!deletedFavorite) {
      return res.status(404).json({ message: 'Favorite not found for this auction item.' });
    }

    res.status(200).json({ message: 'Favorite removed successfully.' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove all favorites for the authenticated user
// @route   DELETE /api/favorites
// @access  Private
const clearFavorites = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const result = await FavoriteAuction.deleteMany({ userUuid });

    res.status(200).json({
      message: 'All favorites cleared successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
  getFavoriteStatus,
  removeFavorite,
  clearFavorites,
};
