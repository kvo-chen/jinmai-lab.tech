// 使用ESM语法导入模块
import { initPostgreSQL, getPostgreSQL } from './server/postgres.mjs';

async function initTables() {
  try {
    console.log('正在初始化PostgreSQL表...');
    await initPostgreSQL();
    console.log('PostgreSQL表初始化成功');
    await getPostgreSQL().end();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('PostgreSQL表初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

initTables();