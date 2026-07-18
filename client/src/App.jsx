import './App.css';
import MemoryList from './components/MemoryList/MemoryList';

const mockData = [
  {
    id: 1,
    type: 'date',
    title: '第一次约会',
    date: '2025-06-15',
    location: '市中心咖啡馆',
    description: '初次见面，聊了整整一下午。从兴趣爱好聊到人生理想，时间过得特别快。',
    imageUrl: '',
  },
  {
    id: 2,
    type: 'travel',
    title: '厦门之旅',
    date: '2025-08-20',
    location: '厦门鼓浪屿',
    description: '一起在海边散步，看日落。傍晚在环岛路骑自行车，海风吹来特别舒服。',
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab2?w=600',
  },
  {
    id: 3,
    type: 'gift',
    title: '生日惊喜',
    date: '2026-03-10',
    location: '',
    description: '偷偷准备了三个月的礼物，看到你惊喜的表情，一切都值了。',
    imageUrl: '',
  },
  {
    id: 4,
    type: 'movie',
    title: '一起看《你的名字》',
    date: '2025-12-05',
    location: '万达影城',
    description: '重温经典，你还是看到结尾就哭了。递纸巾的时候突然觉得特别幸福。',
    imageUrl: '',
  },
  {
    id: 5,
    type: 'variety',
    title: '周末综艺时间',
    date: '2026-01-18',
    location: '家里',
    description: '一边看综艺一边吃炸鸡，笑到肚子痛。这是我们最日常也最快乐的时光。',
    imageUrl: '',
  },
  {
    id: 6,
    type: 'other',
    title: '一起做饭',
    date: '2026-05-22',
    location: '公寓厨房',
    description: '第一次合作做红烧排骨，虽然盐放多了，但你说是吃过最好吃的。',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
  },
];

function App() {
  const handleAddClick = () => {
    alert('即将上线');
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">💝</span>
        <span className="app-title">Our Moments</span>
        <span className="app-nav">我们的故事</span>
      </header>
      <MemoryList memories={mockData} />
      <button className="fab" onClick={handleAddClick} title="添加回忆">+</button>
    </div>
  );
}

export default App;
