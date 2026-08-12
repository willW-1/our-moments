const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const PORT = process.env.PORT || 3001;

// 登录 token → 用户 的映射（内存版，进程重启即失效，后续可换 Redis / JWT）
const tokenStore = new Map();

// Prisma 7 使用 driver adapter 连接数据库
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// 查询所有 memories，按 date 降序返回
app.get('/api/memories', async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { username: true } } },
    });
    // 数据库使用 snake_case，映射回前端 camelCase；user 联表带出发帖人
    res.json(
      memories.map(({ image_url, created_at, user, ...rest }) => ({
        ...rest,
        imageUrl: image_url,
        createdAt: created_at,
        author: user?.username ?? null,
      }))
    );
  } catch (err) {
    console.error('查询 memories 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
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
