const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');
const { AuctionItem, findById } = require('./models/auctionItemModel');
const { logBid, findUserByUuid } = require('./models/userModel');
const DMMessage = require('./models/dmMessageModel');
const DMRoom = require('./models/dmRoomModel');

const roomUserCounts = {}; // { auctionId: viewerCount }

// Map to store user UUID to socket ID for direct messaging
const userSocketMap = new Map(); // userUuid -> socket.id

function initializeSocket(io) {
  io.use(socketAuthMiddleware); // Apply the auth middleware to all connections

  const updateCounts = () => {
    const rooms = io.sockets.adapter.rooms;
    const newCounts = {};
    for (const [roomId, clients] of rooms.entries()) {
      if (roomId.startsWith('auction_')) {
        newCounts[roomId] = clients.size;
      }
    }

    // Update the global object by removing rooms that no longer exist
    for (const roomId in roomUserCounts) {
      if (!newCounts[roomId]) {
        delete roomUserCounts[roomId];
      }
    }
    // Add or update current rooms
    Object.assign(roomUserCounts, newCounts);

    io.emit('global_room_user_counts', roomUserCounts);
  };

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.email} (Socket ID: ${socket.id})`);

    // Store user's socket ID
    userSocketMap.set(user.uuid, socket.id);

    // Handler for joining a room (for auction items)
    socket.on('join_room', (itemId) => {
      socket.join(itemId); // For bidding logic
      console.log(`${user.email} joined room for item: ${itemId}`);

      const roomName = `auction_${itemId}`;
      socket.join(roomName); // For viewer count logic
      console.log(`✅ ${socket.id} joined viewer room: ${roomName}`);
      updateCounts();
    });

    // Handler for joining a DM room
    socket.on('dm:joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`${user.email} joined DM room: ${roomId}`);
    });

    socket.on('cheer', ({ itemId }) => {
      io.to(itemId).emit('cheer_broadcast');
    });

    // Handler for sending a DM message
    socket.on('dm:message', async ({ roomId, receiverUuid, content }) => {
      try {
        if (!roomId || !receiverUuid || !content) {
          return socket.emit('dm:error', { message: 'Room ID, receiver UUID, and content are required.' });
        }

        const dmRoom = await DMRoom.findById(roomId);
        if (!dmRoom) {
          return socket.emit('dm:error', { message: 'DM room not found.' });
        }

        if (!dmRoom.participants.includes(user.uuid)) {
          return socket.emit('dm:error', { message: 'Not authorized to send message in this room.' });
        }

        const newMessage = new DMMessage({
          roomId,
          senderUuid: user.uuid,
          receiverUuid,
          content,
        });
        await newMessage.save();
        console.log('DMMessage saved:', newMessage._id);

        dmRoom.lastMessage = newMessage._id;
        dmRoom.updatedAt = new Date();
        await dmRoom.save();
        console.log('DMRoom lastMessage updated for room:', dmRoom._id);

        io.to(roomId).emit('dm:message', newMessage);

        console.log(`DM message sent in room ${roomId} from ${user.uuid} to ${receiverUuid}: ${content}`);
      } catch (error) {
        console.error('Error sending DM message:', error);
        socket.emit('dm:error', { message: 'DM 메시지 전송 중 서버 오류가 발생했습니다.' });
      }
    });

    // Handler for a new bid
    socket.on('new_bid', async ({ itemId, bidAmount }) => {
      try {
        const bidder = await findUserByUuid(user.uuid);
        if (!bidder) {
            return socket.emit('bid_error', { message: '사용자 정보를 찾을 수 없습니다.' });
        }
        if (bidder.balance < bidAmount) {
            return socket.emit('bid_error', { message: `잔액이 부족합니다. (현재 잔액: ${bidder.balance.toLocaleString()}원)` });
        }

        const item = await findById(itemId);

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

        const now = new Date();
        const endTime = new Date(item.endTime);
        if (endTime.getTime() - now.getTime() < 60000) { // Less than 1 minute
          item.endTime = new Date(endTime.getTime() + 60000); // Extend by 1 minute from the original end time
          console.log(`Auction time extended for item ${itemId}`);
        }

        item.currentPrice = bidAmount;
        item.highestBidderUuid = user.uuid;
        item.bids.push({ bidderUuid: user.uuid, amount: bidAmount });
        
        const updatedItem = await item.save();
        console.log(`New bid of ${bidAmount} for item ${itemId} by ${user.email}`);

        await logBid({
          auction_item_id: itemId,
          seller_uuid: item.sellerUuid,
          bidder_uuid: user.uuid,
          bid_amount: bidAmount,
        });

        io.to(itemId).emit('bid_update', updatedItem);

      } catch (error) {
        console.error('Bid processing error:', error);
        socket.emit('bid_error', { message: '입찰 처리 중 서버 오류가 발생했습니다.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
      userSocketMap.delete(user.uuid); // Remove user from map on disconnect
      setTimeout(updateCounts, 500); // Update counts after a short delay
    });
  });
}

module.exports = initializeSocket;
