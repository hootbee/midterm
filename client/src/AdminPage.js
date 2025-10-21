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

  const handleDelete = async (uuidToDelete) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication error. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${uuidToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUserData(null);
        alert('사용자가 성공적으로 삭제되었습니다.');
        setUuid(''); // Clear search input
      } else {
        setError(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      setError('An error occurred while deleting the user.');
      console.error('Delete error:', err);
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
          <button onClick={() => handleDelete(userData.uuid)} style={{ marginTop: '10px', backgroundColor: 'red', color: 'white' }}>
            계정 삭제
          </button>
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

  const handleResetReportCount = async (itemId) => {
    if (!window.confirm('정말로 이 게시물의 신고 횟수를 초기화하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${itemId}/reset-report-count`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportCount: 0 }),
      });

      if (res.ok) {
        // Update the local state to reflect the change
        setItems(prevItems => 
          prevItems.map(item => 
            item._id === itemId ? { ...item, reportCount: 0 } : item
          )
        );
        alert('신고 횟수가 성공적으로 초기화되었습니다.');
      } else {
        const data = await res.json();
        alert(`신고 횟수 초기화 실패: ${data.message || res.statusText}`);
      }
    } catch (err) {
      console.error('Error resetting report count:', err);
      alert('신고 횟수 초기화 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAllReports = async (itemId) => {
    if (!window.confirm('정말로 이 게시물의 모든 신고 내역을 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/reports/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setReports([]); // Clear the reports list
        alert('모든 신고 내역이 성공적으로 삭제되었습니다.');
      } else {
        const data = await res.json();
        alert(`신고 내역 삭제 실패: ${data.message || res.statusText}`);
      }
    } catch (err) {
      console.error('Error deleting reports:', err);
      alert('신고 내역 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>신고된 게시물 목록</h3>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
          {items.map(item => (
            <div key={item._id} style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p onClick={() => setSelectedItem(item)}><strong>{item.title}</strong> (신고: {item.reportCount}회)</p>
              <button onClick={() => handleResetReportCount(item._id)} style={{ marginLeft: '10px', backgroundColor: 'blue', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                초기화
              </button>
            </div>
          ))}
        </div>
        <div style={{ width: '50%', paddingLeft: '10px' }}>
          {selectedItem ? (
            <div>
              <h4>'{selectedItem.title}' 신고 내역</h4>
              <button onClick={() => handleDeleteAllReports(selectedItem._id)} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                신고내역 전체 삭제하기
              </button>
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
