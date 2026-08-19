import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './themes.css';

// 日夜主题：luxe=星河暗夜（默认），luxe-day=星河白昼。
// 读取 localStorage 在 React 挂载前设置，避免首屏闪白 / 闪错主题。
// 仅接受 luxe / luxe-day 两个合法值，其余旧值一律回退到 luxe。
const saved = localStorage.getItem('our-moments-theme');
const theme = saved === 'luxe-day' ? 'luxe-day' : 'luxe';
document.documentElement.setAttribute('data-theme', theme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
