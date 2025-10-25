const Comment = require('../models/commentModel');
const { AuctionItem, findById } = require('../models/auctionItemModel');

// @desc    Create a new comment for an auction item
// @route   POST /api/auctions/:auctionItemId/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const { content, parentId } = req.body;
    const commenterUuid = req.user.uuid; // From authMiddleware

    if (!content) {
      return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const auctionItem = await findById(auctionItemId);
    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction item not found.' });
    }

    let nickname;
    let commentOrder = null;

    if (auctionItem.sellerUuid === commenterUuid) {
      nickname = '판매자';
    } else {
      // Check if this user (commenterUuid) has already posted an anonymous comment on this auction item
      const existingAnonymousComment = await Comment.findOne(
        { auctionItemId, commenterUuid, nickname: { $ne: '판매자' } },
        { nickname: 1, commentOrder: 1 }
      );

      if (existingAnonymousComment) {
        // If an existing anonymous comment is found, reuse its nickname and commentOrder
        nickname = existingAnonymousComment.nickname;
        commentOrder = existingAnonymousComment.commentOrder;
      } else {
        // If no existing anonymous comment, assign a new one
        const highestComment = await Comment.findOne(
          { auctionItemId, nickname: { $ne: '판매자' } },
          { commentOrder: 1 },
          { sort: { commentOrder: -1 } }
        );
        commentOrder = (highestComment && highestComment.commentOrder) ? highestComment.commentOrder + 1 : 1;
        nickname = `익명${commentOrder}`;
      }
    }

    const newComment = new Comment({
      auctionItemId,
      commenterUuid,
      content,
      nickname,
      commentOrder,
      parentId: parentId || null, // Assign parentId if provided, otherwise null
    });

    const savedComment = await newComment.save();

    res.status(201).json(savedComment);

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all comments for an auction item
// @route   GET /api/auctions/:auctionItemId/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const { auctionItemId } = req.params;

    const comments = await Comment.find({ auctionItemId }).sort({ createdAt: 1 });

    const nestedComments = [];
    const commentMap = new Map();

    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parentId) {
        const parentComment = commentMap.get(comment.parentId.toString());
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment._id.toString()));
        }
      } else {
        nestedComments.push(commentMap.get(comment._id.toString()));
      }
    });

    // Sort top-level comments by createdAt, and their replies by createdAt
    nestedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    nestedComments.forEach(comment => {
      comment.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    res.json(nestedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private (commenter or admin only)
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    if (!content) {
      return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Check if user is the commenter or an admin
    if (comment.commenterUuid !== userUuid && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this comment.' });
    }

    comment.content = content;
    comment.updatedAt = new Date(); // Manually update updatedAt
    const updatedComment = await comment.save();

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private (commenter or admin only)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Check if user is the commenter or an admin
    if (comment.commenterUuid !== userUuid && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment.' });
    }

    await comment.deleteOne(); // Use deleteOne() on the document instance

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete all comments for a specific auction item
// @route   DELETE /api/auctions/:auctionItemId/comments
// @access  Private (seller or admin)
const deleteCommentsForAuction = async (req, res) => {
  try {
    const { auctionItemId } = req.params;
    const userUuid = req.user.uuid;
    const isAdmin = req.user.admin;

    const auctionItem = await findById(auctionItemId);
    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction item not found.' });
    }

    if (auctionItem.sellerUuid !== userUuid && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete comments for this auction.' });
    }

    const result = await Comment.deleteMany({ auctionItemId });

    res.status(200).json({
      message: 'All comments for the auction deleted successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting comments for auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  deleteCommentsForAuction,
};
