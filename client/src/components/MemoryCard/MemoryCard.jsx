import { useEffect, useState } from 'react';
import styles from './MemoryCard.module.css';
import Comments from '../Comments/Comments';
import { formatRelativeTime } from '../../formatTime';
import { resolveImageUrl } from '../../api';
import {
  HeartIcon, PlaneIcon, GiftIcon, FilmIcon, TvIcon, TicketIcon, TagIcon,
  ClockIcon, UserIcon, PinIcon, CloseIcon,
} from '../icons';

// 回忆类型图标（替代原 emoji，改用线性 SVG）
const TYPE_ICONS = {
  // 英文键（兼容旧 mock 数据）
  date: HeartIcon,
  travel: PlaneIcon,
  gift: GiftIcon,
  movie: FilmIcon,
  variety: TvIcon,
  other: TagIcon,
  // 中文键（数据库真实数据）
  约会: HeartIcon,
  旅游: PlaneIcon,
  旅行: PlaneIcon,
  礼物: GiftIcon,
  电影: FilmIcon,
  综艺: TvIcon,
  演唱会: TicketIcon,
  演出: TicketIcon,
  其他: TagIcon,
};

function MemoryCard({ memory, onEdit, onDelete, isViewer }) {
  const { type, title, date, location, description, imageUrl, author, createdAt, comments } = memory;
  const TypeIcon = TYPE_ICONS[type] || TYPE_ICONS.other;
  // 点击图片放大（lightbox）：点遮罩或 ✕ 关闭
  const [zoomed, setZoomed] = useState(false);

  // 打开放大时按 Esc 也可关闭
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.card}>
      {/* 旁观者不显示编辑/删除 */}
      {!isViewer && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(memory)}
            title="编辑这条回忆"
          >
            编辑
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(memory)}
            title="删除这条回忆"
          >
            删除
          </button>
        </div>
      )}
      <div className={styles.inner}>
        <div className={styles.iconArea}>{TypeIcon && <TypeIcon size={26} strokeWidth={1.7} />}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.date}>{formatDate(date)}</p>
          <p className={styles.publishTime}><ClockIcon size={12} strokeWidth={1.8} /> 发布于 {formatRelativeTime(createdAt)}</p>
          {author && (
            <p className={styles.author}><UserIcon size={13} strokeWidth={1.8} /> {author}</p>
          )}
          {location && (
            <p className={styles.location}><PinIcon size={13} strokeWidth={1.8} /> {location}</p>
          )}
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>
      </div>
      {imageUrl && (
        <>
          <img
            className={styles.image}
            src={resolveImageUrl(imageUrl)}
            alt={title}
            onClick={() => setZoomed(true)}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {zoomed && (
            <div className={styles.zoomOverlay} onClick={() => setZoomed(false)}>
              <img
                className={styles.zoomImage}
                src={resolveImageUrl(imageUrl)}
                alt={title}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className={styles.zoomClose}
                onClick={() => setZoomed(false)}
                aria-label="关闭"
              >
                <CloseIcon size={18} />
              </button>
            </div>
          )}
        </>
      )}
      <Comments memoryId={memory.id} comments={comments} isViewer={isViewer} />
    </div>
  );
}

export default MemoryCard;
