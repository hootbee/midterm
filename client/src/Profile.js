import React, { useState, useEffect } from 'react';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedStudentId, setEditedStudentId] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Initialize edit fields when user data is fetched
          setEditedName(data.name);
          setEditedEmail(data.email);
          setEditedStudentId(data.student_id);
        } else {
          const data = await res.json();
          setError(data.message || '프로필 정보를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('프로필 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, { // New endpoint
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedName,
          email: editedEmail,
          studentId: editedStudentId,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser); // Update local user state
        setIsEditing(false); // Exit edit mode
        alert('프로필 정보가 성공적으로 업데이트되었습니다.');
      } else {
        const data = await res.json();
        alert(`프로필 업데이트 실패: ${data.message || res.statusText}`);
      }
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleChargeBalance = async () => {
    const amount = window.prompt("얼마를 충전하시겠습니까?");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`충전이 완료되었습니다. 현재 잔액: ${data.newBalance.toLocaleString()}원`);
        // Update user state to reflect new balance
        setUser(prevUser => ({ ...prevUser, balance: data.newBalance }));
      } else {
        const data = await res.json();
        alert(`충전 실패: ${data.message || res.statusText}`);
      }
    } catch (err) {
      console.error('잔액 충전 오류:', err);
      alert('잔액 충전 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!user) {
    return <div>사용자 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div>
      <h1>내 프로필</h1>
      <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
        {isEditing ? (
          <>
            <p>
              <strong>이메일:</strong>{' '}
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                style={{ width: '200px', padding: '5px' }}
              />
            </p>
            <p>
              <strong>이름:</strong>{' '}
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{ width: '200px', padding: '5px' }}
              />
            </p>
            <p>
              <strong>학번:</strong>{' '}
              <input
                type="text"
                value={editedStudentId}
                onChange={(e) => setEditedStudentId(e.target.value)}
                style={{ width: '200px', padding: '5px' }}
              />
            </p>
            <p><strong>UUID:</strong> {user.uuid}</p>
            <p><strong>평판 점수:</strong> {user.reputation_score}</p>
            <p><strong>잔액:</strong> {user.balance ? user.balance.toLocaleString() : 0}원</p>
            <p><strong>가입일:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </>
        ) : (
          <>
            <p><strong>이메일:</strong> {user.email}</p>
            <p><strong>UUID:</strong> {user.uuid}</p>
            <p><strong>이름:</strong> {user.name}</p>
            <p><strong>평판 점수:</strong> {user.reputation_score}</p>
            <p><strong>잔액:</strong> {user.balance ? user.balance.toLocaleString() : 0}원</p>
            <p><strong>가입일:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </>
        )}
      </div>
      <button 
        onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)} 
        style={{ marginTop: '20px' }}
      >
        {isEditing ? '저장' : '정보 수정'}
      </button>
      {isEditing && (
        <button 
          onClick={() => {
            setIsEditing(false);
            // Reset edited fields to current user data if cancelled
            setEditedName(user.name);
            setEditedEmail(user.email);
            setEditedStudentId(user.student_id);
          }} 
          style={{ marginTop: '20px', marginLeft: '10px' }}
        >
          취소
        </button>
      )}
      <button onClick={handleChargeBalance} style={{ marginTop: '20px', marginLeft: '10px' }}>
        결제하기
      </button>
    </div>
  );
}

export default Profile;
