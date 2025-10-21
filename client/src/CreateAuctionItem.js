import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const formContainerStyle = {
  padding: '20px',
  maxWidth: '800px',
  margin: 'auto',
};

const formInputStyle = {
  marginTop: '10px',
};

function CreateAuctionItem() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [endTime, setEndTime] = useState('');
  const [photo, setPhoto] = useState(null);
  const [itemFile, setItemFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!photo || !itemFile || !title || !content || !startPrice || !endTime) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('itemFile', itemFile);
    formData.append('title', title);
    formData.append('content', content);
    formData.append('startPrice', startPrice);
    formData.append('endTime', endTime);

    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('경매 아이템이 성공적으로 등록되었습니다!');
        navigate('/'); // Redirect to home page after successful creation
      } else {
        alert('등록 실패: ' + data.message);
      }
    } catch (error) {
      console.error('Item creation error:', error);
      alert('아이템 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2>경매 물품 등록</h2>
      <form onSubmit={handleSubmit}>
        <div style={formInputStyle}>
          <label htmlFor="photo">썸네일 사진 (jpg, png): </label>
          <input 
            type="file" 
            id="photo" 
            name="photo" 
            accept=".jpg, .jpeg, .png" 
            onChange={(e) => setPhoto(e.target.files[0])} 
            required
          />
        </div>
        <div style={formInputStyle}>
          <label htmlFor="itemFile">경매 파일 (jpg, png, pdf): </label>
          <input 
            type="file" 
            id="itemFile" 
            name="itemFile" 
            accept=".jpg, .jpeg, .png, .pdf" 
            onChange={(e) => setItemFile(e.target.files[0])} 
            required
          />
        </div>
        <div style={formInputStyle}>
          <label htmlFor="title">제목: </label>
          <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div style={formInputStyle}>
          <label htmlFor="content">내용: </label>
          <textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: '100%', minHeight: '200px' }} />
        </div>
        <div style={formInputStyle}>
          <label htmlFor="startPrice">경매 시작가: </label>
          <input type="number" id="startPrice" name="startPrice" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} required />
        </div>
        <div style={formInputStyle}>
          <label htmlFor="endTime">마감 시간: </label>
          <input type="datetime-local" id="endTime" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">등록하기</button>
          <button type="button" onClick={() => navigate('/')} style={{ marginLeft: '10px' }}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAuctionItem;
