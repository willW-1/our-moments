import { useEffect, useRef } from 'react';
import './ParticleField.css';

/* ============================================================
   星空粒子层（桌面）
   - 数百个白色光点缓慢上飘、微微闪烁
   - 鼠标靠近时光点被轻轻牵引（跟随鼠标）
   - 颜色读 CSS 变量 --particle-color，随主题自动适配
   - 手机端（hover:none / coarse）不启用，改由 CSS 静态星空承担
   ============================================================ */
export default function ParticleField({ theme }) {
  const canvasRef = useRef(null);
  const colorRef = useRef('rgba(255, 255, 255, 0.85)');

  // 主题切换时更新粒子颜色
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const c = cs.getPropertyValue('--particle-color').trim();
    if (c) colorRef.current = c;
  }, [theme]);

  useEffect(() => {
    // 手机端不需要鼠标粒子
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // 限制 DPR，控制性能
      width = canvas.width = Math.floor(window.innerWidth * dpr);
      height = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const count = Math.min(
        130,
        Math.max(40, Math.floor((window.innerWidth * window.innerHeight) / 15000))
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 1.7 + 0.5) * dpr,
        vx: (Math.random() - 0.5) * 0.16 * dpr,
        vy: (Math.random() - 0.5) * 0.16 * dpr - 0.05 * dpr, // 轻微上飘，像星光
        tw: Math.random() * Math.PI * 2, // 闪烁相位
        twSpeed: 0.012 + Math.random() * 0.02,
      }));
    };

    const onPointerMove = (e) => {
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      const color = colorRef.current;
      for (const p of particles) {
        // 鼠标引力：靠近的光点被轻轻牵动
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const radius = 130 * dpr;
        if (dist < radius && dist > 0.01) {
          const force = (1 - dist / radius) * 0.12 * dpr;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        // 出界回绕
        if (p.x < -12) p.x = width + 12;
        else if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        else if (p.y > height + 12) p.y = -12;

        // 闪烁
        p.tw += p.twSpeed;
        const alpha = 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(p.tw));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
