import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import CommentSection from './CommentSection';

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
  const [newEndTime, setNewEndTime] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false); // New state for favorite status
  const { id } = useParams();
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Function to toggle favorite status
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionItemId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        alert(data.message);
      } else {
        const data = await res.json();
        throw new Error(data.message || '즐겨찾기 상태 변경 실패');
      }
    } catch (err) {
      alert(`즐겨찾기 오류: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auctions/${id}`);
        if (!res.ok) throw new Error('아이템을 찾을 수 없습니다.');
        const data = await res.json();
        setItem(data);
        setBidAmount(data.currentPrice + 1);
        if (data.endTime) {
          setNewEndTime(new Date(data.endTime).toISOString().slice(0, 16));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavoriteStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // Cannot fetch favorite status without being logged in

      try {
        const res = await fetch(`/api/favorites/status/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.isFavorited);
        } else if (res.status === 401) {
          // User is not authenticated, so not favorited
          setIsFavorited(false);
        } else {
          throw new Error('즐겨찾기 상태를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Error fetching favorite status:', err);
        setIsFavorited(false);
      }
    };

    fetchItem();
    fetchFavoriteStatus();

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

  const handleUpdate = async (e, updatedData) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/auctions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setItem(updatedItem);
        setIsEditMode(false);
        alert('경매 정보가 수정되었습니다.');
      } else {
        const data = await res.json();
        throw new Error(data.message || '수정에 실패했습니다.');
      }
    } catch (err) {
      alert(`수정 오류: ${err.message}`);
    }
  };

  const handleEndTimeUpdate = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/auctions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ endTime: newEndTime }),
        });

        if (res.ok) {
            const updatedItem = await res.json();
            setItem(updatedItem);
            alert('마감 시간이 수정되었습니다.');
        } else {
            const data = await res.json();
            throw new Error(data.message || '수정에 실패했습니다.');
        }
    } catch (err) {
        alert(`수정 오류: ${err.message}`);
    }
  };

  const handleUpdateTransactionStatus = async (statusType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!window.confirm(`정말로 ${statusType} 처리하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${id}/mark-${statusType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setItem(updatedItem);
        alert(`${statusType} 처리되었습니다.`);
      } else {
        const data = await res.json();
        throw new Error(data.message || `${statusType} 처리 실패`);
      }
    } catch (err) {
      alert(`${statusType} 처리 오류: ${err.message}`);
    }
  };

  const handleCancelAuction = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('정말로 경매를 취소하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setItem(updatedItem);
        alert('경매가 취소되었습니다.');
      } else {
        const data = await res.json();
        throw new Error(data.message || '경매 취소 실패');
      }
    } catch (err) {
      alert(`경매 취소 오류: ${err.message}`);
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
  const isWinner = item.winnerUuid === currentUserUuid; // Use item.winnerUuid
  const canBid = token && item.status === 'active' && !isSeller && !isAuctionOver; // Only if active

  let transactionStatusText = '-';
  switch (item.transactionStatus) {
    case 'none': transactionStatusText = '거래 전'; break;
    case 'pending_payment': transactionStatusText = '결제 대기 중'; break;
    case 'paid': transactionStatusText = '결제 완료'; break;
    case 'completed': transactionStatusText = '거래 완료'; break;
    default: break;
  }

  if (isEditMode) {
    return <EditForm item={item} onUpdate={handleUpdate} onCancel={() => setIsEditMode(false)} />;
  }

  return (
    <div style={detailContainerStyle}>
      <h2>{item.title}</h2>
      <img src={`/${item.imagePath}`} alt={item.title} style={imageStyle} />

      <div style={{ margin: '20px 0', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '15px', borderRadius: '5px' }}>
        {item.content}
      </div>

      <p><strong>판매자 UUID:</strong> {item.sellerUuid}</p>
      <p><strong>판매자 평판:</strong> {item.sellerReputationScore}점</p>
      <h3>현재 최고 입찰가: {item.currentPrice.toLocaleString()}원</h3>
      <p><strong>마감 시간:</strong> {new Date(item.endTime).toLocaleString()}</p>
      <p><strong>경매 상태:</strong> {item.status === 'active' ? '진행 중' : item.status === 'ended' ? '마감됨' : item.status === 'sold' ? '판매됨' : '취소됨'}</p>
      {item.status !== 'active' && item.winnerUuid && <p><strong>낙찰자 UUID:</strong> {item.winnerUuid}</p>}
      {item.status !== 'active' && item.winnerUuid && <p><strong>거래 상태:</strong> {transactionStatusText}</p>}
      {token && (
        <button onClick={handleToggleFavorite} style={{ marginTop: '10px', backgroundColor: isFavorited ? '#ffc107' : '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          {isFavorited ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
        </button>
      )}

      {/* Transaction Management Buttons */}
      {item.status === 'ended' && item.winnerUuid && item.transactionStatus !== 'completed' && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          {isWinner && item.transactionStatus === 'pending_payment' && (
            <button onClick={() => handleUpdateTransactionStatus('paid')} style={{ marginRight: '10px' }}>결제 완료</button>
          )}
          {isWinner && item.transactionStatus === 'paid' && (
            <button onClick={() => handleUpdateTransactionStatus('completed')} style={{ marginRight: '10px' }}>거래 완료</button>
          )}
        </div>
      )}

      {/* Cancel Auction Button */}
      {isSeller && item.status === 'active' && (
        <button onClick={handleCancelAuction} style={{ marginTop: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          경매 취소
        </button>
      )}
      {isSeller && item.status === 'active' && !isAuctionOver && (
        <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <label>마감 시간 수정: </label>
            <input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
            />
            <button onClick={handleEndTimeUpdate} style={{ marginLeft: '10px' }}>수정</button>
        </div>
      )}
      <p><strong>등록일:</strong> {new Date(item.createdAt).toLocaleString()}</p>

      {isWinner && item.transactionStatus === 'completed' && (
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
          <button onClick={() => setIsEditMode(true)}>수정하기</button>
          <button onClick={handleDelete} style={{ backgroundColor: 'red', color: 'white', marginLeft: '10px' }}>삭제하기</button>
        </div>
      )}

      <button onClick={() => setShowReportForm(true)} style={{ marginTop: '10px' }}>신고하기</button>

      {showReportForm && <ReportForm itemId={item._id} onCancel={() => setShowReportForm(false)} />}

      {!token && <p>로그인 후 입찰에 참여할 수 있습니다.</p>}
      {item.status !== 'active' && !isWinner && <p>경매가 종료되거나 취소되었습니다.</p>}

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
      <CommentSection itemId={id} />
    </div>
  );
}

const ReportForm = ({ itemId, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${itemId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        onCancel(); // Close the form
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(`신고 접수 오류: ${err.message}`);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
      <h4>게시물 신고</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={reason === '허위 게시물'}
              onChange={() => setReason(prev => prev === '허위 게시물' ? '' : '허위 게시물')}
            />
            허위 게시물
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button type="submit">신고 접수</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>취소</button>
        </div>
      </form>
    </div>
  );
};

const EditForm = ({ item, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    title: item.title,
    content: item.content,
    startPrice: item.startPrice,
    endTime: new Date(item.endTime).toISOString().slice(0, 16),
  });

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>경매 정보 수정</h2>
      <form onSubmit={(e) => onUpdate(e, formData)}>
        <div>
          <label>제목: </label>
          <input type="text" name="title" value={formData.title} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>내용: </label>
          <textarea name="content" value={formData.content} onChange={onChange} required style={{ width: '100%', minHeight: '200px' }} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>경매 시작가: </label>
          <input type="number" name="startPrice" value={formData.startPrice} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>마감 시간: </label>
          <input type="datetime-local" name="endTime" value={formData.endTime} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">수정 완료</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>취소</button>
        </div>
      </form>
    </div>
  );
};

export default AuctionItemDetail;