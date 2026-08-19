import { useId } from 'react';

/* ============================================================
   内联 SVG 线性图标库（苹果 SF Symbols 风格）
   - 全部使用 currentColor，颜色自动跟随主题
   - 不用下载图片、无外部请求、任意尺寸清晰
   - 通用 props：size（宽高）、strokeWidth（线宽）
   ============================================================ */

const svgProps = (size, strokeWidth, rest) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...rest,
});

/* 品牌 Logo：渐变色实心爱心（头图 / 登录页 / 欢迎弹窗用） */
export function HeartLogo({ size = 40 }) {
  const rawId = useId();
  const id = rawId.replace(/[:]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--grad-a)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--grad-b)' }} />
        </linearGradient>
      </defs>
      <path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export function HeartIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function ClockIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CalendarIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function CameraIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function ChatIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function UserIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PinIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function SparkleIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275Z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
  );
}

export function PlusIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* 回忆类型图标（替代原 emoji） */
export function PlaneIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

export function GiftIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export function FilmIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  );
}

export function TvIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function TicketIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M2 9a3 3 0 0 1 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}

export function TagIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

/* 日夜切换按钮用：太阳 / 月亮 */
export function SunIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon(props) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return (
    <svg {...svgProps(size, strokeWidth, rest)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
