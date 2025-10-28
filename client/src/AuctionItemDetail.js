import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import CommentSection from './CommentSection';
import BidPredictionBox from './BidPredictionBox';
import BidHistoryChart from './BidHistoryChart';
import './AuctionTension.css';
import { SOCKET_ENDPOINT, buildApiUrl } from './apiConfig';

/* ===================== 공통 스타일 ===================== */
const styles = {
  container: {
    position: 'relative',
    padding: '20px',
    maxWidth: '800px',
    margin: 'auto',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '500px',
    borderRadius: '8px',
  },
  biddingCard: {
    border: '1px solid #007bff',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.3s ease-in-out', // 부드러운 전환 효과
  },
  button: {
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

/* ===================== 상태 변환 함수 ===================== */
const getStatusLabel = (status) => {
  switch (status) {
    case 'active':
      return '판매 중';
    case 'sold':
      return '판매 완료';
    case 'ended':
      return '마감됨';
    case 'cancelled':
      return '취소됨';
    default:
      return '알 수 없음';
  }
};

/* ===================== 공통 Fetch Wrapper ===================== */
const authorizedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(buildApiUrl(url), { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '요청 실패');
  return data;
};

/* ===================== Countdown 컴포넌트 ===================== */
const Countdown = ({ endTime, onTick, className }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(endTime) - new Date();
      const secondsLeft = Math.floor(diff / 1000);

      if (onTick) {
        onTick(secondsLeft > 0 ? secondsLeft : 0);
      }

      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('경매 종료');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, onTick]);

  return <span className={className}>{timeLeft}</span>;
};

/* ===================== 메인 컴포넌트 ===================== */
function AuctionItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const itemRef = useRef(null);

  const [item, setItem] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeExtended, setTimeExtended] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const audioRef = useRef(null);

  // 오디오 효과
  useEffect(() => {
    // 컴포넌트 마운트 시 오디오 객체 생성, 언마운트 시 정리
    audioRef.current = new Audio('/tick.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === 10) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // 다시 재생하기 위해 오디오를 처음으로 되감기
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    } else if (secondsLeft === 0) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [secondsLeft]);

  const getUrgencyClass = (seconds) => {
    if (seconds === null || seconds > 30) return '';
    if (seconds > 10) return 'tension-soft';
    if (seconds > 5) return 'tension-mid';
    return 'tension-hard';
  };

  const token = localStorage.getItem('token');
  let currentUserUuid = null;
  if (token) {
    try {
      currentUserUuid = jwtDecode(token).uuid;
    } catch {}
  }

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await authorizedFetch(`/api/auctions/${id}`, { method: 'GET' });
      setItem(data);
      setBidAmount(data.currentPrice + 1);
      if (data.endTime) setNewEndTime(new Date(data.endTime).toISOString().slice(0, 16));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteStatus = async () => {
    if (!token) return;
    try {
      const data = await authorizedFetch(`/api/favorites/status/${id}`);
      setIsFavorited(data.isFavorited);
    } catch {
      setIsFavorited(false);
    }
  };

  useEffect(() => {
    const updateRecentlyViewed = (itemId) => {
      const MAX_ITEMS = 5;
      let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      // Remove the item if it already exists to move it to the front
      recentlyViewed = recentlyViewed.filter(i => i !== itemId);
      // Add the new item to the front
      recentlyViewed.unshift(itemId);
      // Trim the list if it's too long
      if (recentlyViewed.length > MAX_ITEMS) {
        recentlyViewed.pop();
      }
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    };

    fetchItem();
    fetchFavoriteStatus();
    updateRecentlyViewed(id);
  }, [id]);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  /* ===================== Socket 설정 ===================== */
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_ENDPOINT, { auth: { token } });
    socketRef.current = socket;
    socket.emit('join_room', id);

    socket.on('bid_update', (updatedItem) => {
      if (itemRef.current && updatedItem.currentPrice > itemRef.current.currentPrice) {
        speak(`새 입찰 ${updatedItem.currentPrice}원`);
      }

      if (itemRef.current && new Date(updatedItem.endTime) > new Date(itemRef.current.endTime)) {
        setTimeExtended(true);
        setTimeout(() => setTimeExtended(false), 3000);
      }
      setItem(updatedItem);
    });

    socket.on('global_room_user_counts', (counts) => {
      const count = counts[`auction_${id}`] || 0;
      setViewerCount(count);
    });

    socket.on('bid_error', (err) => alert(`입찰 오류: ${err.message}`));
    return () => socket.disconnect();
  }, [id, token]);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  /* ===================== 주요 기능 핸들러 ===================== */
  const handleBid = (e) => {
    e.preventDefault();
    socketRef.current?.emit('new_bid', { itemId: id, bidAmount: Number(bidAmount) });
  };

  const handleFavorite = async () => {
    if (!token) return alert('로그인이 필요합니다.');
    try {
      const data = await authorizedFetch('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ auctionItemId: id }),
      });
      setIsFavorited(data.favorited);
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await authorizedFetch(`/api/auctions/${id}`, { method: 'DELETE' });
      alert('삭제 완료');
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e, updatedData) => {
    e.preventDefault();
    try {
      const updated = await authorizedFetch(`/api/auctions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      setItem(updated);
      setIsEditMode(false);
      alert('수정 완료');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEndTimeUpdate = async () => {
    try {
      const updated = await authorizedFetch(`/api/auctions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ endTime: newEndTime }),
      });
      setItem(updated);
      alert('마감 시간 수정 완료');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(buildApiUrl(`/api/auctions/${id}/download`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('다운로드 실패');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filePath.split('-').pop();
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`다운로드 오류: ${err.message}`);
    }
  };

  /* ===================== 렌더링 조건 ===================== */
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!item) return <div>아이템을 찾을 수 없습니다.</div>;

  const isSeller = item.sellerUuid === currentUserUuid;
  const isAuctionOver = new Date() > new Date(item.endTime);
  const isWinner = item.winnerUuid === currentUserUuid;
  const canBid = token && item.status === 'active' && !isSeller && !isAuctionOver;


  /* ===================== UI ===================== */
  if (isEditMode)
    return <EditForm item={item} onUpdate={handleUpdate} onCancel={() => setIsEditMode(false)} />;

  return (
      <div
          style={{
            ...styles.container,
            border: item.sellerReputationScore >= 100 ? '2px solid red' : undefined,
          }}
      >
        {/* 신용 배지 */}
        {item.sellerReputationScore >= 100 && (
            <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'red',
                  color: 'white',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontSize: '0.8em',
                }}
            >
              신용
            </div>
        )}

        <h2>{item.title}</h2>
        <p style={{ fontWeight: 600, color: '#ef4444' }}>
          👥 현재 {viewerCount}명 이 페이지를 보고 있습니다.
        </p>
        <img src={`/${item.imagePath}`} alt={item.title} style={styles.image} />
        <div
            style={{
              margin: '20px 0',
              whiteSpace: 'pre-wrap',
              border: '1px solid #eee',
              padding: '15px',
              borderRadius: '5px',
            }}
        >
          {item.content}
        </div>

        <p>판매자 UUID: {item.sellerUuid}</p>
        <p>판매자 평판: {item.sellerReputationScore}점</p>
        <h3>현재 최고 입찰가: {item.currentPrice.toLocaleString()}원</h3>
        <p>마감 시간: {new Date(item.endTime).toLocaleString()}</p>
        <p>남은 시간: <Countdown
            endTime={item.endTime}
            onTick={setSecondsLeft}
            className={secondsLeft !== null && secondsLeft <= 10 ? 'time-shake' : ''}
        /></p>
        {timeExtended && <p style={{ color: 'red' }}>⏱ 마감 시간이 연장되었습니다!</p>}

        {/* ✅ 상태 표시 부분 수정 */}
        <p>
          <strong>경매 상태:</strong>{' '}
          <span
              style={{
                color:
                    item.status === 'active'
                        ? '#007bff'
                        : item.status === 'sold'
                            ? 'green'
                            : item.status === 'cancelled'
                                ? 'red'
                                : 'gray',
                fontWeight: 600,
              }}
          >
          {getStatusLabel(item.status)}
        </span>
        </p>

        {token && (
            <button
                onClick={handleFavorite}
                style={{
                  ...styles.button,
                  backgroundColor: isFavorited ? '#ffc107' : '#007bff',
                  color: '#fff',
                  marginTop: '10px',
                }}
            >
              {isFavorited ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
            </button>
        )}

        {/* 입찰 경쟁 예측 */}
        {item.status === 'active' && (
            <BidPredictionBox
                bids={item.bids || []}
                currentPrice={item.currentPrice}
                endTime={item.endTime}
            />
        )}

        {/* 입찰 섹션 */}
        {canBid && (
            <div
                className={getUrgencyClass(secondsLeft)}
                style={{
                  ...styles.biddingCard,
                  backgroundColor: '#e8f4ff',
                  border: '2px solid #007bff',
                  color: '#000',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
            >
              <h4
                  style={{
                    color: '#007bff',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    marginBottom: '15px',
                  }}
              >
                💰 입찰하기
              </h4>
              <form onSubmit={handleBid}>
                <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={item.currentPrice + 1}
                    required
                    style={{
                      width: '150px',
                      padding: '8px',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                />
                <button
                    type="submit"
                    style={{
                      marginLeft: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                >
                  입찰
                </button>
              </form>
            </div>
        )}

        {/* 판매자 전용 */}
        {isSeller && (
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => setIsEditMode(true)}>수정하기</button>
              <button
                  onClick={handleDelete}
                  style={{
                    ...styles.button,
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    marginLeft: '10px',
                  }}
              >
                삭제하기
              </button>
              <div style={{ marginTop: '10px' }}>
                <label>마감 시간 수정:</label>
                <input
                    type="datetime-local"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                />
                <button onClick={handleEndTimeUpdate} style={{ marginLeft: '10px' }}>
                  수정
                </button>
              </div>
            </div>
        )}

        {/* 다운로드 */}
        {isWinner && item.transactionStatus === 'completed' && (
            <div
                style={{
                  ...styles.biddingCard,
                  backgroundColor: '#e8f4ff',
                  border: '2px solid #007bff',
                  color: '#000',
                }}
            >
              <h4 style={{ color: '#007bff', fontWeight: 700 }}>🎉 최종 낙찰자입니다!</h4>
              <button
                  onClick={handleDownload}
                  style={{
                    ...styles.button,
                    backgroundColor: '#007bff',
                    color: '#fff',
                    fontWeight: 600,
                  }}
              >
                족보 다운로드
              </button>
            </div>
        )}

        {/* 신고 */}
        <button onClick={() => setShowReportForm(true)} style={{ marginTop: '10px' }}>
          신고하기
        </button>
        {showReportForm && <ReportForm itemId={item._id} onCancel={() => setShowReportForm(false)} />}

        {/* 입찰 경쟁 현황 실시간 시각화 */}
        {item.bids && item.bids.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>입찰 경쟁 현황</h4>
            <BidHistoryChart bids={item.bids} />
          </div>
        )}

        {/* 입찰 내역 */}
        <div style={{ marginTop: '20px' }}>
          <h4>입찰 내역</h4>
          <ul>
            {item.bids
                .slice()
                .reverse()
                .map((b, i) => (
                    <li key={i}>
                      {new Date(b.timestamp).toLocaleString()}: {b.amount.toLocaleString()}원 (
                      {b.bidderUuid.substring(0, 8)}…)
                    </li>
                ))}
          </ul>
        </div>

        <CommentSection itemId={id} />
      </div>
  );
}

/* ===================== 신고 폼 ===================== */
const ReportForm = ({ itemId, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return alert('신고 사유를 선택하세요.');
    try {
      await authorizedFetch(`/api/auctions/${itemId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      alert('신고가 접수되었습니다.');
      onCancel();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
      <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
        <h4>게시물 신고</h4>
        <form onSubmit={handleSubmit}>
          <label>
            <input
                type="checkbox"
                checked={reason === '허위 게시물'}
                onChange={() =>
                    setReason(reason === '허위 게시물' ? '' : '허위 게시물')
                }
            />
            허위 게시물
          </label>
          <div style={{ marginTop: '10px' }}>
            <button type="submit">신고 접수</button>
            <button
                type="button"
                onClick={onCancel}
                style={{ marginLeft: '10px' }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
  );
};

/* ===================== 수정 폼 ===================== */
const EditForm = ({ item, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    title: item.title,
    content: item.content,
    startPrice: item.startPrice,
    endTime: new Date(item.endTime).toISOString().slice(0, 16),
  });

  const handleChange = (e) =>
      setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
      <div style={{ padding: '20px' }}>
        <h2>경매 정보 수정</h2>
        <form onSubmit={(e) => onUpdate(e, formData)}>
          <label>제목:</label>
          <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
          />
          <br />
          <label>내용:</label>
          <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              style={{ width: '100%', minHeight: '200px', marginTop: '10px' }}
          />
          <br />
          <label>시작가:</label>
          <input
              type="number"
              name="startPrice"
              value={formData.startPrice}
              onChange={handleChange}
          />
          <br />
          <label>마감 시간:</label>
          <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
          />
          <br />
          <button type="submit" style={{ marginTop: '10px' }}>
            수정 완료
          </button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>
            취소
          </button>
        </form>
      </div>
  );
};

export default AuctionItemDetail;