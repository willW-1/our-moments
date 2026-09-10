/* ============================================================
   语言状态（模块级 store + useSyncExternalStore）
   - 不用 Context：api.js / formatTime.js 是普通模块，拿不到 hook，
     用 Context 的话还得再配一套模块级访问器，等于维护两套机制。
     这里一套 store 同时服务组件和普通模块。
   - 组件里 useT() 订阅语言变化；api.js / formatTime.js 直接用 t()。
   - 语言变化后能正确重渲染的前提是「凡是渲染文案的组件都调用了 useT()」。
     目前没有组件用 React.memo，但别依赖这个隐式前提。
   ============================================================ */

import { useSyncExternalStore } from 'react';
import { dict } from './dict';

export const LANG_STORAGE_KEY = 'our-moments-lang';
export const DEFAULT_LANG = 'zh';
const SUPPORTED = ['zh', 'en'];

function normalize(value) {
  return SUPPORTED.includes(value) ? value : DEFAULT_LANG;
}

// 模块加载时就读一次：保证任何模块（包括 api.js）import 时 t() 已是正确语言
let current = normalize(typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null);
const listeners = new Set();

function applyToDom(lang) {
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
}

// 在 React 挂载前调用，避免首屏语言属性不对（文案本身不存在闪烁：字典是同步打包进来的）
export function initLanguage() {
  applyToDom(current);
}

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  const next = normalize(lang);
  if (next === current) return;
  current = next;
  applyToDom(next);
  localStorage.setItem(LANG_STORAGE_KEY, next);
  listeners.forEach((notify) => notify());
}

export function toggleLanguage() {
  setLanguage(current === 'zh' ? 'en' : 'zh');
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function lookup(lang, path) {
  return path.split('.').reduce((node, key) => (node == null ? node : node[key]), dict[lang]);
}

/* 取文案：
   - 缺失时先退回中文，再退回键名本身（漏翻时不会渲染出空字符串或崩掉）
   - {name} / {count} 形式插值；没传对应参数时保留原样，便于开发时发现 */
export function t(path, params) {
  const raw = lookup(current, path) ?? lookup(DEFAULT_LANG, path) ?? path;
  if (typeof raw !== 'string') return path;
  return raw.replace(/\{\s*(\w+)\s*\}/g, (whole, key) =>
    params && key in params ? String(params[key]) : whole,
  );
}

/* 带单复数的取文案：优先取 `${path}_one` / `${path}_other`，
   取不到就退回 `${path}`（中文只有单数形式，只写基础键即可）。 */
export function tCount(path, count, params) {
  const plural = `${path}_${count === 1 ? 'one' : 'other'}`;
  const hasPlural = lookup(current, plural) != null || lookup(DEFAULT_LANG, plural) != null;
  return t(hasPlural ? plural : path, { count, ...params });
}

/* 回忆类型的显示标签：键是数据库里的中文值。
   查不到就原样返回该值（旧数据 / 已废弃类型不会被翻译成键名）。 */
export function typeLabel(type) {
  if (!type) return '';
  const hit = dict[current]?.memoryType?.[type] ?? dict[DEFAULT_LANG]?.memoryType?.[type];
  return hit || type;
}

/* 订阅语言；返回当前语言 */
export function useLanguage() {
  return useSyncExternalStore(subscribe, getLanguage);
}

/* 订阅语言并拿到 t —— 渲染文案的组件都应调用（哪怕只用 tCount / typeLabel） */
export function useT() {
  useLanguage();
  return t;
}
