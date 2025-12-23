import { Pool } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testConnection() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('错误: DATABASE_URL环境变量未配置');
      return;
    }
    
    console.log('正在测试数据库连接...');
    console.log('使用的DATABASE_URL:', DATABASE_URL);
    
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1') ? {
        rejectUnauthorized: false
      } : false
    });
    
    console.log('正在尝试连接...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');
    
    // 执行简单查询
    const result = await client.query('SELECT 1 as test_result');
    console.log('✅ 查询执行成功:', result.rows[0]);
    
    // 获取当前时间
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ 当前数据库时间:', timeResult.rows[0].current_time);
    
    // 获取所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ 数据库中的表:', tablesResult.rows.map(row => row.table_name));
    
    // 释放连接
    client.release();
    
    // 关闭连接池
    await pool.end();
    
    console.log('✅ 测试完成，连接已关闭');
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testConnection();