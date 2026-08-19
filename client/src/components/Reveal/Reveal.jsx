import useRevealOnScroll from '../../useRevealOnScroll';
import styles from './Reveal.module.css';

// 通用「进入视口逐步显现」容器：默认渲染 div，可用 as 指定标签（如 as="li"）。
// 初始透明 + 稍下移，进入视口后过渡到完全显示。
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const { ref, revealed } = useRevealOnScroll();
  return (
    <Tag ref={ref} className={`${className} ${revealed ? styles.revealed : styles.reveal}`} {...rest}>
      {children}
    </Tag>
  );
}
