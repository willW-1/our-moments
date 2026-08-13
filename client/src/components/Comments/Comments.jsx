import { useEffect, useState } from 'react';
import { createComment, updateComment, deleteComment } from '../../api';
import { formatRelativeTime } from '../../formatTime';
import styles from './Comments.module.css';

function Comments({ memoryId, comments: initialComments }) {
  const [comments, setComments] = useState(initialComments || []);
  const [draft, setDraft] = useState(''); // 新评论输入
  const [editingId, setEditingId] = useState(null); // 正在编辑的评论 id
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 父组件刷新列表后同步最新评论
  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments]);

  const getToken = () => localStorage.getItem('token');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await createComment(getToken(), memoryId, draft.trim());
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (comment) => {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateComment(getToken(), comment.id, editContent.trim());
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await deleteComment(getToken(), comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="写下你的评论…"
          disabled={submitting}
        />
        <button className={styles.submit} type="submit" disabled={submitting || !draft.trim()}>
          评论
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.list}>
        {comments.map((comment) => (
          <li key={comment.id} className={styles.item}>
            <div className={styles.meta}>
              <span className={styles.author}>👤 {comment.author || '匿名'}</span>
              <span className={styles.time}>· {formatRelativeTime(comment.createdAt)}</span>
            </div>

            {editingId === comment.id ? (
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
                    onClick={() => handleSaveEdit(comment)}
                    disabled={submitting || !editContent.trim()}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.content}>{comment.content}</p>
            )}

            {editingId !== comment.id && (
              <div className={styles.itemActions}>
                <button type="button" className={styles.linkBtn} onClick={() => startEdit(comment)}>
                  编辑
                </button>
                <button
                  type="button"
                  className={`${styles.linkBtn} ${styles.danger}`}
                  onClick={() => handleDelete(comment)}
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

export default Comments;
