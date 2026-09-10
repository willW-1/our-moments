import { useState } from 'react';
import { login } from './api';
import { HeartLogo } from './components/icons';
import { t, useT } from './i18n';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
  useT(); // 订阅语言：切换语言时登录卡片重渲染
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
      setError(err.status === 400 || err.status === 401 ? t('login.badCredentials') : t('login.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}><HeartLogo size={56} /></div>
        <h1 className={styles.title}>Memories</h1>
        <p className={styles.subtitle}>{t('login.subtitle')}</p>
        <input
          className={styles.input}
          type="text"
          placeholder={t('login.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className={styles.input}
          type="password"
          placeholder={t('login.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? t('login.submitting') : t('login.submit')}
        </button>

        {/* 旁观者体验账号：只读权限，点击一键填入，省去手输 */}
        <button
          type="button"
          className={styles.demoBox}
          onClick={() => {
            setUsername('test');
            setPassword('1234');
            setError('');
          }}
        >
          <span className={styles.demoLabel}>{t('login.demoLabel')}</span>
          <span className={styles.demoCreds}>
            <b>test</b>
            <span className={styles.demoSlash}>/</span>
            <b>1234</b>
          </span>
          <span className={styles.demoHint}>{t('login.demoHint')}</span>
        </button>
      </form>
    </div>
  );
}

export default Login;
