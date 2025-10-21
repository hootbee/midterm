import React, { useState, useEffect } from 'react';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
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
        <p><strong>이메일:</strong> {user.email}</p>
        <p><strong>UUID:</strong> {user.uuid}</p>
        <p><strong>이름:</strong> {user.name}</p>
        <p><strong>학번:</strong> {user.student_id}</p>
        <p><strong>평판 점수:</strong> {user.reputation_score}</p>
        <p><strong>가입일:</strong> {new Date(user.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default Profile;
