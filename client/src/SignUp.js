import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
  });

  const { name, email, studentId, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert('회원가입 성공! 로그인 페이지로 이동합니다.');
        navigate('/login'); // Redirect to login page
      } else {
        alert('회원가입 실패: ' + data.message);
      }
    } catch (error) {
      console.error('Signup fetch error:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h2>회원가입</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">이름: </label>
          <input type="text" id="name" name="name" value={name} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="email">이메일: </label>
          <input type="email" id="email" name="email" value={email} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="studentId">학번: </label>
          <input type="text" id="studentId" name="studentId" value={studentId} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="password">비밀번호: </label>
          <input type="password" id="password" name="password" value={password} onChange={onChange} required minLength="6" />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit">회원가입하기</button>
          <Link to="/login"><button type="button">로그인 화면으로</button></Link>
        </div>
      </form>
    </div>
  );
}

export default SignUp;
