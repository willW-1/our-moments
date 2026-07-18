import MemoryCard from '../MemoryCard/MemoryCard';
import styles from './MemoryList.module.css';

function MemoryList({ memories }) {
  const sorted = [...memories].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });

  return (
    <div className={styles.list}>
      {/* <h2 className={styles.heading}>回忆记录</h2>
      <p className={styles.subtitle}>共 {memories.length} 条记录</p> */}
      {sorted.map((memory, index) => (
        <MemoryCard key={memory.id || index} memory={memory} />
      ))}
    </div>
  );
}

export default MemoryList;
