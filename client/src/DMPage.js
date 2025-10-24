import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:3001'; // Your backend server URL

function DMPage() {
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [targetUserUuid, setTargetUserUuid] = useState('');
  const [dmRooms, setDmRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token) {
      setError('로그인이 필요합니다.');
      return;
    }

    socket.current = io(ENDPOINT, {
      auth: { token }, // Send token in auth object
      transports: ['websocket', 'polling'],
    });
    console.log('Client token for Socket.IO:', token);

    socket.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.current.on('dm:message', (message) => {
      console.log('DM message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom();
    });

    socket.current.on('dm:error', (err) => {
      console.error('DM Socket Error:', err);
      setError(err.message);
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    return () => {
      socket.current.disconnect();
    };
  }, [token]);

  // Fetch DM rooms on component mount
  useEffect(() => {
    const fetchDMRooms = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/dm/rooms', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('DM 방 목록을 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        setDmRooms(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDMRooms();
  }, [token]);

  // Fetch messages for selected room
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedRoom || !token) return;
      try {
        const res = await fetch(`/api/dm/room/${selectedRoom._id}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('메시지를 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        setMessages(data);
        socket.current.emit('dm:joinRoom', selectedRoom._id); // Join socket room
        scrollToBottom();
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMessages();
  }, [selectedRoom, token]);

  // Handle starting a new chat or selecting an existing one
  const handleStartNewChat = async () => {
    if (!targetUserUuid.trim()) {
      alert('상대방 UUID를 입력해주세요.');
      return;
    }
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch('/api/dm/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserUuid }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'DM 방 생성/가져오기 실패');
      }

      const newRoom = await res.json();
      // Add new room to list if it's not already there
      if (!dmRooms.some(room => room._id === newRoom._id)) {
        setDmRooms((prevRooms) => [newRoom, ...prevRooms]);
      }
      setSelectedRoom(newRoom);
      setTargetUserUuid('');
      setShowNewChatInput(false);
    } catch (err) {
      setError(err.message);
      alert(`대화 시작 오류: ${err.message}`);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoom) return;

    const currentUserUuid = JSON.parse(atob(token.split('.')[1])).uuid; // Decode JWT to get current user's UUID
    const receiverUuid = selectedRoom.participants.find(uuid => uuid !== currentUserUuid);

    socket.current.emit('dm:message', {
      roomId: selectedRoom._id,
      receiverUuid,
      content: messageInput,
    });
    setMessageInput('');
  };

  if (error) return <div>오류: {error}</div>;
  if (!token) return <div>로그인이 필요합니다.</div>;

  const currentUserUuid = token ? JSON.parse(atob(token.split('.')[1])).uuid : null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px' }}>
      {/* DM Room List */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
        <h3>DM 목록</h3>
        <button onClick={() => setShowNewChatInput(!showNewChatInput)} style={{ marginBottom: '10px' }}>
          {showNewChatInput ? '취소' : '새 대화'}
        </button>

        {showNewChatInput && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="상대방 UUID 입력..."
              value={targetUserUuid}
              onChange={(e) => setTargetUserUuid(e.target.value)}
              style={{ width: 'calc(100% - 70px)', padding: '5px', marginRight: '5px' }}
            />
            <button onClick={handleStartNewChat} style={{ padding: '5px 10px' }}>시작</button>
          </div>
        )}

        {dmRooms.length === 0 && <p>대화방이 없습니다.</p>}
        {dmRooms.map((room) => (
          <div
            key={room._id}
            onClick={() => setSelectedRoom(room)}
            style={{
              padding: '10px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              backgroundColor: selectedRoom?._id === room._id ? '#f0f0f0' : 'transparent',
            }}
          >
            {/* Display other participant's UUID */}
            <strong>{room.participants.find(uuid => uuid !== currentUserUuid)}</strong>
            {room.lastMessage && <p style={{ fontSize: '0.8em', color: '#666' }}>{room.lastMessage.content}</p>}
          </div>
        ))}
      </div>

      {/* Message Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
        {selectedRoom ? (
          <>
            <h3>{selectedRoom.participants.find(uuid => uuid !== currentUserUuid)} 님과의 대화</h3>
            <div style={{ flex: 1, border: '1px solid #eee', padding: '10px', overflowY: 'auto', marginBottom: '10px' }}>
              {messages.length === 0 && <p>메시지가 없습니다.</p>}
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    textAlign: msg.senderUuid === currentUserUuid ? 'right' : 'left',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '0.8em', color: '#888' }}>
                    {msg.senderUuid === currentUserUuid ? '나' : msg.senderUuid.substring(0, 8)} - {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 12px',
                      borderRadius: '15px',
                      backgroundColor: msg.senderUuid === currentUserUuid ? '#007bff' : '#f0f0f0',
                      color: msg.senderUuid === currentUserUuid ? 'white' : 'black',
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '5px' }}
              />
              <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>전송</button>
            </form>
          </>
        ) : (
          <p>DM 목록에서 대화방을 선택하거나 새 대화를 시작하세요.</p>
        )}
      </div>
    </div>
  );
}

export default DMPage;
