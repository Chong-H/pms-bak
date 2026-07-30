import mysql, { type Pool } from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306, // 建议转换为数字并提供默认端口
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
};

// 1. 扩展 TypeScript 的全局类型声明
declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}
// 单例模式：防止 Vercel / Next.js 热重载或实例复用时创建重复连接池


if (!global.mysqlPool) {
  global.mysqlPool = mysql.createPool(dbConfig);
}
const pool = global.mysqlPool;

export default pool;