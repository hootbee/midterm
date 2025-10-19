import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const itemCardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px',
  width: 'calc(50% - 32px)', // Two items per row
  boxSizing: 'border-box',
  display: 'flex',
  gap: '16px',
};

const thumbnailStyle = {
  width: '150px',
  height: '150px',
  objectFit: 'cover',
  borderRadius: '4px',
};

const containerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const formInputStyle = {
  marginTop: '10px',
};

function AuctionHouse() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // This is now a stateful component
  const CreateForm = () => {
    const [title, setTitle] = useState('');
    const [startPrice, setStartPrice] = useState('');
    const [endTime, setEndTime] = useState('');
    const [photo, setPhoto] = useState(null);

    const handleSubmit = async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      if (!photo || !title || !startPrice || !endTime) {
        alert('모든 필드를 채워주세요.');
        return;
      }

      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('title', title);
      formData.append('startPrice', startPrice);
      formData.append('endTime', endTime);

      try {
        const res = await fetch('/api/auctions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData, // Let the browser set the Content-Type for multipart/form-data
        });

        const data = await res.json();

        if (res.ok) {
          alert('경매 아이템이 성공적으로 등록되었습니다!');
          setShowCreateForm(false); // Go back to the list view
        } else {
          alert('등록 실패: ' + data.message);
        }
      } catch (error) {
        console.error('Item creation error:', error);
        alert('아이템 등록 중 오류가 발생했습니다.');
      }
    };

    return (
      <div>
        <h2>경매 물품 등록</h2>
        <form onSubmit={handleSubmit}>
          <div style={formInputStyle}>
            <label htmlFor="photo">사진 업로드 (jpg, png, pdf): </label>
            <input 
              type="file" 
              id="photo" 
              name="photo" 
              accept=".jpg, .jpeg, .png, .pdf" 
              onChange={(e) => setPhoto(e.target.files[0])} 
            />
          </div>
          <div style={formInputStyle}>
            <label htmlFor="title">제목: </label>
            <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={formInputStyle}>
            <label htmlFor="startPrice">경매 시작가: </label>
            <input type="number" id="startPrice" name="startPrice" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} />
          </div>
          <div style={formInputStyle}>
            <label htmlFor="endTime">마감 시간: </label>
            <input type="datetime-local" id="endTime" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div style={{ marginTop: '20px' }}>
            <button type="submit">등록하기</button>
            <button type="button" onClick={() => setShowCreateForm(false)} style={{ marginLeft: '10px' }}>
              목록으로 돌아가기
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ItemList = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
      const fetchItems = async () => {
        try {
          const res = await fetch('/api/auctions');
          const data = await res.json();
          if (res.ok) {
            setItems(data);
          } else {
            console.error('Failed to fetch items:', data.message);
          }
        } catch (error) {
          console.error('Error fetching items:', error);
        }
      };

      fetchItems();
    }, [showCreateForm]); // Refetch when we come back from the create form

    return (
      <div>
        <h2>경매장</h2>
        <button onClick={() => setShowCreateForm(true)} style={{ marginBottom: '20px' }}>작성하기</button>
        <div style={containerStyle}>
          {items.map(item => (
            <Link to={`/auction/${item._id}`} key={item._id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={itemCardStyle}>
                <img src={`/${item.imagePath}`} alt={item.title} style={thumbnailStyle} />
                <div>
                  <h3>{item.title}</h3>
                  <p>판매자 평판: {item.sellerReputationScore}점</p>
                  <p>판매자 UUID: {item.sellerUuid}</p>
                  <p>경매 시작가: {item.startPrice.toLocaleString()}원</p>
                  <p>마감 시간: {new Date(item.endTime).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return showCreateForm ? <CreateForm /> : <ItemList />;
}

export default AuctionHouse;
