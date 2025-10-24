import React, { useState, useEffect, useCallback } from 'react';

function AnnouncementAdminPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null); // Stores the announcement being edited
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('공지사항을 불러오는 데 실패했습니다.');
      }
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token, setAnnouncements, setError]); // Add dependencies for useCallback

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]); // Add fetchAnnouncements to useEffect dependency array
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '공지사항 추가 실패');
      }

      setNewTitle('');
      setNewContent('');
      fetchAnnouncements();
    } catch (err) {
      setError(err.message);
      alert(`공지사항 추가 오류: ${err.message}`);
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement || !editingAnnouncement.title.trim() || !editingAnnouncement.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`/api/announcements/${editingAnnouncement._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editingAnnouncement.title, content: editingAnnouncement.content }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '공지사항 수정 실패');
      }

      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      setError(err.message);
      alert(`공지사항 수정 오류: ${err.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '공지사항 삭제 실패');
      }

      fetchAnnouncements();
    } catch (err) {
      setError(err.message);
      alert(`공지사항 삭제 오류: ${err.message}`);
    }
  };

  const handleToggleBanner = async (id) => {
    try {
      const res = await fetch(`/api/announcements/${id}/toggle-banner`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '배너 상태 토글 실패');
      }

      fetchAnnouncements();
    } catch (err) {
      setError(err.message);
      alert(`배너 상태 토글 오류: ${err.message}`);
    }
  };

  if (error) return <div>오류: {error}</div>;
  if (!token) return <div>로그인이 필요합니다.</div>; // Admin page should be protected by PrivateRoute

  return (
    <div style={{ padding: '20px' }}>
      <h2>공지사항 관리</h2>

      {/* Add New Announcement Form */}
      <div style={{ marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
        <h3>새 공지사항 추가</h3>
        <form onSubmit={handleAddAnnouncement}>
          <div style={{ marginBottom: '10px' }}>
            <label>제목:</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>내용:</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows="5"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            ></textarea>
          </div>
          <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            공지사항 추가
          </button>
        </form>
      </div>

      {/* Announcement List */}
      <h3>기존 공지사항</h3>
      {announcements.length === 0 && <p>등록된 공지사항이 없습니다.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {announcements.map((announcement) => (
          <li key={announcement._id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            {editingAnnouncement?._id === announcement._id ? (
              // Edit Form
              <form onSubmit={handleUpdateAnnouncement}>
                <div style={{ marginBottom: '10px' }}>
                  <label>제목:</label>
                  <input
                    type="text"
                    value={editingAnnouncement.title}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>내용:</label>
                  <textarea
                    value={editingAnnouncement.content}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                    rows="5"
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  ></textarea>
                </div>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
                  수정 완료
                </button>
                <button type="button" onClick={() => setEditingAnnouncement(null)} style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  취소
                </button>
              </form>
            ) : (
              // Display Announcement
              <>
                <h4>{announcement.title} {announcement.isBanner && <span style={{ color: 'green', fontSize: '0.8em' }}>(배너 게시 중)</span>}</h4>
                <p>{announcement.content}</p>
                <p style={{ fontSize: '0.8em', color: '#888' }}>
                  작성일: {new Date(announcement.createdAt).toLocaleString()} | 최종 수정일: {new Date(announcement.updatedAt).toLocaleString()}
                </p>
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setEditingAnnouncement(announcement)}
                    style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => handleToggleBanner(announcement._id)}
                    style={{ padding: '8px 12px', backgroundColor: announcement.isBanner ? '#6c757d' : '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    {announcement.isBanner ? '배너 게시 해제' : '배너 게시'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AnnouncementAdminPage;
