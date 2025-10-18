import React from 'react';

function Login() {
  return (
    <div>
      <h2>로그인</h2>
      <form>
        <div>
          <label htmlFor="username">ID: </label>
          <input type="text" id="username" name="username" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="password">비밀번호: </label>
          <input type="password" id="password" name="password" />
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">로그인</button>
        </div>
      </form>
    </div>
  );
}

export default Login;
