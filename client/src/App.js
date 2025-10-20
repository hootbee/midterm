import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Login from './Login';
import SignUp from './SignUp';
import AuctionItemDetail from './AuctionItemDetail';
import AdminPage from './AdminPage';
import PrivateRoute from './PrivateRoute';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Link to="/"><button>메인화면으로 가기</button></Link>
        </div>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auction/:id" element={<AuctionItemDetail />} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        </Routes>
      </header>
    </div>
  );
}

export default App;