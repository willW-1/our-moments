import styles from './MemoryCard.module.css';

const TYPE_ICONS = {
  date: '💕',
  travel: '✈️',
  gift: '🎁',
  movie: '🎬',
  variety: '📺',
  other: '📌',
};

function MemoryCard({ memory }) {
  const { type, title, date, location, description, imageUrl } = memory;
  const icon = TYPE_ICONS[type] || TYPE_ICONS.other;

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
      <div className={styles.inner}>
        <div className={styles.iconArea}>{icon}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.date}>{formatDate(date)}</p>
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
