import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode'; // Correct import

const detailContainerStyle = {
  padding: '20px',
  maxWidth: '800px',
  margin: 'auto',
};

const imageStyle = {
  maxWidth: '100%',
  maxHeight: '500px',
  borderRadius: '8px',
};

const biddingCardStyle = {
  border: '1px solid #007bff',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '20px',
  backgroundColor: '#f8f9fa',
};

function AuctionItemDetail() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const { id } = useParams();
  const socketRef = useRef(null);

  useEffect(() => {
    // Fetch initial item data
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auctions/${id}`);
        if (!res.ok) throw new Error('아이템을 찾을 수 없습니다.');
        const data = await res.json();
        setItem(data);
        setBidAmount(data.currentPrice + 1); // Set initial bid amount
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();

    // --- WebSocket Connection ---
    const token = localStorage.getItem('token');
    if (token) {
      // Connect to the socket server with the token
      socketRef.current = io('http://localhost:3001', {
        auth: { token },
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected!');
        // Join the room for this specific item
        socket.emit('join_room', id);
      });

      // Listen for bid updates from the server
      socket.on('bid_update', (updatedItem) => {
        console.log('Received bid update:', updatedItem);
        setItem(updatedItem);
      });

      // Listen for bidding errors from the server
      socket.on('bid_error', (error) => {
        alert(`입찰 오류: ${error.message}`);
      });

      // Cleanup on component unmount
      return () => {
        console.log('Disconnecting socket...');
        socket.disconnect();
      };
    }
  }, [id]);

  const handleBidSubmit = (e) => {
    e.preventDefault();
    if (socketRef.current) {
      socketRef.current.emit('new_bid', { itemId: id, bidAmount: Number(bidAmount) });
    }
  };

  // --- Render Logic ---
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!item) return <div>Item not found.</div>;

  const token = localStorage.getItem('token');
  let currentUserUuid = null;
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserUuid = decodedToken.uuid;
    } catch (e) {
      console.error("Invalid token");
    }
  }

  const isSeller = item.sellerUuid === currentUserUuid;
  const canBid = token && !isSeller && new Date() < new Date(item.endTime);

  return (
    <div style={detailContainerStyle}>
      <h2>{item.title}</h2>
      <img src={`/${item.imagePath}`} alt={item.title} style={imageStyle} />
      <p><strong>판매자 UUID:</strong> {item.sellerUuid}</p>
      <p><strong>판매자 평판:</strong> {item.sellerReputationScore}점</p>
      <h3>현재 최고 입찰가: {item.currentPrice.toLocaleString()}원</h3>
      <p><strong>마감 시간:</strong> {new Date(item.endTime).toLocaleString()}</p>
      <p><strong>등록일:</strong> {new Date(item.createdAt).toLocaleString()}</p>

      {canBid && (
        <div style={biddingCardStyle}>
          <h4>입찰하기</h4>
          <form onSubmit={handleBidSubmit}>
            <input 
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={item.currentPrice + 1}
              required
            />
            <button type="submit" style={{ marginLeft: '10px' }}>입찰</button>
          </form>
        </div>
      )}

      {isSeller && <p>자신이 등록한 물품입니다.</p>}
      {!token && <p>로그인 후 입찰에 참여할 수 있습니다.</p>}

      <div>
        <h4>입찰 내역</h4>
        <ul>
          {item.bids.slice().reverse().map((bid, index) => (
            <li key={index}>
              {new Date(bid.timestamp).toLocaleString()}: {bid.amount.toLocaleString()}원 (입찰자: {bid.bidderUuid.substring(0, 8)}...)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AuctionItemDetail;
