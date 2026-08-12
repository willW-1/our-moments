import { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import AddMemory from './AddMemory';
import EditMemory from './EditMemory';
import MemoryList from './components/MemoryList/MemoryList';
import { fetchMe, fetchMemories, deleteMemory } from './api';

function App() {
  // 登录状态：checking（正在验证 token）/ loggedIn / loggedOut
  const [authState, setAuthState] = useState('checking');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 添加回忆弹窗 & 列表刷新开关（每次 +1 触发重新拉取）
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // 当前登录用户名（用于判断卡片是否可编辑/删除）& 正在编辑的 memory
  const [username, setUsername] = useState('');
  const [editingMemory, setEditingMemory] = useState(null);

  // 1) 启动时检查 localStorage 的 token，并用 /api/me 验证；无效则清除
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthState('loggedOut');
      return;
    }
    fetchMe(token)
      .then((data) => {
        if (!cancelled) {
          setUsername(data.username);
          setAuthState('loggedIn');
        }
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

  // 2) 登录后才加载 memories（携带 token，因为 GET /api/memories 需要认证）
  useEffect(() => {
    if (authState !== 'loggedIn') return;
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthState('loggedOut');
      return;
    }
    fetchMemories(token)
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
  }, [authState, refreshKey]);

  const handleLoggedIn = () => {
    // 登录成功后刷新，让 App 重新走一遍 token 校验流程
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthState('loggedOut');
  };

  const handleEdit = (memory) => setEditingMemory(memory);

  const handleDelete = async (memory) => {
    const ok = window.confirm(`确定删除「${memory.title}」这条回忆吗？删除后无法恢复。`);
    if (!ok) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('登录状态已失效，请重新登录');
      return;
    }
    try {
      await deleteMemory(token, memory.id);
      setRefreshKey((k) => k + 1); // 刷新列表
    } catch (err) {
      alert(err.message || '删除失败，请稍后再试');
    }
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
      {authState === 'loggedIn' && !loading && !error && (
        <MemoryList
          memories={memories}
          currentUsername={username}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      {authState === 'loggedIn' && (
        <button className="fab" onClick={() => setShowAdd(true)} title="添加回忆">+</button>
      )}
      {authState === 'loggedIn' && showAdd && (
        <AddMemory
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            setRefreshKey((k) => k + 1); // 刷新记忆列表
          }}
        />
      )}
      {authState === 'loggedIn' && editingMemory && (
        <EditMemory
          memory={editingMemory}
          onClose={() => setEditingMemory(null)}
          onUpdated={() => {
            setEditingMemory(null);
            setRefreshKey((k) => k + 1); // 刷新记忆列表
          }}
        />
      )}
    </div>
  );
}

export default App;
