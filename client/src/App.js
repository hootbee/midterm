import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Login from './Login';
import SignUp from './SignUp';
import AuctionItemDetail from './AuctionItemDetail';
import AdminPage from './AdminPage';
import PrivateRoute from './PrivateRoute';
import LoggedInRoute from './LoggedInRoute';
import Profile from './Profile';
import CreateAuctionItem from './CreateAuctionItem';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('sellerUuid'); // Default search type
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${searchTerm.trim()}&type=${searchType}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Link to="/"><button>메인화면으로 가기</button></Link>
        </div>

        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <form onSubmit={handleSearch}>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="sellerUuid">UUID</option>
              <option value="title">제목</option>
              <option value="content">내용</option>
            </select>
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">검색</button>
          </form>
        </div>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auction/:id" element={<AuctionItemDetail />} />
          <Route path="/create-auction" element={<LoggedInRoute><CreateAuctionItem /></LoggedInRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/profile" element={<LoggedInRoute><Profile /></LoggedInRoute>} />
        </Routes>
      </header>
    </div>
  );
}

export default App;