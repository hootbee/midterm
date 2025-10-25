import { Link, useNavigate } from 'react-router-dom';
import {useState} from "react";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert('로그인 성공! 메인화면으로 이동합니다.');
        localStorage.setItem('token', data.token);
        navigate('/'); // Redirect using navigate
      } else {
        alert('로그인 실패: ' + data.message);
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: '20px' }}>로그인</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">이메일: </label>
          <input type="text" id="email" name="email" value={email} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="password">비밀번호: </label>
          <input type="password" id="password" name="password" value={password} onChange={onChange} required />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit">로그인</button>
          <Link to="/signup"><button type="button">회원가입</button></Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
