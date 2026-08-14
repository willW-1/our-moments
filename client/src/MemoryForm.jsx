import { useState } from 'react';
import { uploadImage, resolveImageUrl } from './api';
import styles from './MemoryForm.module.css';

// 与 MemoryCard 的 TYPE_ICONS 中文 key 保持一致
const TYPE_OPTIONS = ['约会', '旅游', '旅行', '电影', '演唱会', '演出', '礼物', '综艺', '其他'];

// 添加 / 编辑共用的表单弹窗
// initial 为 null 表示新建；传 memory 对象则预填（编辑模式）
// onSubmit(payload) 应返回 Promise，resolve 后自动关闭弹窗
function MemoryForm({ heading, submitLabel, initial, onSubmit, onClose }) {
  const [type, setType] = useState(initial?.type || '约会');
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 图片上传
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 选择本地图片 → 上传到数据胶囊 → 得到可用的 imageUrl
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // 清空，允许再次选择同一个文件
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('登录已过期，请重新登录');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const res = await uploadImage(token, file);
      setImageUrl(res.imageUrl);
    } catch (err) {
      setUploadError(err.message || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 表单验证：标题和日期必填
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (!date) {
      setError('日期不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        date,
        location: location.trim() || null,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      if (err.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        setError(err.message || '保存失败，请稍后再试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>{heading}</h2>

        <label className={styles.label}>
          类型
          <select
            className={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          标题 <span className={styles.required}>*</span>
          <input
            className={styles.input}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：第一次去迪士尼"
          />
        </label>

        <label className={styles.label}>
          日期 <span className={styles.required}>*</span>
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          地点
          <input
            className={styles.input}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例如：上海迪士尼"
          />
        </label>

        <label className={styles.label}>
          描述
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="这段回忆的故事…"
            rows={3}
          />
        </label>

        <label className={styles.label}>
          图片
          <div className={styles.uploadArea}>
            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <span className={styles.uploadHint}>上传中…</span>
            ) : imageUrl ? (
              <img className={styles.preview} src={resolveImageUrl(imageUrl)} alt="图片预览" />
            ) : (
              <span className={styles.uploadHint}>选择本地图片上传到数据胶囊</span>
            )}
          </div>
          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          <input
            className={styles.input}
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="或直接粘贴图片链接（留空则不带图）"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            取消
          </button>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? '保存中…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MemoryForm;
