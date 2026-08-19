import { useEffect, useRef, useState } from 'react';

// 滚动进入视口时逐步显现：初始透明 + 稍下移，进入后过渡到完全显示。
// 用法：
//   const { ref, revealed } = useRevealOnScroll();
//   <div ref={ref} className={revealed ? 'revealed' : 'reveal'} … />
// 需要在样式里配合 .reveal（初始隐藏）/.revealed（完全显示）两个类。
export default function useRevealOnScroll(threshold = 0.12) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(() => {
    // 用户偏好减少动效 / 无 window：直接完全显示，不做入场动画
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (revealed) return; // 已显示（或偏好减少动效）则无需观察
    const el = ref.current;
    if (!el) return;
    // 老浏览器不支持 IntersectionObserver：直接显示，避免内容永不可见
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      // 提前 32px 触发，让元素进入视口前就开始显现
      { threshold, rootMargin: '0px 0px -32px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [revealed, threshold]);

  return { ref, revealed };
}
