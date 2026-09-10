import { useEffect, useState } from 'react';
import styles from './MemoryCard.module.css';
import Comments from '../Comments/Comments';
import useRevealOnScroll from '../../useRevealOnScroll';
import { formatLocalDate, formatRelativeTime } from '../../formatTime';
import { resolveImageUrl } from '../../api';
import { t, useT } from '../../i18n';
import {
  HeartIcon, PlaneIcon, GiftIcon, FilmIcon, GraduationIcon, TvIcon, TicketIcon, TagIcon,
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
  学习: GraduationIcon,
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
  useT(); // 订阅语言（相对时间 / 日期格式 / 按钮文案都跟着切）
  const { type, title, date, location, description, imageUrl, author, createdAt, comments } = memory;
  const TypeIcon = TYPE_ICONS[type] || TYPE_ICONS.other;
  // 滚动进入视口逐步显现：初始透明 + 稍下移，进入后过渡到完全显示
  const { ref: cardRef, revealed } = useRevealOnScroll();
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

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${styles.reveal} ${revealed ? styles.revealed : ''}`}
    >
      {/* 旁观者不显示编辑/删除 */}
      {!isViewer && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(memory)}
            title={t('memoryCard.editTitle')}
          >
            {t('common.edit')}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(memory)}
            title={t('memoryCard.deleteTitle')}
          >
            {t('common.delete')}
          </button>
        </div>
      )}
      <div className={styles.inner}>
        <div className={styles.iconArea}>{TypeIcon && <TypeIcon size={26} strokeWidth={1.7} />}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.date}>{formatLocalDate(date)}</p>
          <p className={styles.publishTime}>
            <ClockIcon size={12} strokeWidth={1.8} /> {t('memoryCard.postedAt')}{' '}
            {formatRelativeTime(createdAt)}
          </p>
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
                aria-label={t('common.close')}
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
