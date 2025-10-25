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
  alignItems: 'center', // Align items vertically in the middle
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

function ItemList({ isLoggedIn, isAdmin, userUuid }) {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();
  const [isSelectionMode, setIsSelectionMode] = useState(false); // New state for selection mode
  const [selectedItems, setSelectedItems] = useState([]); // New state for selected items

  useEffect(() => {
    const fetchItems = async () => {
      const searchTerm = searchParams.get('search');
      const searchType = searchParams.get('type');
      const token = localStorage.getItem('token');
      
      try {
        let url = `/api/auctions?page=${currentPage}&limit=5`;
        if (searchTerm && searchType) {
          url += `&search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(searchType)}`;
        }
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchItems();
  }, [currentPage, searchParams]);

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('정말로 이 경매 아이템을 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
        alert('경매 아이템이 성공적으로 삭제되었습니다.');
        setSelectedItems(prev => prev.filter(id => id !== itemId)); // Remove from selected if deleted
      } else {
        const data = await res.json();
        alert(`아이템 삭제 실패: ${data.message || res.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('아이템 삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedItems([]); // Clear selection when toggling mode
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]); // Deselect all
    } else {
      setSelectedItems(items.map(item => item._id)); // Select all
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 아이템을 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedItems.length}개의 아이템을 정말로 삭제하시겠습니까?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    let successfulDeletions = 0;

    try {
      for (const itemId of selectedItems) {
        const res = await fetch(`/api/auctions/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          successfulDeletions++;
        } else {
          const data = await res.json();
          console.error(`Failed to delete item ${itemId}: ${data.message || res.statusText}`);
        }
      }

      if (successfulDeletions > 0) {
        alert(`${successfulDeletions}개의 아이템이 성공적으로 삭제되었습니다.`);

        // Re-fetch items to update the list
        const searchTerm = searchParams.get('search');
        const searchType = searchParams.get('type');
        let url = `/api/auctions?page=${currentPage}&limit=5`;

        if (searchTerm && searchType) {
          url += `&search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(searchType)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setItems(data.items);
          setTotalPages(data.totalPages);
        }
      } else {
        alert('선택된 아이템 중 삭제된 것이 없습니다.');
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }

    setSelectedItems([]);
    setIsSelectionMode(false); // Exit selection mode after batch delete
  };

  return (
    <div>
      <h2>경매장</h2>
      <Link to="/create-auction">
        <button style={{ marginBottom: '20px' }}>작성하기</button>
      </Link>
      {isAdmin && (
        <button onClick={toggleSelectionMode} style={{ marginBottom: '20px', marginLeft: '10px' }}>
          {isSelectionMode ? '선택 모드 종료' : '삭제하기'}
        </button>
      )}

      {isSelectionMode && (
        <div style={{ marginBottom: '20px', marginLeft: '10px' }}>
          <button onClick={handleSelectAll} style={{ marginRight: '10px' }}>
            {selectedItems.length === items.length ? '전체 선택 해제' : '전체 선택하기'}
          </button>
          <button onClick={handleBatchDelete} disabled={selectedItems.length === 0} style={{ backgroundColor: 'red', color: 'white' }}>
            선택된 아이템 삭제 ({selectedItems.length})
          </button>
        </div>
      )}

      <div style={containerStyle}>
        {items.map(item => (
          <div key={item._id} style={{...itemCardStyle, border: item.isFavorited ? '2px solid yellow' : itemCardStyle.border}}>
            {isSelectionMode && (
              <input
                type="checkbox"
                checked={selectedItems.includes(item._id)}
                onChange={() => handleSelectItem(item._id)}
                style={{ marginRight: '10px', transform: 'scale(1.5)' }}
              />
            )}
            <Link to={`/auction/${item._id}`} style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, display: 'flex', gap: '16px' }}>
              <img src={`/${item.imagePath}`} alt={item.title} style={thumbnailStyle} />
              <div>
                <h3>{item.title}</h3>
                <p>판매자 평판: {item.sellerReputationScore}점</p>
                <p>판매자 UUID: {item.sellerUuid}</p>
                <p>경매 시작가: {item.startPrice.toLocaleString()}원</p>
                <p>마감 시간: {new Date(item.endTime).toLocaleString()}</p>
              </div>
            </Link>
            {!isSelectionMode && (isLoggedIn && (isAdmin || userUuid === item.sellerUuid)) && (
              <button onClick={() => handleDeleteItem(item._id)} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                삭제하기
              </button>
            )}
          </div>
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
  const [userUuid, setUserUuid] = useState(null);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true); // State for banner visibility
  const [bannerAnnouncement, setBannerAnnouncement] = useState(null); // State for fetched banner content

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
      if (decoded) {
        setUserUuid(decoded.uuid);
        if (decoded.admin) {
          setIsAdmin(true);
        }
      }
    }

    // Fetch banner announcement
    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/announcements/banner');
        if (res.ok) {
          const data = await res.json();
          setBannerAnnouncement(data);
        } else if (res.status === 404) {
          setBannerAnnouncement(null); // No banner active
        } else {
          throw new Error('배너 공지사항을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Error fetching banner announcement:', err);
        setBannerAnnouncement(null); // Ensure banner is hidden on error
      }
    };
    fetchBanner();

  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserUuid(null);
    alert('로그아웃 되었습니다.');
  };

  return (
    <div>
      {showAnnouncementBanner && bannerAnnouncement && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '10px',
          marginBottom: '20px',
          border: '1px solid #ffeeba',
          borderRadius: '5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>✨ {bannerAnnouncement.title}</span>
          <button
            onClick={() => setShowAnnouncementBanner(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              cursor: 'pointer',
              color: '#856404',
            }}
          >
            &times;
          </button>
        </div>
      )}
      <h1>메인 화면</h1>
      {isLoggedIn ? (
        <>
          <button onClick={handleLogout}>로그아웃</button>
          <Link to="/profile"><button style={{ marginLeft: '10px' }}>개인 프로필가기</button></Link>
          <Link to="/my-bids"><button style={{ marginLeft: '10px' }}>입찰 내역</button></Link>
          <Link to="/my-selling"><button style={{ marginLeft: '10px' }}>판매 내역</button></Link> {/* New link for My Selling */}
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
      <ItemList isLoggedIn={isLoggedIn} isAdmin={isAdmin} userUuid={userUuid} />
    </div>
  );
};

export default Home;
