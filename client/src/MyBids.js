
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const MyBids = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyBids = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        const response = await fetch('/api/auctions/bids/me', {
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

    fetchMyBids();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>My Bidded Auctions</h1>
      {items.length === 0 ? (
        <p>You have not bid on any items yet.</p>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <div key={item._id} className="item-card">
              <Link to={`/auction/${item._id}`}>
                <img src={`/${item.imagePath}`} alt={item.title} />
                <h3>{item.title}</h3>
                <p>Current Price: {item.currentPrice.toLocaleString()} KRW</p>
                <p>End Time: {new Date(item.endTime).toLocaleString()}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;
