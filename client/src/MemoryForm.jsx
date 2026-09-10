import { useEffect, useId, useRef, useState } from 'react';
import { uploadImage, resolveImageUrl } from './api';
import { ChevronDownIcon } from './components/icons';
import { t, typeLabel, useT } from './i18n';
import styles from './MemoryForm.module.css';

// 与 MemoryCard 的 TYPE_ICONS 中文 key 保持一致。
// 注意：这些中文是「存进数据库的值」，任何情况下都不能翻译——
// 英文界面下只把显示文字换成 typeLabel()，选项 key / 选中判断 / 提交内容仍是中文。
const TYPE_OPTIONS = ['学习', '旅行', '电影', '演唱会', '演出', '礼物', '综艺', '其他'];

// 添加 / 编辑共用的表单弹窗
// initial 为 null 表示新建；传 memory 对象则预填（编辑模式）
// onSubmit(payload) 应返回 Promise，resolve 后自动关闭弹窗
function MemoryForm({ heading, submitLabel, initial, onSubmit, onClose }) {
  useT(); // 订阅语言
  const fileInputId = useId();
  const typeWrapRef = useRef(null);
  // 自定义类型下拉：点外部 / Esc 关闭
  const [typeOpen, setTypeOpen] = useState(false);
  const [type, setType] = useState(initial?.type || '学习');
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  // 数据胶囊 S3 的对象 key（上传成功后才有；有它说明图片是直传到数据胶囊的）
  const [imageKey, setImageKey] = useState(initial?.imageKey || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 类型下拉打开时：点下拉外关闭，按 Esc 关闭
  useEffect(() => {
    if (!typeOpen) return;
    const onPointerDown = (e) => {
      if (typeWrapRef.current && !typeWrapRef.current.contains(e.target)) setTypeOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setTypeOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [typeOpen]);

  // 图片上传
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 选择本地图片 → 浏览器直传数据胶囊 → 得到 key（存库）和 getUrl（预览）
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // 清空，允许再次选择同一个文件
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('memoryForm.errSessionExpired'));
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const res = await uploadImage(token, file);
      setImageKey(res.key);
      setImageUrl(res.getUrl);
    } catch (err) {
      setUploadError(err.message || t('error.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 表单验证：标题和日期必填
    if (!title.trim()) {
      setError(t('memoryForm.errTitleRequired'));
      return;
    }
    if (!date) {
      setError(t('memoryForm.errDateRequired'));
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
        imageKey: imageKey || null,
      });
      onClose();
    } catch (err) {
      if (err.status === 401) {
        setError(t('memoryForm.errSessionExpired'));
      } else {
        setError(err.message || t('memoryForm.errSaveFailed'));
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

        {/* 自定义类型下拉：原生 <select> 的选项弹层是系统白底，深色主题下看不清；改用主题化的自定义菜单 */}
        <div className={`${styles.label} ${styles.typeField}`} ref={typeWrapRef}>
          {t('memoryForm.type')}
          <button
            type="button"
            className={`${styles.select} ${styles.typeBtn}`}
            aria-haspopup="listbox"
            aria-expanded={typeOpen}
            onClick={() => setTypeOpen((o) => !o)}
          >
            <span>{typeLabel(type)}</span>
            <ChevronDownIcon size={16} strokeWidth={2} />
          </button>
          {typeOpen && (
            <ul className={styles.typeMenu} role="listbox">
              {/* option 是数据库里的中文值（key / 选中判断 / 提交都用它），只有显示文字翻译 */}
              {TYPE_OPTIONS.map((value) => (
                <li key={value} role="option" aria-selected={type === value}>
                  <button
                    type="button"
                    className={`${styles.typeOption} ${type === value ? styles.typeOptionActive : ''}`}
                    onClick={() => {
                      setType(value);
                      setTypeOpen(false);
                    }}
                  >
                    {typeLabel(value)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className={styles.label}>
          {t('memoryForm.title')} <span className={styles.required}>*</span>
          <input
            className={styles.input}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('memoryForm.titlePlaceholder')}
          />
        </label>

        <label className={styles.label}>
          {t('memoryForm.date')} <span className={styles.required}>*</span>
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          {t('memoryForm.location')}
          <input
            className={styles.input}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('memoryForm.locationPlaceholder')}
          />
        </label>

        <label className={styles.label}>
          {t('memoryForm.description')}
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('memoryForm.descriptionPlaceholder')}
            rows={3}
          />
        </label>

        <label className={styles.label}>
          {t('memoryForm.image')}
          <div className={styles.uploadArea}>
            {/* 原生 file input 视觉隐藏：避免浏览器自带的「未选择任何文件」小字，改由下方 label 按钮触发 */}
            <input
              id={fileInputId}
              className={styles.hiddenInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <span className={styles.uploadHint}>{t('memoryForm.uploading')}</span>
            ) : imageUrl ? (
              <>
                <img
                  className={styles.preview}
                  src={resolveImageUrl(imageUrl)}
                  alt={t('memoryForm.imagePreviewAlt')}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => {
                    setImageKey('');
                    setImageUrl('');
                  }}
                >
                  {t('memoryForm.removeImage')}
                </button>
              </>
            ) : (
              <>
                <label htmlFor={fileInputId} className={styles.fileButton}>
                  {t('memoryForm.chooseImage')}
                </label>
                <span className={styles.uploadHint}>{t('memoryForm.uploadHint')}</span>
              </>
            )}
          </div>
          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          {!imageKey && (
            <input
              className={styles.input}
              type="text"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageKey('');
              }}
              placeholder={t('memoryForm.imageUrlPlaceholder')}
            />
          )}
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? t('common.saving') : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MemoryForm;
