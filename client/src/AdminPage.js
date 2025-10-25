import React, { useState, useEffect } from 'react';


function AdminPage() {
  const [view, setView] = useState('userSearch'); // 'userSearch', 'reportedItems', or 'allUsers'

  return (
    <div>
      <h1>관리자 페이지</h1>
      <nav>
        <button onClick={() => setView('userSearch')}>사용자 검색</button>
        <button onClick={() => setView('reportedItems')} style={{ marginLeft: '10px' }}>신고된 게시물</button>
        <button onClick={() => setView('allUsers')} style={{ marginLeft: '10px' }}>모든 사용자 조회</button>
      </nav>

      {view === 'userSearch' && <UserSearch />}
      {view === 'reportedItems' && <ReportedItems />}
      {view === 'allUsers' && <AllUsers />}
    </div>
  );
}

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users?page=${currentPage}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users);
          setTotalPages(data.totalPages);
          setError('');
        } else {
          setError(data.message || 'Failed to fetch users.');
        }
      } catch (err) {
        setError('An error occurred while fetching users.');
        console.error('Fetch users error:', err);
      }
    };

    fetchUsers();
  }, [currentPage]);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>모든 사용자 목록</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>이름</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>이메일</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>학번</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>UUID</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>평판</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>잔액</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>가입일</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uuid} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px' }}>{user.name}</td>
              <td style={{ padding: '8px' }}>{user.email}</td>
              <td style={{ padding: '8px' }}>{user.student_id}</td>
              <td style={{ padding: '8px' }}>{user.uuid}</td>
              <td style={{ padding: '8px' }}>{user.reputation_score}</td>
              <td style={{ padding: '8px' }}>{user.balance.toLocaleString()}원</td>
              <td style={{ padding: '8px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
          이전
        </button>
        <span style={{ margin: '0 10px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
          다음
        </button>
      </div>
    </div>
  );
};



const UserSearch = () => {
  const [uuid, setUuid] = useState('');
  const [userData, setUserData] = useState(null);
  const [newReputationScore, setNewReputationScore] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setNewReputationScore(userData.reputation_score);
    }
  }, [userData]);

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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/search/${uuid}`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${uuidToDelete}`, {
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

  const handleReputationUpdate = async () => {
    if (!userData) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication error. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userData.uuid}/reputation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reputationScore: newReputationScore }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('평판 점수가 성공적으로 수정되었습니다.');
        // Refresh user data to show the updated score
        setUserData({ ...userData, reputation_score: newReputationScore });
      } else {
        setError(data.message || 'Failed to update reputation score.');
      }
    } catch (err) {
      setError('An error occurred while updating the score.');
      console.error('Reputation update error:', err);
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
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <strong>평판 점수:</strong>
            <input
              type="number"
              value={newReputationScore}
              onChange={(e) => setNewReputationScore(e.target.value)}
              step="10"
              style={{ margin: '0 10px', width: '100px' }}
            />
            <button onClick={handleReputationUpdate}>수정</button>
          </div>
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
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/reported`, {
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
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/${selectedItem._id}`, {
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

  const handleResetReports = async (itemId) => {
    if (!window.confirm('정말로 이 게시물의 신고 내역을 모두 삭제하고 신고 횟수를 0으로 초기화하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/${itemId}/reset-reports`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Update the local state
        setItems(prevItems =>
          prevItems.map(item =>
            item._id === itemId ? { ...item, reportCount: 0 } : item
          )
        );
        setReports([]); // Clear reports for the selected item if it's this one
        alert('신고 내역이 성공적으로 초기화되었습니다.');
      } else {
        const data = await res.json();
        alert(`초기화 실패: ${data.message || res.statusText}`);
      }
    } catch (err) {
      console.error('Error resetting reports:', err);
      alert('초기화 중 오류가 발생했습니다.');
    }
  };

  const handleDecreaseReputation = async (sellerUuid) => {
    if (!sellerUuid) {
      alert('판매자 정보를 찾을 수 없습니다.');
      return;
    }
    if (!window.confirm('정말로 이 판매자의 평판 점수를 50점 하락시키겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 1. Get current user data to find current reputation score
      const userRes = await fetch(`${process.env.REACT_APP_API_URL}/api/users/search/${sellerUuid}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userRes.ok) {
        const errorData = await userRes.json();
        const message = errorData.message || '판매자 정보를 가져오는 데 실패했습니다.';
        throw new Error(message);
      }

      const userData = await userRes.json();
      const currentScore = userData.reputation_score;
      const newScore = currentScore - 50;

      // 2. Update the reputation score
      const updateRes = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${sellerUuid}/reputation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reputationScore: newScore }),
      });

      if (!updateRes.ok) {
        throw new Error('평판 점수 업데이트에 실패했습니다.');
      }

      alert(`판매자의 평판 점수가 50점 하락했습니다. 현재 점수: ${newScore}`);

    } catch (err) {
      console.error('Error decreasing reputation:', err);
      alert(`오류 발생: ${err.message}`);
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/${itemId}`, {
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
              <button onClick={() => handleDecreaseReputation(selectedItem.sellerUuid)} style={{ marginLeft: '10px', backgroundColor: 'orange', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                평판 하락
              </button>
              <button onClick={() => handleResetReports(selectedItem._id)} style={{ marginLeft: '10px', backgroundColor: 'green', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                신고 초기화
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
