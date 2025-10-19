import React from 'react';

function SignUp() {
  return (
    <div>
      <h2>회원가입</h2>
      <form>
        <div>
          <label htmlFor="name">이름: </label>
          <input type="text" id="name" name="name" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="email">이메일: </label>
          <input type="email" id="email" name="email" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="studentId">학번: </label>
          <input type="text" id="studentId" name="studentId" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="username">ID: </label>
          <input type="text" id="username" name="username" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="password">비밀번호: </label>
          <input type="password" id="password" name="password" />
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">회원가입하기</button>
        </div>
      </form>
    </div>
  );
}

export default SignUp;
