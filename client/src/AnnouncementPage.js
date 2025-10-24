import React, { useState, useEffect } from 'react';

function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements'); // Public endpoint
        if (!res.ok) {
          throw new Error('공지사항을 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        setAnnouncements(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchAnnouncements();
  }, []);

  if (error) return <div>오류: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>공지사항</h2>
      {announcements.length === 0 && <p>등록된 공지사항이 없습니다.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {announcements.map((announcement) => (
          <li key={announcement._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <h4>{announcement.title}</h4>
            <p>{announcement.content}</p>
            <p style={{ fontSize: '0.8em', color: '#888' }}>
              작성일: {new Date(announcement.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AnnouncementPage;
