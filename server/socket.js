const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');
const { AuctionItem, findById } = require('./models/auctionItemModel');
const { logBid } = require('./models/userModel');

function initializeSocket(io) {
  io.use(socketAuthMiddleware); // Apply the auth middleware to all connections

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.email} (Socket ID: ${socket.id})`);

    // Handler for joining a room
    socket.on('join_room', (itemId) => {
      socket.join(itemId);
      console.log(`${user.email} joined room for item: ${itemId}`);
    });

    // Handler for a new bid
    socket.on('new_bid', async ({ itemId, bidAmount }) => {
      try {
        const item = await findById(itemId);

        // --- Validation ---
        if (!item) {
          return socket.emit('bid_error', { message: '아이템을 찾을 수 없습니다.' });
        }
        if (new Date() > new Date(item.endTime)) {
          return socket.emit('bid_error', { message: '경매가 종료되었습니다.' });
        }
        if (user.uuid === item.sellerUuid) {
          return socket.emit('bid_error', { message: '자신이 등록한 물품에는 입찰할 수 없습니다.' });
        }
        if (bidAmount <= item.currentPrice) {
          return socket.emit('bid_error', { message: `입찰가는 현재 최고가(${item.currentPrice.toLocaleString()}원)보다 높아야 합니다.` });
        }

        // --- Anti-sniping rule ---
        const now = new Date();
        const endTime = new Date(item.endTime);
        if (endTime.getTime() - now.getTime() < 60000) { // Less than 1 minute
          item.endTime = new Date(now.getTime() + 60000); // Extend by 1 minute
          console.log(`Auction time extended for item ${itemId}`);
        }

        // --- Update DB ---
        item.currentPrice = bidAmount;
        item.highestBidderUuid = user.uuid;
        item.bids.push({ bidderUuid: user.uuid, amount: bidAmount });
        
        const updatedItem = await item.save();
        console.log(`New bid of ${bidAmount} for item ${itemId} by ${user.email}`);

        // --- Log bid to MariaDB for audit ---
        await logBid({
          auction_item_id: itemId,
          seller_uuid: item.sellerUuid,
          bidder_uuid: user.uuid,
          bid_amount: bidAmount,
        });

        // --- Broadcast update to all in the room ---
        io.to(itemId).emit('bid_update', updatedItem);

      } catch (error) {
        console.error('Bid processing error:', error);
        socket.emit('bid_error', { message: '입찰 처리 중 서버 오류가 발생했습니다.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });
  });
}

module.exports = initializeSocket;
