import { useEffect, useState } from 'react';
import './App.css';
import Login from './Login';
import AddMemory from './AddMemory';
import EditMemory from './EditMemory';
import MemoryList from './components/MemoryList/MemoryList';
import CountdownPanel from './components/CountdownPanel/CountdownPanel';
import MessageBoard from './components/MessageBoard/MessageBoard';
import WelcomeModal from './components/WelcomeModal/WelcomeModal';
import ParticleField from './components/ParticleField/ParticleField';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import LanguageToggle from './components/LanguageToggle/LanguageToggle';
import { HeartLogo, ClockIcon, CameraIcon, ChatIcon, PlusIcon } from './components/icons';
import { fetchMe, fetchMemories, deleteMemory } from './api';
import { t, useT } from './i18n';

// 背景装饰层：渐变底 + 三层柔光斑（.bg 由 App.css 定义，z-index:-1 沉到内容之下）
const appBg = (
  <div className="bg" aria-hidden="true">
    <span className="blob blob-1" />
    <span className="blob blob-2" />
    <span className="blob blob-3" />
  </div>
);

// 页脚：技术栈小字 + 特别鸣谢大字（登录前后都显示在页面最下方）
// 单独做成组件是为了跟着语言切换重渲染（useT 订阅语言）
function Footer() {
  useT();
  return (
    <footer className="app-footer">
      <p className="footer-tech">{t('footer.tech')}</p>
      <p className="footer-thanks">{t('footer.thanks')}</p>
    </footer>
  );
}

function App() {
  useT(); // 订阅语言：切换语言时整个 App 重渲染
  // 登录状态：checking（正在验证 token）/ loggedIn / loggedOut
  const [authState, setAuthState] = useState('checking');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 添加回忆弹窗 & 列表刷新开关（每次 +1 触发重新拉取）
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // 正在编辑的 memory
  const [editingMemory, setEditingMemory] = useState(null);
  // 手机端顶部 Tab：倒计时 / 回忆 / 留言板（桌面三栏不受影响）
  const [mobileTab, setMobileTab] = useState('memories');
  // 当前登录用户角色：user=使用者 / viewer=旁观者（登录校验时从 /api/me 取）
  const [role, setRole] = useState('user');
  // 当前登录用户名（欢迎弹窗显示）
  const [username, setUsername] = useState('');
  // 欢迎弹窗：登录校验成功后展示，需手动关闭
  const [showWelcome, setShowWelcome] = useState(false);
  // 日夜主题：luxe=星河暗夜（默认），luxe-day=星河白昼；与 main.jsx 的初始逻辑一致
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('our-moments-theme');
    return saved === 'luxe-day' ? 'luxe-day' : 'luxe';
  });

  const toggleTheme = () => {
    const next = theme === 'luxe' ? 'luxe-day' : 'luxe';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('our-moments-theme', next);
  };

  // 1) 启动时检查 localStorage 的 token，并用 /api/me 验证；无效则清除
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthState('loggedOut');
      return;
    }
    fetchMe(token)
      .then((me) => {
        if (!cancelled) {
          if (me && me.role) setRole(me.role);
          if (me && me.username) setUsername(me.username);
          setAuthState('loggedIn');
          setShowWelcome(true);
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
        if (!cancelled) setError(t('app.loadFailed', { message: err.message }));
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
    const ok = window.confirm(t('app.deleteConfirm', { title: memory.title }));
    if (!ok) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('app.sessionExpired'));
      return;
    }
    try {
      await deleteMemory(token, memory.id);
      setRefreshKey((k) => k + 1); // 刷新列表
    } catch (err) {
      alert(err.message || t('app.deleteFailed'));
    }
  };

  // 旁观者：只读 + 仅可在留言板留言，全站隐藏增删改入口
  const isViewer = role === 'viewer';

  if (authState === 'loggedOut') {
    // app-guest：整页按视口高度做纵向弹性布局，登录卡片与页脚同屏，无需滚动
    return (
      <div className="app app-guest">
        {appBg}
        <ParticleField theme={theme} />
        {/* 登录页没有顶栏，语言切换固定在左上角 */}
        <LanguageToggle variant="fixed" />
        <Login onLoginSuccess={handleLoggedIn} />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      {appBg}
      <ParticleField theme={theme} />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {/* 顶部整体（header + 手机端 Tab）吸顶：滚动时整块固定，避免 Tab 条被页头遮挡 */}
      <div className="app-top">
        <header className="app-header">
          <span className="app-logo"><HeartLogo size={26} /></span>
          <span className="app-title">Memories</span>
          <LanguageToggle />
          <span className="app-nav">{t('header.nav')}</span>
          {authState === 'loggedIn' && (
            <span className="app-logout" onClick={handleLogout}>{t('header.logout')}</span>
          )}
        </header>
        {/* 手机端顶部 Tab：倒计时 / 回忆 / 留言板（桌面不显示） */}
        <nav className="app-tabs">
          <button
            type="button"
            className={`tab-btn ${mobileTab === 'countdown' ? 'active' : ''}`}
            onClick={() => setMobileTab('countdown')}
          >
            <ClockIcon size={16} /> {t('tabs.countdown')}
          </button>
          <button
            type="button"
            className={`tab-btn ${mobileTab === 'memories' ? 'active' : ''}`}
            onClick={() => setMobileTab('memories')}
          >
            <CameraIcon size={16} /> {t('tabs.memories')}
          </button>
          <button
            type="button"
            className={`tab-btn ${mobileTab === 'messages' ? 'active' : ''}`}
            onClick={() => setMobileTab('messages')}
          >
            <ChatIcon size={16} /> {t('tabs.messages')}
          </button>
        </nav>
      </div>
      {authState === 'checking' && <p className="app-status">{t('common.loading')}</p>}
      {authState === 'loggedIn' && loading && <p className="app-status">{t('common.loading')}</p>}
      {authState === 'loggedIn' && error && <p className="app-status app-error">{error}</p>}
      {authState === 'loggedIn' && !loading && !error && (
        <div className="app-body">
          <aside className={`app-side-left ${mobileTab === 'countdown' ? 'active' : ''}`}>
            <CountdownPanel isViewer={isViewer} />
          </aside>
          <main className={`app-center ${mobileTab === 'memories' ? 'active' : ''}`}>
            <MemoryList
              memories={memories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isViewer={isViewer}
            />
          </main>
          <aside className={`app-side-right ${mobileTab === 'messages' ? 'active' : ''}`}>
            <MessageBoard isViewer={isViewer} />
          </aside>
        </div>
      )}
      {/* 旁观者不显示添加回忆的 ＋ 按钮 */}
      {authState === 'loggedIn' && !isViewer && (
        <button className="fab" onClick={() => setShowAdd(true)} title={t('header.addMemory')}>
          <PlusIcon size={24} strokeWidth={2.2} />
        </button>
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
      {/* 欢迎弹窗：登录成功后展示 GitHub 最近更新，需手动关闭 */}
      {authState === 'loggedIn' && showWelcome && (
        <WelcomeModal username={username} onClose={() => setShowWelcome(false)} />
      )}
      {authState === 'loggedIn' && <Footer />}
    </div>
  );
}

export default App;
