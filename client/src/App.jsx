import { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import MemoryList from './components/MemoryList/MemoryList';
import { API_BASE, fetchMe } from './api';

function App() {
  // 登录状态：checking（正在验证 token）/ loggedIn / loggedOut
  const [authState, setAuthState] = useState('checking');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1) 启动时检查 localStorage 的 token，并用 /api/me 验证；无效则清除
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthState('loggedOut');
      return;
    }
    fetchMe(token)
      .then(() => {
        if (!cancelled) setAuthState('loggedIn');
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('token');
          setAuthState('loggedOut');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) 登录后才加载 memories
  useEffect(() => {
    if (authState !== 'loggedIn') return;
    let cancelled = false;
    fetch(`${API_BASE}/api/memories`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMemories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('加载 memories 失败:', err);
        if (!cancelled) setError(`加载失败：${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authState]);

  const handleLoggedIn = () => {
    // 登录成功后刷新，让 App 重新走一遍 token 校验流程
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthState('loggedOut');
  };

  if (authState === 'loggedOut') {
    return <Login onLoginSuccess={handleLoggedIn} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">💝</span>
        <span className="app-title">Our Moments</span>
        <span className="app-nav">我们的故事</span>
        {authState === 'loggedIn' && (
          <span className="app-logout" onClick={handleLogout}>退出</span>
        )}
      </header>
      {authState === 'checking' && <p className="app-status">加载中…</p>}
      {authState === 'loggedIn' && loading && <p className="app-status">加载中…</p>}
      {authState === 'loggedIn' && error && <p className="app-status app-error">{error}</p>}
      {authState === 'loggedIn' && !loading && !error && <MemoryList memories={memories} />}
      {authState === 'loggedIn' && (
        <button className="fab" onClick={() => alert('即将上线')} title="添加回忆">+</button>
      )}
    </div>
  );
}

export default App;
