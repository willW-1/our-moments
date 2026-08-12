import { useState } from 'react';
import { login } from './api';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(username.trim(), password);
      localStorage.setItem('token', data.token);
      onLoginSuccess(); // 跳转首页（App 刷新后走 token 校验）
    } catch (err) {
      setError(err.status === 400 || err.status === 401 ? '密码不对哦' : '网络异常，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>💝</div>
        <h1 className={styles.title}>Our Moments</h1>
        <p className={styles.subtitle}>我们的故事</p>
        <input
          className={styles.input}
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className={styles.input}
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  );
}

export default Login;
