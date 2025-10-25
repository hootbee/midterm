import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './App.css'; // Assuming App.css has general styles

const MySelling = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserUuid, setCurrentUserUuid] = useState(null);

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

    fetchMySellingItems();
  }, []);

  const fetchMySellingItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      const response = await fetch('/api/auctions/selling/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch selling items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <h1>My Selling Items</h1>
      {items.length === 0 ? (
        <p>You are not selling any items or no items have ended yet.</p>
      ) : (
        <div className="item-grid">
          {items.map((item) => {
            const isSeller = item.sellerUuid === currentUserUuid;
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
                  <p>현재 가격: {item.currentPrice ? item.currentPrice.toLocaleString() : 'N/A'} KRW</p>
                  <p>마감 시간: {new Date(item.endTime).toLocaleString()}</p>
                  <p>경매 상태: {item.status === 'active' ? '진행 중' : item.status === 'ended' ? '마감됨' : item.status === 'sold' ? '판매됨' : '취소됨'}</p>
                  {item.status !== 'active' && item.winnerUuid && (
                    <p>거래 상태: {transactionStatusText}</p>
                  )}
                  {isSeller && item.status === 'ended' && item.winnerUuid && (
                    <p style={{ fontWeight: 'bold', color: 'blue' }}>판매 완료! 낙찰자: {item.winnerUuid.substring(0, 8)}...</p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySelling;
