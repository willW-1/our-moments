const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, bucket } = require('./s3');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Filebase 私有桶：<img> 不能匿名读，服务器给每个图片签发一个带签名、可直接在浏览器打开的 GET 直链。
// 图片仍直接从 Filebase CDN 加载（不经过 Render）。URL 按 key 缓存、7 天内保持不变：
// 如果每次请求都重新签名，URL 就会每次都变，浏览器缓存永远失效，用户每次登录都要重新下载全部图片。
const signedUrlCache = new Map(); // image_key -> { url, expiresAt }
const SIGNED_URL_TTL_SEC = 7 * 24 * 60 * 60;

async function signedImageUrl(key) {
  if (!key || !bucket) return null;
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: SIGNED_URL_TTL_SEC }
  );
  // 缓存 6 天，比 URL 有效期提前 1 天重建，避免浏览器缓存到即将过期的地址
  signedUrlCache.set(key, { url, expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000 });
  return url;
}

// 生成浏览器直传用的 presigned PUT URL（5 分钟有效）。签名覆盖 Content-Type，
// 所以客户端必须按返回的 contentType 原样发送该 header，否则签名校验不过。
function presignedPutUrl(key, contentType) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 5 * 60 }
  );
}

// 登录 token → 用户 的映射（内存版，进程重启即失效，后续可换 Redis / JWT）
const tokenStore = new Map();

// Prisma 7 使用 driver adapter 连接数据库
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// 认证中间件：校验 Authorization: Bearer <token>，无效则返回 401
// 通过后把当前登录用户挂到 req.user（{ userId, username }），供后续路由使用
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const user = token ? tokenStore.get(token) : undefined;
  if (!user) {
    return res.status(401).json({ error: '无效或过期的 token' });
  }
  req.user = user;
  next();
}

// 角色权限中间件：requireAuth 之后使用，限定只有指定角色能继续。
// user=使用者（可增删改所有内容）；viewer=旁观者（仅可在留言板留言/回复，其余只读）
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '没有权限执行此操作（旁观者账号仅可在留言板留言）' });
    }
    next();
  };
}

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// 查询所有 memories，按 date 降序返回（需登录）
app.get('/api/memories', requireAuth, async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      // 先按发生日期降序；发生日期相同则按发布时间降序
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
      include: {
        user: { select: { username: true } },
        comments: {
          orderBy: { created_at: 'asc' },
          include: {
            user: { select: { username: true } },
            replies: {
              orderBy: { created_at: 'asc' },
              include: { user: { select: { username: true } } },
            },
          },
        },
      },
    });
    // 数据库使用 snake_case，映射回前端 camelCase；user 联表带出帖子/评论的作者
    // 有 image_key（数据胶囊直传）的，实时生成 7 天签名 GET URL 供 <img> 直读；否则用存的 image_url
    const list = await Promise.all(
      memories.map(async ({ image_url, image_key, created_at, user, comments, ...rest }) => {
        const imageUrl = image_key ? await signedImageUrl(image_key) : image_url;
        return {
          ...rest,
          imageUrl,
          imageKey: image_key ?? null,
          createdAt: created_at,
          author: user?.username ?? null,
          // 只留顶层评论（parent_id 为空），并把回复嵌套进各自顶层评论下
          comments: (comments || [])
            .filter((c) => c.parent_id == null)
            .map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
              author: c.user?.username ?? null, // 这条评论是谁发的
              replies: (c.replies || []).map((r) => ({
                id: r.id,
                content: r.content,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                author: r.user?.username ?? null,
              })),
            })),
        };
      })
    );
    res.json(list);
  } catch (err) {
    console.error('查询 memories 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建一条 memory（需登录），user_id 取当前登录用户
// body: { type, title, date, location?, description?, imageUrl?, imageKey? }
app.post('/api/memories', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const { type, title, date, location, description, imageUrl, imageKey } = req.body || {};

    if (!type || !title || !date) {
      return res.status(400).json({ error: 'type、title、date 为必填字段' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date 格式无效' });
    }

    const memory = await prisma.memory.create({
      data: {
        type,
        title,
        date: parsedDate,
        location: location ?? null,
        description: description ?? null,
        image_url: imageUrl ?? null,
        image_key: imageKey ?? null,
        user_id: req.user.userId,
      },
      include: { user: { select: { username: true } } },
    });

    // 与 GET 一致的字段映射：snake_case → camelCase，并带上 author
    const { image_url, image_key, created_at, user, ...rest } = memory;
    res.status(201).json({
      ...rest,
      imageUrl: image_key ? await signedImageUrl(image_key) : image_url,
      imageKey: image_key ?? null,
      createdAt: created_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('创建 memory 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新一条 memory（需登录；权限已开放，任何登录用户都可改）
// body: { type, title, date, location?, description?, imageUrl? }
app.put('/api/memories/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const existing = await prisma.memory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const { type, title, date, location, description, imageUrl, imageKey } = req.body || {};
    if (!type || !title || !date) {
      return res.status(400).json({ error: 'type、title、date 为必填字段' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date 格式无效' });
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: {
        type,
        title,
        date: parsedDate,
        location: location ?? null,
        description: description ?? null,
        image_url: imageUrl ?? null,
        image_key: imageKey ?? null,
      },
      include: { user: { select: { username: true } } },
    });

    // 与 GET / POST 一致的字段映射
    const { image_url, image_key, created_at, user, ...rest } = memory;
    res.json({
      ...rest,
      imageUrl: image_key ? await signedImageUrl(image_key) : image_url,
      imageKey: image_key ?? null,
      createdAt: created_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('更新 memory 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除一条 memory（需登录；权限已开放，任何登录用户都可删）
app.delete('/api/memories/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const existing = await prisma.memory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    await prisma.memory.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('删除 memory 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 评论 =====

// 创建一条评论（需登录），body: { content, parentId? }
// parentId 为空 → 顶层评论；非空 → 对该评论的回复（回复挂到最顶层评论下，只做一层嵌套）
app.post('/api/memories/:id/comments', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id, 10);
    if (isNaN(memoryId)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
    if (!memory) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const { content, parentId } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    // 校验父评论存在且属于同一条回忆
    let parent_id = null;
    if (parentId != null && parentId !== '') {
      const pid = parseInt(parentId, 10);
      if (isNaN(pid)) {
        return res.status(400).json({ error: '无效的父评论 id' });
      }
      const parentComment = await prisma.comment.findUnique({ where: { id: pid } });
      if (!parentComment || parentComment.memory_id !== memoryId) {
        return res.status(400).json({ error: '父评论不存在或不属于该回忆' });
      }
      // 回复的回复收归到最顶层评论，保证只有一层嵌套
      parent_id = parentComment.parent_id ?? parentComment.id;
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        memory_id: memoryId,
        parent_id,
        user_id: req.user.userId,
      },
      include: { user: { select: { username: true } } },
    });

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      parentId: comment.parent_id ?? null,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.user?.username ?? null, // 这条评论是谁发的
    });
  } catch (err) {
    console.error('创建评论失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 编辑评论（需登录；权限已开放，任何登录用户都可改），body: { content }
app.put('/api/comments/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '评论不存在' });
    }

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: String(content).trim() },
      include: { user: { select: { username: true } } },
    });

    res.json({
      id: comment.id,
      content: comment.content,
      parentId: comment.parent_id ?? null,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.user?.username ?? null,
    });
  } catch (err) {
    console.error('编辑评论失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除评论（需登录；权限已开放，任何登录用户都可删）
app.delete('/api/comments/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '评论不存在' });
    }

    await prisma.comment.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('删除评论失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 倒计时 / 正计时（左侧栏） =====
// 目标日期在未来 → 前端显示「还有 N 天」；在过去 → 前端显示「已经 N 天」

// 查询全部倒计时，按目标日期升序（需登录）
app.get('/api/countdowns', requireAuth, async (req, res) => {
  try {
    const countdowns = await prisma.countdown.findMany({
      orderBy: { target_date: 'asc' },
      include: { user: { select: { username: true } } },
    });
    res.json(
      countdowns.map(({ target_date, created_at, updated_at, user, ...rest }) => ({
        ...rest,
        targetDate: target_date,
        createdAt: created_at,
        updatedAt: updated_at,
        author: user?.username ?? null,
      }))
    );
  } catch (err) {
    console.error('查询倒计时失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建一条倒计时（需登录），body: { name, targetDate }
app.post('/api/countdowns', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const { name, targetDate } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: '主题名不能为空' });
    }
    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: '目标日期无效' });
    }
    const countdown = await prisma.countdown.create({
      data: {
        name: String(name).trim(),
        target_date: parsedDate,
        user_id: req.user.userId,
      },
      include: { user: { select: { username: true } } },
    });
    const { target_date, created_at, updated_at, user, ...rest } = countdown;
    res.status(201).json({
      ...rest,
      targetDate: target_date,
      createdAt: created_at,
      updatedAt: updated_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('创建倒计时失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新一条倒计时（需登录），body: { name, targetDate }
app.put('/api/countdowns/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.countdown.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '记录不存在' });

    const { name, targetDate } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: '主题名不能为空' });
    }
    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: '目标日期无效' });
    }

    const countdown = await prisma.countdown.update({
      where: { id },
      data: { name: String(name).trim(), target_date: parsedDate },
      include: { user: { select: { username: true } } },
    });
    const { target_date, created_at, updated_at, user, ...rest } = countdown;
    res.json({
      ...rest,
      targetDate: target_date,
      createdAt: created_at,
      updatedAt: updated_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('更新倒计时失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除一条倒计时（需登录）
app.delete('/api/countdowns/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.countdown.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '记录不存在' });
    await prisma.countdown.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('删除倒计时失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 留言板（右侧栏） =====

// 查询全部留言，按发布时间倒序（最新在前，需登录），每条留言带回复列表
app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { username: true } },
        replies: {
          orderBy: { created_at: 'asc' },
          include: { user: { select: { username: true } } },
        },
      },
    });
    res.json(
      messages.map(({ created_at, updated_at, user, replies, ...rest }) => ({
        ...rest,
        createdAt: created_at,
        updatedAt: updated_at,
        author: user?.username ?? null,
        replies: (replies || []).map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          author: r.user?.username ?? null,
        })),
      }))
    );
  } catch (err) {
    console.error('查询留言失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建一条留言（需登录），body: { content }
app.post('/api/messages', requireAuth, async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '留言内容不能为空' });
    }
    const message = await prisma.message.create({
      data: { content: String(content).trim(), user_id: req.user.userId },
      include: { user: { select: { username: true } } },
    });
    const { created_at, updated_at, user, ...rest } = message;
    res.status(201).json({
      ...rest,
      createdAt: created_at,
      updatedAt: updated_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('创建留言失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新一条留言（需登录），body: { content }
app.put('/api/messages/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '留言不存在' });

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '留言内容不能为空' });
    }

    const message = await prisma.message.update({
      where: { id },
      data: { content: String(content).trim() },
      include: { user: { select: { username: true } } },
    });
    const { created_at, updated_at, user, ...rest } = message;
    res.json({
      ...rest,
      createdAt: created_at,
      updatedAt: updated_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('更新留言失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除一条留言（需登录）
app.delete('/api/messages/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '留言不存在' });
    await prisma.message.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('删除留言失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 留言板回复 =====

// 回复一条留言（需登录），body: { content }
app.post('/api/messages/:id/replies', requireAuth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) return res.status(400).json({ error: '无效的 id' });
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: '留言不存在' });

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '回复内容不能为空' });
    }

    const reply = await prisma.messageReply.create({
      data: { content: String(content).trim(), message_id: messageId, user_id: req.user.userId },
      include: { user: { select: { username: true } } },
    });
    res.status(201).json({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      author: reply.user?.username ?? null,
    });
  } catch (err) {
    console.error('创建留言回复失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 编辑一条留言回复（需登录），body: { content }
app.put('/api/message-replies/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.messageReply.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '回复不存在' });

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '回复内容不能为空' });
    }

    const reply = await prisma.messageReply.update({
      where: { id },
      data: { content: String(content).trim() },
      include: { user: { select: { username: true } } },
    });
    res.json({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      author: reply.user?.username ?? null,
    });
  } catch (err) {
    console.error('编辑留言回复失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除一条留言回复（需登录）
app.delete('/api/message-replies/:id', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的 id' });
    const existing = await prisma.messageReply.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '回复不存在' });
    await prisma.messageReply.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('删除留言回复失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 图片直传 + 签名直链（Filebase 私有桶） =====
//
// Filebase 是标准 S3（SigV4，无 UA 校验）。bucket 是私有的，方案：
//   1) 登录后向 /api/upload 要一个 presigned PUT URL（5 分钟有效）
//   2) 浏览器把文件直接 PUT 到 https://s3.filebase.io（直传，不经过 Render）
//   3) 读取时服务器给每个 image_key 签发 7 天有效的签名 GET URL（signedImageUrl），
//      URL 按 key 缓存、7 天内不变，浏览器能跨登录复用图片缓存，不必每次登录重下。

// 生成直传地址（需登录）：body: { contentType?, fileName? }
// 返回 { key, contentType, uploadUrl, getUrl } —— uploadUrl 用于浏览器直接 PUT，getUrl 是签名直链（预览用）
app.post('/api/upload', requireAuth, requireRole('user'), async (req, res) => {
  if (!bucket) {
    return res.status(500).json({ error: '服务端未配置对象存储（CSTCLOUD_BUCKET 等环境变量）' });
  }
  const { contentType = 'application/octet-stream', fileName } = req.body || {};
  const ext = (fileName && path.extname(fileName).toLowerCase()) || '';
  const key = `memories/${uuidv4()}${ext}`;
  try {
    const uploadUrl = await presignedPutUrl(key, contentType);
    const getUrl = await signedImageUrl(key);
    res.json({ key, contentType, uploadUrl, getUrl });
  } catch (err) {
    console.error('生成直传地址失败:', err);
    res.status(500).json({ error: '生成直传地址失败，请检查存储配置' });
  }
});

// 登录：Prisma 查用户 + bcrypt 验证密码，成功返回 token
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 库里存的必须是 bcrypt 哈希才能比较；防止明文/格式异常时抛错
    let valid = false;
    try {
      valid = bcrypt.compareSync(password, user.password);
    } catch {
      valid = false;
    }
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = uuidv4();
    tokenStore.set(token, { userId: user.id, username: user.username, role: user.role });
    res.json({ success: true, token });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 根据 Authorization: Bearer <token> 校验登录状态，返回当前用户
app.get('/api/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  const user = token ? tokenStore.get(token) : undefined;
  if (!user) {
    return res.status(401).json({ error: '无效或过期的 token' });
  }
  res.json({ username: user.username, role: user.role });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
