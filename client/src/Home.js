import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    alert('로그아웃 되었습니다.');
  };

  return (
    <div>
      <h1>메인 화면</h1>
      {isLoggedIn ? (
        <button onClick={handleLogout}>로그아웃</button>
      ) : (
        <>
          <Link to="/login"><button>로그인</button></Link>
          <Link to="/signup"><button style={{ marginLeft: '10px' }}>회원가입</button></Link>
        </>
      )}
      <Link to="/auction"><button style={{ marginLeft: '10px' }}>경매장</button></Link>
    </div>
  );
}

export default Home;
