import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import './App.css';

const MyBids = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserUuid, setCurrentUserUuid] = useState(null);

  const handleDownload = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/${item._id}/download`, {
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
        const filenameRegex = /filename[^;=\n]*=\s*(?:(['"])(.*?)\1|([^;\n]*))/;
        const matches = filenameRegex.exec(disposition);

        if (matches) {
          filename = (matches[2] || matches[3]).trim();
          filename = filename.replace(/['"]/g, '');
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

  const fetchMyBids = async () => {
    try {
      setLoading(true); // Set loading to true when fetching starts
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/bids/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bid items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserUuid(decodedToken.uuid);
      } catch (e) {
        console.error("Invalid token");
        setCurrentUserUuid(null);
      }
    }

    fetchMyBids();
  }, []);


  const updateTransactionStatus = async (itemId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/${itemId}/mark-${newStatus}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '상태 변경에 실패했습니다.');
      }

      alert(`거래 상태가 '${newStatus}'(으)로 변경되었습니다.`);
      fetchMyBids(); // Refetch items to update the UI
    } catch (err) {
      alert(`상태 변경 오류: ${err.message}`);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('정말로 모든 입찰 내역을 숨기시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const auctionIds = items.map(item => item._id);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/hide-for-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionIds }),
      });

      if (res.ok) {
        alert('입찰 내역이 성공적으로 숨김 처리되었습니다.');
        fetchMyBids(); // Refresh the list
      } else {
        const data = await res.json();
        throw new Error(data.message || '내역 숨김에 실패했습니다.');
      }
    } catch (err) {
      alert(`오류: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>My Bidded Auctions</h1>
      {items.length > 0 && (
        <button onClick={handleClearHistory} style={{ marginBottom: '20px', backgroundColor: '#dc3545', color: 'white' }}>
          모든 내역 삭제
        </button>
      )}
      {items.length === 0 ? (
        <p>You have not bid on any items yet.</p>
      ) : (
        <div className="item-grid">
          {items.map((item) => {
            const isWinner = item.winnerUuid === currentUserUuid;
            let transactionStatusText = '-';
            switch (item.transactionStatus) {
              case 'none': transactionStatusText = '거래 전'; break;
              case 'pending_payment': transactionStatusText = '결제 대기 중'; break;
              case 'paid': transactionStatusText = '결제 완료'; break;
              case 'completed': transactionStatusText = '거래 완료'; break;
              default: break;
            }

            return (
              <div key={item._id} className="item-card">
                <Link to={`/auction/${item._id}`}>
                  <img src={`/${item.imagePath}`} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p>현재 가격: {item.currentPrice.toLocaleString()} KRW</p>
                  <p>마감 시간: {new Date(item.endTime).toLocaleString()}</p>
                  <p>경매 상태: {item.status === 'active' ? '진행 중' : item.status === 'ended' ? '마감됨' : item.status === 'sold' ? '판매됨' : '취소됨'}</p>
                  {item.status !== 'active' && item.winnerUuid && (
                    <p>거래 상태: {transactionStatusText}</p>
                  )}
                  {isWinner && item.status === 'ended' && (
                    <p style={{ fontWeight: 'bold', color: 'green' }}>🎉 낙찰되었습니다!</p>
                  )}
                </Link>
                {isWinner && item.status === 'ended' && item.transactionStatus === 'pending_payment' && (
                  <button onClick={() => updateTransactionStatus(item._id, 'paid')} style={{ marginTop: '10px' }}>결제 완료</button>
                )}
                {isWinner && item.status === 'ended' && item.transactionStatus === 'paid' && (
                  <button onClick={() => updateTransactionStatus(item._id, 'completed')} style={{ marginTop: '10px' }}>거래 완료</button>
                )}
                {isWinner && item.transactionStatus === 'completed' && (
                  <button onClick={() => handleDownload(item)} style={{ marginTop: '10px' }}>족보 다운로드</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBids;