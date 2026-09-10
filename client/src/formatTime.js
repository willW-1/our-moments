import { getLanguage, t, tCount } from './i18n';

// 把时间戳格式化成"相对时间"（刚刚 / X 分钟前 / X 小时前 / X 天前 / 日期）
// 语言在调用时从 i18n store 读取：调用它的组件都订阅了语言，切换后会重新渲染
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t('time.justNow');
  const min = Math.floor(sec / 60);
  if (min < 60) return tCount('time.minutesAgo', min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return tCount('time.hoursAgo', hr);
  const day = Math.floor(hr / 24);
  if (day < 30) return tCount('time.daysAgo', day);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}

// 纯日期显示（回忆卡片、倒计时用）：
// 中文 2026年8月15日 / 英文 August 15, 2026。
// 沿用原来 getFullYear/getMonth/getDate 的本地时区语义（Intl 默认也是本地时区）。
const dateFormatters = {
  zh: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
};

export function formatLocalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return dateFormatters[getLanguage() === 'en' ? 'en' : 'zh'].format(d);
}

// 绝对日期时间：YYYY-MM-DD HH:mm（留言板展示用）
// 纯数字格式，与语言无关，不做本地化
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}
