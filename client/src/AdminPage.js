import React, { useState } from 'react';

function AdminPage() {
  const [uuid, setUuid] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!uuid) {
      setError('Please enter a UUID to search.');
      setUserData(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication error. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`/api/users/search/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUserData(data);
        setError('');
      } else {
        setUserData(null);
        setError(data.message || 'User not found.');
      }
    } catch (err) {
      setUserData(null);
      setError('An error occurred while searching.');
      console.error('Search error:', err);
    }
  };

  return (
    <div>
      <h1>관리자 페이지</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>사용자 검색 (UUID)</h3>
        <input 
          type="text" 
          value={uuid} 
          onChange={(e) => setUuid(e.target.value)} 
          placeholder="Enter user UUID"
          style={{ width: '300px', padding: '5px' }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '10px' }}>검색</button>
      </div>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      {userData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <h4>검색 결과</h4>
          <p><strong>이메일:</strong> {userData.email}</p>
          <p><strong>UUID:</strong> {userData.uuid}</p>
          <p><strong>이름:</strong> {userData.name}</p>
          <p><strong>학번:</strong> {userData.student_id}</p>
          <p><strong>평판 점수:</strong> {userData.reputation_score}</p>
          <p><strong>가입일:</strong> {new Date(userData.created_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
