const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const PORT = process.env.PORT || 3001;

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
    });
    // 数据库使用 snake_case，映射回前端 camelCase
    res.json(
      memories.map(({ image_url, created_at, ...rest }) => ({
        ...rest,
        imageUrl: image_url,
        createdAt: created_at,
      }))
    );
  } catch (err) {
    console.error('查询 memories 失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
