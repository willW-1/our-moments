import { useEffect, useState } from 'react';
import styles from './WelcomeModal.module.css';
import { formatDateTime } from '../../formatTime';
import { HeartLogo, CloseIcon } from '../icons';
import { t, useT } from '../../i18n';

// GitHub 仓库公开地址，直接调 API 拉取最近提交（最新更新时间 + 更新内容）
const GITHUB_COMMITS_URL = 'https://api.github.com/repos/willW-1/our-moments/commits?per_page=4';

// 欢迎弹窗：登录成功后展示，显示 GitHub 仓库最近更新。
// 不自动隐藏 —— 必须由用户点击遮罩 / ✕ / 「知道了」关闭。
function WelcomeModal({ username, onClose }) {
  useT(); // 订阅语言（GitHub 提交信息是外部数据，不翻译）
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(GITHUB_COMMITS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCommits(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError(t('welcome.errLoad'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <CloseIcon size={14} strokeWidth={2} />
        </button>

        <div className={styles.emoji}><HeartLogo size={52} /></div>
        <h2 className={styles.title}>
          {username ? t('welcome.titleWithName', { name: username }) : t('welcome.title')}
        </h2>
        <p className={styles.subtitle}>{t('welcome.recentUpdates')}</p>

        {loading && <p className={styles.status}>{t('common.loading')}</p>}
        {!loading && error && <p className={`${styles.status} ${styles.error}`}>{error}</p>}
        {!loading && !error && commits.length === 0 && (
          <p className={styles.status}>{t('welcome.empty')}</p>
        )}
        {!loading && !error && commits.length > 0 && (
          <ul className={styles.list}>
            {commits.map((c, i) => (
              <li key={c.sha || i} className={styles.item}>
                <div className={styles.time}>
                  {formatDateTime(c.commit?.author?.date)}
                </div>
                <div className={styles.msg}>
                  {String(c.commit?.message || '').split('\n')[0] || ''}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.doneBtn} onClick={onClose}>
          {t('welcome.gotIt')}
        </button>
      </div>
    </div>
  );
}

export default WelcomeModal;
