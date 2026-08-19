import { MoonIcon, SunIcon } from '../icons';
import styles from './ThemeToggle.module.css';

/* 左下角日夜模式切换：luxe=黑夜（默认），luxe-day=白昼 */
export default function ThemeToggle({ theme, onToggle }) {
  const isDay = theme === 'luxe-day';
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={isDay ? '切换到夜间模式' : '切换到日间模式'}
      title={isDay ? '切换到夜间模式' : '切换到日间模式'}
    >
      {isDay ? <MoonIcon size={17} strokeWidth={1.8} /> : <SunIcon size={17} strokeWidth={1.8} />}
    </button>
  );
}
