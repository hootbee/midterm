import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css'; // 🎨 CSS 분리 (아래 참고)

const localizer = momentLocalizer(moment);

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await fetch('/api/auctions/all');
        if (res.ok) {
          const data = await res.json();
          const calendarEvents = data.map((item) => ({
            id: item._id,
            title: item.title,
            start: new Date(item.endTime),
            end: new Date(item.endTime),
            color: item.status === 'sold' ? '#94a3b8' : '#ef4444', // 판매된 건 회색, 진행중은 빨강
          }));
          setEvents(calendarEvents);
        } else {
          console.error('Failed to fetch auctions for calendar');
        }
      } catch (error) {
        console.error('Error fetching auctions for calendar:', error);
      }
    };

    fetchAuctions();
  }, []);

  const handleSelectEvent = (event) => {
    navigate(`/auction/${event.id}`);
  };

  // 🎨 커스텀 이벤트 스타일
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '6px',
      color: 'white',
      border: 'none',
      padding: '1px 5px',
      fontSize: '11.5px',   // ✅ 글자 크기 줄임
      fontWeight: '500',
      lineHeight: '1.2',
      transition: 'transform 0.15s ease',
      cursor: 'pointer',
    },
  });

  return (
      <div className="calendar-full-container">
        <div className="calendar-header">
          <h2>📅 경매 마감 캘린더</h2>
          <p>각 날짜를 클릭하면 해당 경매 상세 페이지로 이동합니다. (+more를 클릭하면 모든 경매를 볼 수 있습니다)</p>
        </div>

        <div className="calendar-wrapper">
          <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              popup
          />
        </div>
      </div>
  );
}

export default CalendarPage;