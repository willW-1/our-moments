import styles from './MemoryCard.module.css';

const TYPE_ICONS = {
  // 英文键（兼容旧 mock 数据）
  date: '💕',
  travel: '✈️',
  gift: '🎁',
  movie: '🎬',
  variety: '📺',
  other: '📌',
  // 中文键（数据库真实数据）
  约会: '💕',
  旅游: '✈️',
  旅行: '✈️',
  礼物: '🎁',
  电影: '🎬',
  综艺: '📺',
  演唱会: '🎫',
  演出: '🎫',
  其他: '📌',
};

function MemoryCard({ memory, currentUsername, onEdit, onDelete }) {
  const { type, title, date, location, description, imageUrl, author } = memory;
  const icon = TYPE_ICONS[type] || TYPE_ICONS.other;
  // 只有自己发出的卡片才显示 编辑/删除 按钮
  const isOwner = Boolean(author) && author === currentUsername;

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
      {isOwner && (
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
        <div className={styles.iconArea}>{icon}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.date}>{formatDate(date)}</p>
          {author && (
            <p className={styles.author}>👤 {author}</p>
          )}
          {location && (
            <p className={styles.location}>📍 {location}</p>
          )}
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>
      </div>
      {imageUrl && (
        <img
          className={styles.image}
          src={imageUrl}
          alt={title}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

export default MemoryCard;
