
import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowSignUp(false);
  };

  const handleShowSignUp = () => {
    setShowLogin(false);
    setShowSignUp(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        {showLogin ? (
          <Login />
        ) : showSignUp ? (
          <SignUp />
        ) : (
          <div>
            <button onClick={handleShowLogin}>로그인</button>
            <button onClick={handleShowSignUp} style={{ marginLeft: '10px' }}>회원가입</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
