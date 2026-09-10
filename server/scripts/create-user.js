/**
 * 创建 / 更新账号（bcrypt 哈希后写入 users 表）
 *
 * 用法：
 *   node scripts/create-user.js <用户名> <密码> [角色]
 *   角色：user（默认，使用者）/ viewer（旁观者，只读 + 仅可留言）
 *
 * 例：node scripts/create-user.js test 1234 viewer
 *
 * 说明：直接连 server/.env 里的 DATABASE_URL（生产库），已存在同名账号则重置其密码与角色。
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const [, , username, password, role = 'user'] = process.argv;

if (!username || !password) {
  console.error('用法：node scripts/create-user.js <用户名> <密码> [user|viewer]');
  process.exit(1);
}
if (!['user', 'viewer'].includes(role)) {
  console.error(`角色只能是 user 或 viewer，收到：${role}`);
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
  const hash = bcrypt.hashSync(password, 10);
  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hash, role },
    create: { username, password: hash, role },
    select: { id: true, username: true, role: true },
  });
  console.log(`已就绪：id=${user.id} 用户名=${user.username} 角色=${user.role}`);
})()
  .catch((err) => {
    console.error('写入失败：', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
