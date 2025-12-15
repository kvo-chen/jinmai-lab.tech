import dotenv from 'dotenv';
import { Pool } from 'pg';

// 加载环境变量
dotenv.config();

try {
  console.log('正在测试与Neon数据库的连接...');
  
  // 获取数据库连接URL
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL环境变量未配置');
  }
  
  console.log('使用的数据库URL:', DATABASE_URL);
  
  // 创建连接池
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1') ? {
      rejectUnauthorized: false
    } : false
  });
  
  // 测试连接
  console.log('正在尝试连接到数据库...');
  const client = await pool.connect();
  console.log('连接成功，正在执行测试查询...');
  
  // 执行简单查询
  const result = await client.query('SELECT 1 as test_result');
  console.log('测试查询结果:', result.rows[0]);
  
  // 执行更复杂的查询，检查表是否存在
  const tableCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    LIMIT 5
  `);
  console.log('数据库中存在的表:', tableCheck.rows.map(row => row.table_name));
  
  // 释放连接
  client.release();
  
  // 关闭连接池
  await pool.end();
  
  console.log('✅ Neon数据库连接测试成功！');
  
} catch (error) {
  console.error('❌ Neon数据库连接测试失败:', error.message);
  console.error('详细错误:', error);
  process.exit(1);
}