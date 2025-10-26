import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/* ---------- 공통 스타일 ---------- */

const pageWrapperStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  color: '#1a1a1a',
};

const headerBarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  rowGap: '12px',
  marginBottom: '24px',
};

const headerLeftCol = {
  minWidth: 0,
};

const headerTitleStyle = {
  fontSize: '24px',
  fontWeight: 600,
  margin: 0,
  lineHeight: 1.2,
  color: '#111827',
};

const headerRightCol = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
};

const sectionHeaderRow = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  rowGap: '12px',
};

const leftRowGroup = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
};

const rightRowGroup = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
};

const subInfoText = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: 1.4,
};

const buttonBase = {
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  lineHeight: 1.4,
};

const buttonPrimary = {
  ...buttonBase,
  backgroundColor: '#2563eb',
  color: '#fff',
  border: '1px solid #2563eb',
};

const buttonDanger = {
  ...buttonBase,
  backgroundColor: '#dc2626',
  border: '1px solid #dc2626',
  color: '#fff',
};

const buttonDisabledStyle = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const bannerStyle = {
  backgroundColor: '#fff8e1',
  color: '#8a6d00',
  padding: '12px 16px',
  marginBottom: '20px',
  border: '1px solid #ffecb3',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
  fontSize: '14px',
  lineHeight: 1.4,
  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
};

const bannerCloseBtn = {
  background: 'none',
  border: 'none',
  fontSize: '16px',
  lineHeight: 1,
  cursor: 'pointer',
  color: '#8a6d00',
  padding: '0 4px',
};

/* ---------- 리스트 / 카드 스타일 ---------- */

const listControlsBar = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

const gridWrapperStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(520px, 100%), 1fr))',
  gap: '16px',
};

const cardOuterWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'stretch',
};

const selectionCheckboxWrapper = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'flex-start',
  paddingTop: '8px',
  paddingRight: '8px',
};

const selectionCheckboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
};

const itemCardStyle = {
  position: 'relative',
  flexGrow: 1,
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '16px',
  display: 'flex',
  gap: '16px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
};

const itemCardHoverStyle = {
  boxShadow: '0 6px 14px rgba(0,0,0,0.07), 0 3px 6px rgba(0,0,0,0.06)',
  borderColor: '#93c5fd',
  transform: 'translateY(-2px)',
};

const badgeStackStyle = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '6px',
  zIndex: 2,
};

const creditBadgeStyle = {
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: '#fff',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1.2,
  boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  letterSpacing: '-0.02em',
};

const favoriteBadgeStyle = {
  background: 'linear-gradient(135deg, #fff7b2, #fde047)',
  color: '#92400e',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1.2,
  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
  textShadow: '0 1px 1px rgba(255,255,255,0.6)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  letterSpacing: '-0.02em',
};

const thumbnailWrapperStyle = {
  flexShrink: 0,
  width: '140px',
  height: '140px',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const thumbnailImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const itemBodyWrapperStyle = {
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const topInfoAreaStyle = {
  minWidth: 0,
  textDecoration: 'none',
  color: 'inherit',
};

const titleStyle = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#111827',
  margin: '0 0 6px 0',
  lineHeight: 1.4,
  wordBreak: 'break-word',
};

const metaTextStyle = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '2px 0',
  lineHeight: 1.4,
  wordBreak: 'break-word',
};

const priceTextStyle = {
  fontSize: '14px',
  color: '#111827',
  margin: '6px 0 0 0',
  fontWeight: 500,
  lineHeight: 1.4,
};

const endTimeTextStyle = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '4px',
  lineHeight: 1.4,
};

const cardFooterRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginTop: '12px',
  gap: '8px',
};

const perItemDeleteBtnStyle = {
  ...buttonDanger,
  fontSize: '12px',
  padding: '6px 8px',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
};

/* ---------- 페이지네이션 ---------- */

const paginationBarStyle = {
  marginTop: '24px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#374151',
};

const paginationInnerStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const pageIndicatorStyle = {
  fontSize: '14px',
  color: '#4b5563',
};

/* ---------- ItemList 컴포넌트 ---------- */

function ItemList({ isLoggedIn, isAdmin, userUuid }) {
  const [items, setItems] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // 아이템 목록 가져오기
  const fetchItems = useCallback(async () => {
    const searchTerm = searchParams.get('search');
    const searchType = searchParams.get('type');
    const token = localStorage.getItem('token');

    try {
      let url = `/api/auctions?page=${currentPage}&limit=20`;
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
  }, [currentPage, searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 단일 삭제
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('정말로 이 경매 아이템을 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== itemId));
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
        alert('경매 아이템이 성공적으로 삭제되었습니다.');
      } else {
        const data = await res.json();
        alert(`아이템 삭제 실패: ${data.message || res.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('아이템 삭제 중 오류가 발생했습니다.');
    }
  };

  // 선택 모드 토글
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedItems([]);
  };

  // 개별 선택
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // 전체 선택 / 해제
  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item._id));
    }
  };

  // 선택 삭제
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 아이템을 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedItems.length}개의 아이템을 정말로 삭제하시겠습니까?`)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    let successCount = 0;

    try {
      for (const itemId of selectedItems) {
        const res = await fetch(`/api/auctions/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          console.error(
              `Failed to delete item ${itemId}: ${data.message || res.statusText}`
          );
        }
      }

      if (successCount > 0) {
        alert(`${successCount}개의 아이템이 성공적으로 삭제되었습니다.`);
        await fetchItems();
      } else {
        alert('선택된 아이템 중 삭제된 것이 없습니다.');
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }

    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  return (
      <section style={{ marginTop: '32px' }}>
        {/* 섹션 헤더 */}
        <div style={sectionHeaderRow}>
          <div style={leftRowGroup}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#111827' }}>
              경매장
            </h2>
            <span style={subInfoText}>총 {items.length}개 항목</span>
          </div>

          <div style={rightRowGroup}>
            <Link to="/create-auction">
              <button style={buttonPrimary}>작성하기</button>
            </Link>

            {isAdmin && (
                <button onClick={toggleSelectionMode} style={buttonDanger}>
                  {isSelectionMode ? '선택 모드 종료' : '삭제하기'}
                </button>
            )}
          </div>
        </div>

        {/* 선택 모드 컨트롤 */}
        {isSelectionMode && (
            <div style={listControlsBar}>
              <button onClick={handleSelectAll} style={buttonBase}>
                {selectedItems.length === items.length ? '전체 선택 해제' : '전체 선택하기'}
              </button>

              <button
                  onClick={handleBatchDelete}
                  disabled={selectedItems.length === 0}
                  style={{
                    ...buttonDanger,
                    ...(selectedItems.length === 0 ? buttonDisabledStyle : {}),
                  }}
              >
                선택된 아이템 삭제 ({selectedItems.length})
              </button>
            </div>
        )}

        {/* 아이템 리스트 */}
        <div style={gridWrapperStyle}>
          {items.map((item) => {
            const isOwner = userUuid === item.sellerUuid;
            const canDelete = isLoggedIn && (isAdmin || isOwner);
            const hovering = hoveredId === item._id;

            return (
                <div
                    key={item._id}
                    style={cardOuterWrapperStyle}
                    onMouseEnter={() => setHoveredId(item._id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                  {/* 체크박스 (선택모드일 때만) */}
                  {isSelectionMode && (
                      <div style={selectionCheckboxWrapper}>
                        <input
                            type="checkbox"
                            style={selectionCheckboxStyle}
                            checked={selectedItems.includes(item._id)}
                            onChange={() => handleSelectItem(item._id)}
                        />
                      </div>
                  )}

                  {/* 카드 본체 */}
                  <div
                      style={{
                        ...itemCardStyle,
                        ...(hovering ? itemCardHoverStyle : {}),
                      }}
                  >
                    {/* 상단 뱃지들 (신용 / 즐겨찾기) */}
                    <div style={badgeStackStyle}>
                      {item.sellerReputationScore >= 100 && (
                          <div style={creditBadgeStyle}>
                      <span role="img" aria-label="trusted">
                        💎
                      </span>
                            <span>신용</span>
                          </div>
                      )}

                      {item.isFavorited && (
                          <div style={favoriteBadgeStyle}>
                      <span role="img" aria-label="star">
                        ⭐
                      </span>
                            <span>즐겨찾기</span>
                          </div>
                      )}
                    </div>

                    {/* 썸네일 */}
                    <Link
                        to={`/auction/${item._id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'flex',
                          gap: '16px',
                          flexShrink: 0,
                        }}
                    >
                      <div style={thumbnailWrapperStyle}>
                        {item.imagePath ? (
                            <img
                                src={`/${item.imagePath}`}
                                alt={item.title}
                                style={thumbnailImgStyle}
                            />
                        ) : (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No Image</span>
                        )}
                      </div>
                    </Link>

                    {/* 본문 내용 + 푸터 */}
                    <div style={itemBodyWrapperStyle}>
                      {/* 상단 정보 (제목 등) */}
                      <Link
                          to={`/auction/${item._id}`}
                          style={topInfoAreaStyle}
                      >
                        <h3 style={titleStyle}>{item.title}</h3>

                        <p style={metaTextStyle}>
                          판매자 평판: {item.sellerReputationScore}점
                        </p>
                        <p style={metaTextStyle}>판매자 UUID: {item.sellerUuid}</p>

                        <p style={priceTextStyle}>
                          경매 시작가:{' '}
                          {Number(item.startPrice).toLocaleString()}원
                        </p>

                        <p style={endTimeTextStyle}>
                          마감 시간:{' '}
                          {new Date(item.endTime).toLocaleString()}
                        </p>
                      </Link>

                      {/* 하단 푸터 (삭제 버튼 등) */}
                      <div style={cardFooterRowStyle}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          ID: {item._id}
                        </div>

                        {!isSelectionMode && canDelete && (
                            <button
                                onClick={() => handleDeleteItem(item._id)}
                                style={perItemDeleteBtnStyle}
                            >
                              삭제하기
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>

        {/* 페이지네이션 */}
        <div style={paginationBarStyle}>
          <div style={paginationInnerStyle}>
            <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                style={{
                  ...buttonBase,
                  minWidth: '60px',
                  ...(currentPage === 1 ? buttonDisabledStyle : {}),
                }}
            >
              이전
            </button>

            <span style={pageIndicatorStyle}>
            Page {currentPage} / {totalPages}
          </span>

            <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...buttonBase,
                  minWidth: '60px',
                  ...(currentPage === totalPages ? buttonDisabledStyle : {}),
                }}
            >
              다음
            </button>
          </div>
        </div>
      </section>
  );
}

/* ---------- Home 컴포넌트 ---------- */

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUuid, setUserUuid] = useState(null);

  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true);
  const [bannerAnnouncement, setBannerAnnouncement] = useState(null);

  // 토큰 decode
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
          atob(base64)
              .split('')
              .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // 로그인 상태 / 유저정보
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

    // 배너 공지 가져오기
    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/announcements/banner');
        if (res.ok) {
          const data = await res.json();
          setBannerAnnouncement(data);
        } else if (res.status === 404) {
          setBannerAnnouncement(null);
        } else {
          throw new Error('배너 공지사항을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Error fetching banner announcement:', err);
        setBannerAnnouncement(null);
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
      <div style={pageWrapperStyle}>
        {/* 배너 공지 */}
        {showAnnouncementBanner && bannerAnnouncement && (
            <div style={bannerStyle}>
              <div style={{ fontWeight: 500 }}>
                ✨ {bannerAnnouncement.title}
              </div>
              <button
                  onClick={() => setShowAnnouncementBanner(false)}
                  style={bannerCloseBtn}
              >
                &times;
              </button>
            </div>
        )}

        {/* 상단 헤더 바 */}
        <header style={headerBarStyle}>
          <div style={headerLeftCol}>
            <h1 style={headerTitleStyle}>메인 화면</h1>
            {isLoggedIn && userUuid && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', wordBreak: 'break-all' }}>
                  현재 사용자 UUID: {userUuid}
                </div>
            )}
          </div>

          <div style={headerRightCol}>
            {isLoggedIn ? (
                <>
                  <button onClick={handleLogout} style={buttonBase}>
                    로그아웃
                  </button>

                  <Link to="/profile">
                    <button style={buttonBase}>개인 프로필가기</button>
                  </Link>

                  <Link to="/my-bids">
                    <button style={buttonBase}>입찰 내역</button>
                  </Link>

                  <Link to="/my-selling">
                    <button style={buttonBase}>판매 내역</button>
                  </Link>

                  {isAdmin && (
                      <Link to="/admin">
                        <button style={buttonPrimary}>관리자 페이지</button>
                      </Link>
                  )}
                </>
            ) : (
                <>
                  <Link to="/login">
                    <button style={buttonPrimary}>로그인</button>
                  </Link>

                  <Link to="/signup">
                    <button style={buttonBase}>회원가입</button>
                  </Link>
                </>
            )}
          </div>
        </header>

        {/* 경매 리스트 섹션 */}
        <ItemList isLoggedIn={isLoggedIn} isAdmin={isAdmin} userUuid={userUuid} />
      </div>
  );
}

export default Home;