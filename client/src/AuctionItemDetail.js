import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auctions/${id}`);
        if (!res.ok) throw new Error('아이템을 찾을 수 없습니다.');
        const data = await res.json();
        setItem(data);
        setBidAmount(data.currentPrice + 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();

    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io('http://localhost:3001', { auth: { token } });
      const socket = socketRef.current;
      socket.on('connect', () => {
        console.log('Socket connected!');
        socket.emit('join_room', id);
      });
      socket.on('bid_update', (updatedItem) => {
        console.log('Received bid update:', updatedItem);
        setItem(updatedItem);
      });
      socket.on('bid_error', (error) => {
        alert(`입찰 오류: ${error.message}`);
      });
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

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 경매를 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/auctions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('경매가 삭제되었습니다.');
        navigate('/');
      } else {
        const data = await res.json();
        throw new Error(data.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(`삭제 오류: ${err.message}`);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/auctions/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '다운로드에 실패했습니다.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const disposition = res.headers.get('content-disposition');
      let filename = item.filePath.split('-').pop();
      if (disposition && disposition.includes('attachment')) {
        // filename="example.txt" 또는 filename=example.txt 모두 대응
        const filenameRegex = /filename[^;=\n]*=\s*(?:(['"])(.*?)\1|([^;\n]*))/;
        const matches = filenameRegex.exec(disposition);

        if (matches) {
          // 따옴표로 감싼 경우 → matches[2], 아닐 경우 → matches[3]
          filename = (matches[2] || matches[3]).trim();
          filename = filename.replace(/['"]/g, ''); // 불필요한 따옴표 제거
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`다운로드 오류: ${err.message}`);
    }
  };

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
  const isAuctionOver = new Date() > new Date(item.endTime);
  const isWinner = isAuctionOver && item.highestBidderUuid === currentUserUuid;
  const canBid = token && !isSeller && !isAuctionOver;

  return (
    <div style={detailContainerStyle}>
      <h2>{item.title}</h2>
      <img src={`/${item.imagePath}`} alt={item.title} style={imageStyle} />
      <p><strong>판매자 UUID:</strong> {item.sellerUuid}</p>
      <p><strong>판매자 평판:</strong> {item.sellerReputationScore}점</p>
      <h3>현재 최고 입찰가: {item.currentPrice.toLocaleString()}원</h3>
      <p><strong>마감 시간:</strong> {new Date(item.endTime).toLocaleString()}</p>
      <p><strong>등록일:</strong> {new Date(item.createdAt).toLocaleString()}</p>

      {isWinner && (
        <div style={biddingCardStyle}>
          <h4>경매 종료! 최종 낙찰자입니다.</h4>
          <button onClick={handleDownload}>족보 다운로드</button>
        </div>
      )}

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

      {isSeller && (
        <div>
          <p>자신이 등록한 물품입니다.</p>
          <button onClick={handleDelete} style={{ backgroundColor: 'red', color: 'white' }}>삭제하기</button>
        </div>
      )}
      {!token && <p>로그인 후 입찰에 참여할 수 있습니다.</p>}
      {isAuctionOver && !isWinner && <p>경매가 종료되었습니다.</p>}

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