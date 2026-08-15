import { useEffect, useState } from 'react';
import { fetchMessages, createMessage, updateMessage, deleteMessage } from '../../api';
import { formatDateTime } from '../../formatTime';
import styles from './MessageBoard.module.css';

function MessageBoard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(''); // 新留言输入
  const [editingId, setEditingId] = useState(null); // 正在编辑的留言 id
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const load = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setMessages(await fetchMessages(token));
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await createMessage(getToken(), { content: draft.trim() });
      setMessages((prev) => [created, ...prev]);
      setDraft('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '留言失败');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (msg) => {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateMessage(getToken(), msg.id, { content: editContent.trim() });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('确定删除这条留言吗？')) return;
    try {
      await deleteMessage(getToken(), msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>💬 留言板</span>
      </div>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="写下想说的话…"
          disabled={submitting}
        />
        <button className={styles.submit} type="submit" disabled={submitting || !draft.trim()}>
          留言
        </button>
      </form>

      {loading && <p className={styles.status}>加载中…</p>}
      {!loading && error && <p className={`${styles.status} ${styles.errorText}`}>{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className={styles.status}>还没有留言，来留个言吧～</p>
      )}

      <ul className={styles.list}>
        {messages.map((msg) => (
          <li key={msg.id} className={styles.item}>
            <div className={styles.meta}>
              <span className={styles.author}>👤 {msg.author || '匿名'}</span>
              <span className={styles.time}>{formatDateTime(msg.createdAt)}</span>
            </div>

            {editingId === msg.id ? (
              <div className={styles.editBox}>
                <textarea
                  className={styles.editInput}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                />
                <div className={styles.editActions}>
                  <button type="button" className={styles.cancel} onClick={cancelEdit}>
                    取消
                  </button>
                  <button
                    type="button"
                    className={styles.save}
                    onClick={() => handleSaveEdit(msg)}
                    disabled={submitting || !editContent.trim()}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.content}>{msg.content}</p>
            )}

            {editingId !== msg.id && (
              <div className={styles.itemActions}>
                <button type="button" className={styles.linkBtn} onClick={() => startEdit(msg)}>
                  编辑
                </button>
                <button
                  type="button"
                  className={`${styles.linkBtn} ${styles.danger}`}
                  onClick={() => handleDelete(msg)}
                >
                  删除
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MessageBoard;
