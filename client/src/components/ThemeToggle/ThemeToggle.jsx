import { MoonIcon, SunIcon } from '../icons';
import { t, useT } from '../../i18n';
import styles from './ThemeToggle.module.css';

/* 左下角日夜模式切换：luxe=黑夜（默认），luxe-day=白昼 */
export default function ThemeToggle({ theme, onToggle }) {
  useT(); // 订阅语言：按钮提示文字跟着切
  const isDay = theme === 'luxe-day';
  const label = isDay ? t('theme.toDark') : t('theme.toLight');
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {isDay ? <MoonIcon size={17} strokeWidth={1.8} /> : <SunIcon size={17} strokeWidth={1.8} />}
    </button>
  );
}
