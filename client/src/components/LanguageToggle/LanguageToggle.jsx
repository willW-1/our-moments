import { t, toggleLanguage, useLanguage } from '../../i18n';
import styles from './LanguageToggle.module.css';

/* 中英文切换按钮。
   显示的是「点了之后会切到的语言」：中文界面显示 EN，英文界面显示 中。
   variant：
     - header（默认）登录后放在顶栏标题右侧
     - fixed        登录页用，固定视口左上角（登录页没有顶栏） */
export default function LanguageToggle({ variant = 'header' }) {
  const lang = useLanguage();
  const label = lang === 'zh' ? t('header.switchToEnglish') : t('header.switchToChinese');

  return (
    <button
      type="button"
      className={styles[variant]}
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  );
}
