import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

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

function ItemList() {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchItems = async () => {
      const searchTerm = searchParams.get('search');
      const searchType = searchParams.get('type');
      
      try {
        let url = `/api/auctions?page=${currentPage}&limit=5`;
        if (searchTerm && searchType) {
          url += `&search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(searchType)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setItems(data.items);
          setTotalPages(data.totalPages);
        } else {
          console.error('Failed to fetch items:', data.message);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchItems();
  }, [currentPage, searchParams]); // Refetch when page or search params change

  return (
    <div>
      <h2>경매장</h2>
      <Link to="/create-auction">
        <button style={{ marginBottom: '20px' }}>작성하기</button>
      </Link>
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
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
          이전
        </button>
        <span style={{ margin: '0 10px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
          다음
        </button>
      </div>
    </div>
  );
};

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const decoded = decodeToken(token);
      if (decoded && decoded.admin) {
        setIsAdmin(true);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    alert('로그아웃 되었습니다.');
  };

  return (
    <div>
      <h1>메인 화면</h1>
      {isLoggedIn ? (
        <>
          <button onClick={handleLogout}>로그아웃</button>
          <Link to="/profile"><button style={{ marginLeft: '10px' }}>개인 프로필가기</button></Link>
          {isAdmin && (
            <Link to="/admin"><button style={{ marginLeft: '10px' }}>관리자 페이지</button></Link>
          )}
        </>
      ) : (
        <>
          <Link to="/login"><button>로그인</button></Link>
          <Link to="/signup"><button style={{ marginLeft: '10px' }}>회원가입</button></Link>
        </>
      )}
      <ItemList />
    </div>
  );
}

export default Home;
