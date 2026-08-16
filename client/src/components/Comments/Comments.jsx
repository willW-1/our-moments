import { useEffect, useState } from 'react';
import { createComment, updateComment, deleteComment } from '../../api';
import { formatRelativeTime } from '../../formatTime';
import styles from './Comments.module.css';

// 回忆卡片下的评论：支持一层回复（每条评论下有 replies 列表）
function Comments({ memoryId, comments: initialComments, isViewer }) {
  const [comments, setComments] = useState(initialComments || []);
  const [draft, setDraft] = useState(''); // 新顶层评论输入
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 编辑顶层评论
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  // 回复某个顶层评论
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  // 编辑某条回复
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');

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
      setComments((prev) => [...prev, { ...created, replies: [] }]);
      setDraft('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const startReply = (comment) => {
    setReplyingTo(comment.id);
    setReplyDraft('');
    setError('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyDraft('');
  };

  const handleSubmitReply = async (comment) => {
    if (!replyDraft.trim() || replySubmitting) return;
    setReplySubmitting(true);
    setError('');
    try {
      const created = await createComment(getToken(), memoryId, replyDraft.trim(), comment.id);
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id ? { ...c, replies: [...(c.replies || []), created] } : c
        )
      );
      setReplyingTo(null);
      setReplyDraft('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '回复失败');
    } finally {
      setReplySubmitting(false);
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
      setComments((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, content: updated.content } : c))
      );
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err.status === 401 ? '登录已过期，请重新登录' : err.message || '保存失败');
    } finally {
      setSubmitting(false);
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

  const handleSaveReplyEdit = async (comment, reply) => {
    if (!editReplyContent.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateComment(getToken(), reply.id, editReplyContent.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                replies: (c.replies || []).map((r) =>
                  r.id === updated.id ? { ...r, content: updated.content } : r
                ),
              }
            : c
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

  const handleDelete = async (comment) => {
    if (!window.confirm('确定删除这条评论吗？其下回复会一并删除。')) return;
    try {
      await deleteComment(getToken(), comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  const handleDeleteReply = async (comment, reply) => {
    if (!window.confirm('确定删除这条回复吗？')) return;
    try {
      await deleteComment(getToken(), reply.id);
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, replies: (c.replies || []).filter((r) => r.id !== reply.id) }
            : c
        )
      );
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* 旁观者只能看评论，不能发表 */}
      {!isViewer && (
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
      )}

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

            {editingId !== comment.id && !isViewer && (
              <div className={styles.itemActions}>
                <button type="button" className={styles.linkBtn} onClick={() => startReply(comment)}>
                  回复
                </button>
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

            {replyingTo === comment.id && (
              <form
                className={styles.replyForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(comment);
                }}
              >
                <input
                  className={styles.replyInput}
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`回复 ${comment.author || 'ta'}…`}
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

            {comment.replies && comment.replies.length > 0 && (
              <ul className={styles.replies}>
                {comment.replies.map((reply) => (
                  <li key={reply.id} className={styles.reply}>
                    <div className={styles.meta}>
                      <span className={styles.author}>👤 {reply.author || '匿名'}</span>
                      <span className={styles.time}>· {formatRelativeTime(reply.createdAt)}</span>
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
                            onClick={() => handleSaveReplyEdit(comment, reply)}
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
                          onClick={() => handleDeleteReply(comment, reply)}
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

export default Comments;
