const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  auctionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionItem',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  reporterUuid: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);

const deleteAllReportsByAuctionItemId = async (auctionItemId) => {
  return await Report.deleteMany({ auctionItemId });
};

module.exports = {
  Report,
  deleteAllReportsByAuctionItemId,
};
