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
// parentId 传入 → 对该评论的回复（回复挂在最顶层评论下，只做一层嵌套）
export async function createComment(token, memoryId, content, parentId) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/memories/${memoryId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        ...(parentId ? { parentId } : {}),
      }),
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

// 上传图片（需登录）：先从服务器拿 presigned PUT 地址，再由浏览器把文件直接 PUT 到 Filebase。
// 返回 { key, getUrl } —— key 存库用于生成直链，getUrl（公开桶直链）用于立即预览
export async function uploadImage(token, file) {
  const contentType = file.type || 'application/octet-stream';

  // 1) 登录用户向服务器要一个直传地址
  let res;
  try {
    res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contentType, fileName: file.name }),
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

  // 2) 浏览器直接把文件 PUT 到 Filebase（签名覆盖 Content-Type，必须按服务器返回的 contentType 原样发）
  try {
    const put = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': data.contentType || contentType },
      body: file,
    });
    if (!put.ok) throw new Error(`直传失败 HTTP ${put.status}`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('直传失败')) throw err;
    throw new Error('网络异常');
  }

  return { key: data.key, getUrl: data.getUrl };
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

// ===== 倒计时（左侧栏） =====

// 获取倒计时列表（需登录），返回 [{ id, name, targetDate, author, createdAt, updatedAt }]
export async function fetchCountdowns(token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/countdowns`, {
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

export async function createCountdown(token, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/countdowns`, {
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

export async function updateCountdown(token, id, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/countdowns/${id}`, {
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

export async function deleteCountdown(token, id) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/countdowns/${id}`, {
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

// ===== 留言板（右侧栏） =====

// 获取留言列表（需登录），返回 [{ id, content, author, createdAt, updatedAt }]
export async function fetchMessages(token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/messages`, {
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

export async function createMessage(token, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/messages`, {
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

export async function updateMessage(token, id, data) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/messages/${id}`, {
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

export async function deleteMessage(token, id) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/messages/${id}`, {
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

// ===== 留言板回复 =====

// 回复一条留言（需登录），成功返回新建的回复
export async function createMessageReply(token, messageId, content) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/messages/${messageId}/replies`, {
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

// 编辑一条留言回复（需登录），成功返回更新后的回复
export async function updateMessageReply(token, replyId, content) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/message-replies/${replyId}`, {
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

// 删除一条留言回复（需登录），成功返回 { success }
export async function deleteMessageReply(token, replyId) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/message-replies/${replyId}`, {
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
