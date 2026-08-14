const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, bucket } = require('./s3');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const PORT = process.env.PORT || 3001;

// 图片上传：内存暂存 + 限 10MB + 只收图片
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只能上传图片文件'));
  },
});

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
          include: { user: { select: { username: true } } },
        },
      },
    });
    // 数据库使用 snake_case，映射回前端 camelCase；user 联表带出帖子/评论的作者
    res.json(
      memories.map(({ image_url, created_at, user, comments, ...rest }) => ({
        ...rest,
        imageUrl: image_url,
        createdAt: created_at,
        author: user?.username ?? null,
        comments: (comments || []).map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          author: c.user?.username ?? null, // 这条评论是谁发的
        })),
      }))
    );
  } catch (err) {
    console.error('查询 memories 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建一条 memory（需登录），user_id 取当前登录用户
// body: { type, title, date, location?, description?, imageUrl? }
app.post('/api/memories', requireAuth, async (req, res) => {
  try {
    const { type, title, date, location, description, imageUrl } = req.body || {};

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
        user_id: req.user.userId,
      },
      include: { user: { select: { username: true } } },
    });

    // 与 GET 一致的字段映射：snake_case → camelCase，并带上 author
    const { image_url, created_at, user, ...rest } = memory;
    res.status(201).json({
      ...rest,
      imageUrl: image_url,
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
app.put('/api/memories/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const existing = await prisma.memory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const { type, title, date, location, description, imageUrl } = req.body || {};
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
      },
      include: { user: { select: { username: true } } },
    });

    // 与 GET / POST 一致的字段映射
    const { image_url, created_at, user, ...rest } = memory;
    res.json({
      ...rest,
      imageUrl: image_url,
      createdAt: created_at,
      author: user?.username ?? null,
    });
  } catch (err) {
    console.error('更新 memory 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除一条 memory（需登录；权限已开放，任何登录用户都可删）
app.delete('/api/memories/:id', requireAuth, async (req, res) => {
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

// 创建一条评论（需登录），body: { content }
app.post('/api/memories/:id/comments', requireAuth, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id, 10);
    if (isNaN(memoryId)) {
      return res.status(400).json({ error: '无效的 id' });
    }

    const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
    if (!memory) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        memory_id: memoryId,
        user_id: req.user.userId,
      },
      include: { user: { select: { username: true } } },
    });

    res.status(201).json({
      id: comment.id,
      content: comment.content,
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
app.put('/api/comments/:id', requireAuth, async (req, res) => {
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
app.delete('/api/comments/:id', requireAuth, async (req, res) => {
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

// ===== 图片上传（中国科技云数据胶囊 S3） =====

// 上传图片（需登录）：multipart 表单里 field 名为 image，返回可在前端直接用的 imageUrl
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  if (!bucket) {
    return res.status(500).json({ error: '服务端未配置数据胶囊（CSTCLOUD_BUCKET 等环境变量）' });
  }
  if (!req.file) {
    return res.status(400).json({ error: '未收到图片文件（字段名应为 image）' });
  }
  try {
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const key = `memories/${uuidv4()}${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    // 返回相对路径，前端用 resolveImageUrl 拼上 API 域名后当 <img src>
    res.status(201).json({ key, imageUrl: `/api/images/${key}` });
  } catch (err) {
    console.error('上传到数据胶囊失败:', err);
    res.status(500).json({ error: '图片上传失败，请检查数据胶囊配置或稍后再试' });
  }
});

// 图片代理：从数据胶囊取回图片并流式返回。
// 注意：不走 requireAuth —— <img> 标签无法带 Authorization 头，而 key 是随机 UUID，近似"不可猜的私密链接"。
app.get('/api/images/:key(*)', async (req, res) => {
  const key = req.params.key;
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 图片基本不变，缓存一年
    obj.Body.pipe(res);
    // 客户端中断时结束流的错误处理，避免进程报 unhandled error
    obj.Body.on('error', (err) => {
      console.error('流式读取图片失败:', err.message);
      if (!res.headersSent) res.status(500).json({ error: '图片读取失败' });
      else res.end();
    });
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode || err?.name;
    if (status === 404 || err.name === 'NoSuchKey' || err.name === 'NotFound') {
      return res.status(404).json({ error: '图片不存在' });
    }
    console.error('读取图片失败:', err);
    res.status(500).json({ error: '图片读取失败' });
  }
});

// multer 上传错误统一转成 JSON（文件太大 / 非图片类型）
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? '图片不能超过 10MB' : `上传失败：${err.message}`;
    return res.status(400).json({ error: msg });
  }
  if (err && err.message === '只能上传图片文件') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
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
    tokenStore.set(token, { userId: user.id, username: user.username });
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
  res.json({ username: user.username });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
