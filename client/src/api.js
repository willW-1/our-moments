// 后端 API 地址：
//  - 本地开发（vite dev）：走 vite 代理到 localhost:3001
//  - 生产构建：默认 Render，可用 VITE_API_URL 覆盖（构建时注入）
export const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://our-moments-a8no.onrender.com');

// 登录：成功返回 { success, token }，失败抛错（err.status 为 HTTP 状态码）
export async function login(username, password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('网络异常');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// 用 token 校验登录状态，成功返回 { username }
export async function fetchMe(token) {
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('token 无效');
  return res.json();
}

// 获取 memories 列表（需登录，携带 token）
export async function fetchMemories(token) {
  const res = await fetch(`${API_BASE}/api/memories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 创建一条 memory（需登录），成功返回新建的 memory
export async function createMemory(token, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

// 更新一条 memory（需登录，仅作者），成功返回更新后的 memory
export async function updateMemory(token, id, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/memories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

// 删除一条 memory（需登录），成功返回 { success }
export async function deleteMemory(token, id) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/memories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

// 创建评论（需登录），成功返回新建的评论
export async function createComment(token, memoryId, content) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/memories/${memoryId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

// 编辑评论（需登录），成功返回更新后的评论
export async function updateComment(token, commentId, content) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

// 上传图片（需登录）：向后端申请直传签名 URL，浏览器直接把文件 PUT 到数据胶囊（不经过 Render）。
// 返回 { key, getUrl } —— key 存库用于后续生成直读链接，getUrl 用于立即预览
export async function uploadImage(token, file) {
  const contentType = file.type || 'application/octet-stream';
  // 1) 向后端申请 PUT 签名 URL（签名时锁定了 Content-Type，PUT 时必须一致）
  let res;
  try {
    res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filename: file.name || 'image.jpg', contentType }),
    });
  } catch {
    throw new Error('网络异常');
  }
  const ticket = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(ticket.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (!ticket.uploadUrl) {
    throw new Error('服务端未返回直传链接');
  }
  // 2) 浏览器直传数据胶囊（跨域，需数据胶囊 S3 开启 CORS）
  let put;
  try {
    put = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
  } catch {
    const err = new Error('直传失败：请确认数据胶囊 S3 已开启跨域（CORS）');
    err.status = 0;
    throw err;
  }
  if (!put.ok) {
    const err = new Error(`直传失败（HTTP ${put.status}）：请检查数据胶囊配置`);
    err.status = put.status;
    throw err;
  }
  return { key: ticket.key, getUrl: ticket.getUrl };
}

// 后端返回的图片地址可能是相对路径（/api/images/...），生产环境需拼上 API 域名
export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('/')) return API_BASE + url;
  return url;
}

// 删除评论（需登录），成功返回 { success }
export async function deleteComment(token, commentId) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('网络异常');
  }
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}
