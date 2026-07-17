import { useState, useEffect } from 'react';

function App() {
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setServerMessage(data.message))
      .catch((err) => console.error('请求失败:', err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'sans-serif' }}>
      <h1>纪念空间</h1>
      {serverMessage && <p style={{ color: '#666', fontSize: '18px' }}>{serverMessage}</p>}
    </div>
  );
}

export default App;
