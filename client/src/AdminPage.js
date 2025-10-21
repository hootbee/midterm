import React, { useState, useEffect } from 'react';

function AdminPage() {
  const [view, setView] = useState('userSearch'); // 'userSearch' or 'reportedItems'

  return (
    <div>
      <h1>관리자 페이지</h1>
      <nav>
        <button onClick={() => setView('userSearch')}>사용자 검색</button>
        <button onClick={() => setView('reportedItems')} style={{ marginLeft: '10px' }}>신고된 게시물</button>
      </nav>

      {view === 'userSearch' && <UserSearch />}
      {view === 'reportedItems' && <ReportedItems />}
    </div>
  );
}

const UserSearch = () => {
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
};

const ReportedItems = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReportedItems = async () => {
      const token = localStorage.getItem('token');
      try {
        // This endpoint needs to be created on the backend
        const res = await fetch('/api/auctions/reported', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error('Error fetching reported items:', err);
      }
    };
    fetchReportedItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const fetchReports = async () => {
        const token = localStorage.getItem('token');
        try {
          // This endpoint also needs to be created
          const res = await fetch(`/api/reports/${selectedItem._id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setReports(data);
          }
        } catch (err) {
          console.error('Error fetching reports:', err);
        }
      };
      fetchReports();
    }
  }, [selectedItem]);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>신고된 게시물 목록</h3>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
          {items.map(item => (
            <div key={item._id} onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee' }}>
              <p><strong>{item.title}</strong> (신고: {item.reportCount}회)</p>
            </div>
          ))}
        </div>
        <div style={{ width: '50%', paddingLeft: '10px' }}>
          {selectedItem ? (
            <div>
              <h4>'{selectedItem.title}' 신고 내역</h4>
              {reports.length > 0 ? (
                <ul>
                  {reports.map(report => (
                    <li key={report._id}>
                      <p><strong>신고자:</strong> {report.reporterUuid}</p>
                      <p><strong>사유:</strong> {report.reason}</p>
                      <p><strong>신고일:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : <p>신고 내역이 없습니다.</p>}
            </div>
          ) : <p>목록에서 아이템을 선택하여 신고 내역을 확인하세요.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
