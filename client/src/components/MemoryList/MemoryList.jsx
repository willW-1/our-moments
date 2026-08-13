import MemoryCard from '../MemoryCard/MemoryCard';
import styles from './MemoryList.module.css';

function MemoryList({ memories, onEdit, onDelete }) {
  const sorted = [...memories].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    if (dateB - dateA !== 0) return dateB - dateA;
    // 发生日期相同：按发布时间倒序（新发布的在前）
    const ca = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const cb = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return cb - ca;
  });

  return (
    <div className={styles.list}>
      {/* <h2 className={styles.heading}>回忆记录</h2>
      <p className={styles.subtitle}>共 {memories.length} 条记录</p> */}
      {sorted.map((memory, index) => (
        <MemoryCard
          key={memory.id || index}
          memory={memory}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default MemoryList;
