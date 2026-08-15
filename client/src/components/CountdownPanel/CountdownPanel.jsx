import { useEffect, useState } from 'react';
import { fetchCountdowns, createCountdown, updateCountdown, deleteCountdown } from '../../api';
import styles from './CountdownPanel.module.css';

// 目标日期在未来的 → 倒计时「还有 N 天」；在过去的 → 正计时「已经 N 天」
function daysFromNow(dateStr) {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  // 按自然日计算（忽略时分秒），避免时区 / 时间导致 ±1 天
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetDay - today) / 86400000);
}

// 显示目标日期，如「2026年8月15日」
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function CountdownPanel() {
  const [countdowns, setCountdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 添加 / 编辑弹窗
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null=新建，对象=编辑
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const load = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setCountdowns(await fetchCountdowns(token));
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormDate('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setFormName(c.name || '');
    setFormDate(c.targetDate ? c.targetDate.slice(0, 10) : '');
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formName.trim()) {
      setFormError('主题名不能为空');
      return;
    }
    if (!formDate) {
      setFormError('请选择目标日期');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = { name: formName.trim(), targetDate: formDate };
      if (editing) {
        await updateCountdown(getToken(), editing.id, payload);
      } else {
        await createCountdown(getToken(), payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`确定删除「${c.name}」这个倒计时吗？`)) return;
    try {
      await deleteCountdown(getToken(), c.id);
      await load();
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>⏳ 倒计时</span>
        <button type="button" className={styles.addBtn} onClick={openAdd} title="添加倒计时">
          ＋
        </button>
      </div>

      {loading && <p className={styles.status}>加载中…</p>}
      {!loading && error && <p className={`${styles.status} ${styles.errorText}`}>{error}</p>}
      {!loading && !error && countdowns.length === 0 && (
        <p className={styles.status}>还没有倒计时，点 ＋ 添加一个</p>
      )}

      <ul className={styles.list}>
        {countdowns.map((c) => {
          const days = daysFromNow(c.targetDate);
          return (
            <li key={c.id} className={styles.item}>
              <div className={styles.daysBox}>
                {days === null ? (
                  <span className={styles.days}>—</span>
                ) : (
                  <>
                    <span className={styles.days}>{Math.abs(days)}</span>
                    <span className={styles.daysUnit}>天</span>
                  </>
                )}
              </div>
              <div className={styles.info}>
                <p className={styles.name}>
                  {days === null ? c.name : days > 0 ? `距离「${c.name}」还有` : days === 0 ? `「${c.name}」就是今天` : `距离「${c.name}」已经`}
                </p>
                <p className={styles.date}>{formatDate(c.targetDate)}</p>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.linkBtn} onClick={() => openEdit(c)}>
                  编辑
                </button>
                <button
                  type="button"
                  className={`${styles.linkBtn} ${styles.danger}`}
                  onClick={() => handleDelete(c)}
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <form
            className={styles.modal}
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>{editing ? '编辑倒计时' : '添加倒计时'}</h3>
            <label className={styles.label}>
              主题名
              <input
                className={styles.input}
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如：纪念日 / 生日"
              />
            </label>
            <label className={styles.label}>
              目标日期
              <input
                className={styles.input}
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>
            {formError && <p className={styles.error}>{formError}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancel} onClick={closeModal}>
                取消
              </button>
              <button type="submit" className={styles.save} disabled={submitting}>
                {submitting ? '保存中…' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CountdownPanel;
