import styles from './LetterModal.module.css';
import { HeartLogo, HeartIcon, CloseIcon } from '../icons';

// 生日信正文：写给 wyc 的一封信（内容由网站主人提供，原样呈现）
const LETTER_BODY = [
  '见字如面，虽然这连手写字都不算，但是还是希望它能带给你我的一些情感吧。',
  '其实我想了很多，这些字的形式，呈现方式，网站的布局、设计，甚至包括一开始对你的称呼。但思来想去，最终还是决定先开始写这么些东西。',
  '现在是七夕的晚上。我其实很希望能够在你身边跟你一起过节，跟你一起倒数着迎接你的十八岁。可事与愿违，我只能在房间里打着字，而你，据你所说，在学军体拳）但万幸是我在你的启发下搞了这个网站，让我的这些文字能够有一个载体而不是干巴巴的在微信上发过去。',
  '我可能真的不是一个很会制造惊喜和浪漫的人吧，sry，有一些东西我想好了就会忍不住跟你说…但是这个我绷住了。我希望你在七夕这天没有上那个网站，没有看到新的我也不知道你觉得好不好看的新设计和配色，就让它和这些文字一起作为我带给你的生日惊喜和仪式感，呃，的一部分吧。',
  '哎这个时间真的很诡异。七夕的第二天就是你的生日，让我有些措不及防也有些手忙脚乱。再加上最近港大选课的事情搞得我有些焦头烂额，所以没能给你准备更多。这个七夕过得，也有一点点干巴，确实没有什么办法）',
  '说老实话，我其实有一些讨厌没有名分地去做一些事情。包括现在写这些字，包括，哎，去"过"七夕这种节日，但是谁叫我喜欢你呢。',
  '你身上体现的对于世界的洞察、对于人与人的思考还有你性格里的那份坚定和笃定，都是在今后的人生路上宝贵而有用的东西，你也必将在未来走出属于自己的路，你的未来很光明，wyc，不要让任何人或事定义你或者干扰你的自信心。自信一点，你真的很棒。',
  '我一直在考虑这次该写点什么。最终我还是选择了意识流一点，不去回顾我们的过去，也很少展望我们的未来。因为我觉得我们来日方长，未来是由我们一步步去创造的。略带私心地讲，我希望我能在你的未来里。',
  '如果这些文字有任何嘉豪之处请你原谅我。时间仓促我并没有细细斟酌每一句话。',
];

// 落款「生日快乐，wyc。」之后的收尾段
const LETTER_TAIL = [
  '祝你七夕快乐，生日快乐，以后的每一天都快乐。你已经成年了。那些曾经伤害过你的烂人烂事将在你迈入人生新阶段的此刻灰飞烟灭，不会对你的未来造成什么伤害了。',
  '希望你的大学生活一切顺利。',
];

// 生日信弹窗：wyc 登录时先于更新内容弹窗展示，需手动关闭。
// 信纸样式：衬线字体 + 宽松行距，标题用主题渐变，落款用渐变突出。
function LetterModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          <CloseIcon size={14} strokeWidth={2} />
        </button>

        <div className={styles.body}>
          <div className={styles.head}>
            <div className={styles.emoji}><HeartLogo size={44} /></div>
            <h2 className={styles.title}>生日快乐，wyc</h2>
            <p className={styles.subtitle}>一封写给你的信</p>
          </div>

          <div className={styles.letter}>
            <p className={styles.greeting}>嗨 wyc</p>
            {LETTER_BODY.map((t) => (
              <p key={t}>{t}</p>
            ))}
            <p className={styles.signature}>生日快乐，wyc。</p>
            {LETTER_TAIL.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>

          <div className={styles.divider} aria-hidden="true">
            <HeartIcon size={14} strokeWidth={1.4} />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            读完了
          </button>
        </div>
      </div>
    </div>
  );
}

export default LetterModal;
