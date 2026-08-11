import { useEffect, useState } from 'react';
import './App.css';
import MemoryList from './components/MemoryList/MemoryList';

// 后端 API 地址：
//  - 本地开发（vite dev）：走 vite 代理到 localhost:3001
//  - 生产构建：默认 Render，可用 VITE_API_URL 覆盖（构建时注入）
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://our-moments-a8no.onrender.com');

function App() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, []);

  const handleAddClick = () => {
    alert('即将上线');
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">💝</span>
        <span className="app-title">Our Moments</span>
        <span className="app-nav">我们的故事</span>
      </header>
      {loading && <p className="app-status">加载中…</p>}
      {error && <p className="app-status app-error">{error}</p>}
      {!loading && !error && <MemoryList memories={memories} />}
      <button className="fab" onClick={handleAddClick} title="添加回忆">+</button>
    </div>
  );
}

export default App;
