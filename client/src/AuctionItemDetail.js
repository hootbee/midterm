import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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

function AuctionItemDetail() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams(); // Get the ID from the URL

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auctions/${id}`);
        if (!res.ok) {
          throw new Error('Item not found');
        }
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]); // Rerun if the ID in the URL changes

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!item) {
    return <div>Item not found.</div>;
  }

  return (
    <div style={detailContainerStyle}>
      <h2>{item.title}</h2>
      <img src={`/${item.imagePath}`} alt={item.title} style={imageStyle} />
      <p><strong>판매자 UUID:</strong> {item.sellerUuid}</p>
      <p><strong>판매자 평판:</strong> {item.sellerReputationScore}점</p>
      <p><strong>경매 시작가:</strong> {item.startPrice.toLocaleString()}원</p>
      <p><strong>마감 시간:</strong> {new Date(item.endTime).toLocaleString()}</p>
      <p><strong>등록일:</strong> {new Date(item.createdAt).toLocaleString()}</p>
      {/* Bidding form can be added here later */}
    </div>
  );
}

export default AuctionItemDetail;