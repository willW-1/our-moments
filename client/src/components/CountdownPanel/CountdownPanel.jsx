import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchCountdowns, createCountdown, updateCountdown, deleteCountdown } from '../../api';
import { ClockIcon, PlusIcon } from '../icons';
import Reveal from '../Reveal/Reveal';
import { t, tCount, useT } from '../../i18n';
import { formatLocalDate } from '../../formatTime';
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

function CountdownPanel({ isViewer }) {
  useT(); // 订阅语言（倒计时名字是用户写的，不翻译）
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
      setError(err.status === 401 ? t('app.sessionExpired') : err.message || t('countdown.errLoad'));
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
      setFormError(t('countdown.errNameRequired'));
      return;
    }
    if (!formDate) {
      setFormError(t('countdown.errDateRequired'));
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
      setFormError(err.status === 401 ? t('app.sessionExpired') : err.message || t('countdown.errSave'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(t('countdown.confirmDelete', { name: c.name }))) return;
    try {
      await deleteCountdown(getToken(), c.id);
      await load();
    } catch (err) {
      alert(err.message || t('countdown.errDelete'));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>
          <ClockIcon size={16} strokeWidth={1.8} /> {t('countdown.title')}
        </span>
        {/* 旁观者不显示添加按钮 */}
        {!isViewer && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={openAdd}
            title={t('countdown.addTitle')}
          >
            <PlusIcon size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {loading && <p className={styles.status}>{t('common.loading')}</p>}
      {!loading && error && <p className={`${styles.status} ${styles.errorText}`}>{error}</p>}
      {!loading && !error && countdowns.length === 0 && (
        <p className={styles.status}>
          {isViewer ? t('countdown.emptyViewer') : t('countdown.empty')}
        </p>
      )}

      <ul className={styles.list}>
        {countdowns.map((c) => {
          const days = daysFromNow(c.targetDate);
          return (
            <Reveal as="li" key={c.id} className={styles.item}>
              <div className={styles.daysBox}>
                {days === null ? (
                  <span className={styles.days}>—</span>
                ) : (
                  <>
                    <span className={styles.days}>{Math.abs(days)}</span>
                    <span className={styles.daysUnit}>
                      {tCount('countdown.daysUnit', Math.abs(days))}
                    </span>
                  </>
                )}
              </div>
              <div className={styles.info}>
                {/* 目标名 c.name 是用户自己写的，只翻译外面这层句式 */}
                <p className={styles.name}>
                  {days === null
                    ? c.name
                    : t(
                        days > 0 ? 'countdown.future' : days === 0 ? 'countdown.today' : 'countdown.past',
                        { name: c.name },
                      )}
                </p>
                <p className={styles.date}>{formatLocalDate(c.targetDate)}</p>
              </div>
              {!isViewer && (
                <div className={styles.actions}>
                  <button type="button" className={styles.linkBtn} onClick={() => openEdit(c)}>
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.linkBtn} ${styles.danger}`}
                    onClick={() => handleDelete(c)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              )}
            </Reveal>
          );
        })}
      </ul>

      {showModal &&
        createPortal(
          // 用 Portal 挂到 body：面板带 backdrop-filter 会变成 fixed 的包含块，
          // 直接渲染会把弹窗锁进左侧小面板；挂到 body 后才是真正的全屏居中遮罩弹窗
          <div className={styles.overlay} onClick={closeModal}>
            <form
              className={styles.modal}
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>
                {editing ? t('countdown.editTitle') : t('countdown.addTitle')}
              </h3>
              <label className={styles.label}>
                {t('countdown.nameLabel')}
                <input
                  className={styles.input}
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('countdown.namePlaceholder')}
                />
              </label>
              <label className={styles.label}>
                {t('countdown.dateLabel')}
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
                  {t('common.cancel')}
                </button>
                <button type="submit" className={styles.save} disabled={submitting}>
                  {submitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}

export default CountdownPanel;
