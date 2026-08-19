import { useEffect, useState } from 'react';
import {
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  createMessageReply,
  updateMessageReply,
  deleteMessageReply,
} from '../../api';
import { formatDateTime } from '../../formatTime';
import { ChatIcon, UserIcon } from '../icons';
import styles from './MessageBoard.module.css';

// 留言板：每条留言显示内容 + 日期 + 作者，支持一层回复
function MessageBoard({ isViewer }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(''); // 新留言输入
  const [submitting, setSubmitting] = useState(false);
  // 编辑留言
  const [editingId, setEditingId] = useState(null); // 正在编辑的留言 id
  const [editContent, setEditContent] = useState('');
  // 回复留言
  const [replyingTo, setReplyingTo] = useState(null); // 正在回复的留言 id
  const [replyDraft, setReplyDraft] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  // 编辑回复
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');

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
      setMessages((prev) => [{ ...created, replies: [] }, ...prev]);
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
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, content: updated.content } : m)));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('确定删除这条留言吗？其下回复会一并删除。')) return;
    try {
      await deleteMessage(getToken(), msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  const startReply = (msg) => {
    setReplyingTo(msg.id);
    setReplyDraft('');
    setError('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyDraft('');
  };

  const handleSubmitReply = async (msg) => {
    if (!replyDraft.trim() || replySubmitting) return;
    setReplySubmitting(true);
    setError('');
    try {
      const created = await createMessageReply(getToken(), msg.id, replyDraft.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, replies: [...(m.replies || []), created] } : m))
      );
      setReplyingTo(null);
      setReplyDraft('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '回复失败');
    } finally {
      setReplySubmitting(false);
    }
  };

  const startEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyContent('');
  };

  const handleSaveReplyEdit = async (msg, reply) => {
    if (!editReplyContent.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateMessageReply(getToken(), reply.id, editReplyContent.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                replies: (m.replies || []).map((r) =>
                  r.id === updated.id ? { ...r, content: updated.content } : r
                ),
              }
            : m
        )
      );
      setEditingReplyId(null);
      setEditReplyContent('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (msg, reply) => {
    if (!window.confirm('确定删除这条回复吗？')) return;
    try {
      await deleteMessageReply(getToken(), reply.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, replies: (m.replies || []).filter((r) => r.id !== reply.id) }
            : m
        )
      );
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}><ChatIcon size={16} strokeWidth={1.8} /> 留言板</span>
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
              <span className={styles.author}><UserIcon size={12} strokeWidth={1.8} /> {msg.author || '匿名'}</span>
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
                {/* 旁观者也可以回复留言 */}
                <button type="button" className={styles.linkBtn} onClick={() => startReply(msg)}>
                  回复
                </button>
                {/* 旁观者不显示编辑/删除 */}
                {!isViewer && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {replyingTo === msg.id && (
              <form
                className={styles.replyForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(msg);
                }}
              >
                <input
                  className={styles.replyInput}
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`回复 ${msg.author || 'ta'}…`}
                  disabled={replySubmitting}
                  autoFocus
                />
                <button
                  className={styles.submit}
                  type="submit"
                  disabled={replySubmitting || !replyDraft.trim()}
                >
                  发送
                </button>
                <button type="button" className={styles.cancelReply} onClick={cancelReply}>
                  取消
                </button>
              </form>
            )}

            {msg.replies && msg.replies.length > 0 && (
              <ul className={styles.replies}>
                {msg.replies.map((reply) => (
                  <li key={reply.id} className={styles.reply}>
                    <div className={styles.meta}>
                      <span className={styles.author}><UserIcon size={12} strokeWidth={1.8} /> {reply.author || '匿名'}</span>
                      <span className={styles.time}>{formatDateTime(reply.createdAt)}</span>
                    </div>

                    {editingReplyId === reply.id ? (
                      <div className={styles.editBox}>
                        <textarea
                          className={styles.editInput}
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          rows={2}
                        />
                        <div className={styles.editActions}>
                          <button type="button" className={styles.cancel} onClick={cancelEditReply}>
                            取消
                          </button>
                          <button
                            type="button"
                            className={styles.save}
                            onClick={() => handleSaveReplyEdit(msg, reply)}
                            disabled={submitting || !editReplyContent.trim()}
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.content}>{reply.content}</p>
                    )}

                    {editingReplyId !== reply.id && !isViewer && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => startEditReply(reply)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className={`${styles.linkBtn} ${styles.danger}`}
                          onClick={() => handleDeleteReply(msg, reply)}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MessageBoard;
