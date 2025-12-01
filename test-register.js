import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 测试PostgreSQL连接和用户注册逻辑
async function testRegister() {
  try {
    console.log('开始测试PostgreSQL连接...');
    
    // 连接到PostgreSQL
    const connectionString = process.env.DATABASE_URL || process.env.NEON_URL || 'postgresql://localhost:5432/jinmai_lab';
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    
    const pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : {
        rejectUnauthorized: false
      }
    });
    
    // 测试连接
    const client = await pool.connect();
    console.log('PostgreSQL连接成功!');
    
    // 创建用户表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    console.log('用户表创建/检查成功!');
    
    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
    console.log('索引创建/检查成功!');
    
    // 测试用户注册逻辑
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'Test123456';
    
    console.log(`\n测试用户注册: username=${username}, email=${email}`);
    
    // 检查用户名是否已存在
    const existingUserByUsername = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUserByUsername.rows.length > 0) {
      console.log('用户名已存在，跳过注册');
    } else {
      // 检查邮箱是否已存在
      const existingUserByEmail = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUserByEmail.rows.length > 0) {
        console.log('邮箱已存在，跳过注册');
      } else {
        // 哈希密码
        const saltRounds = 10;
        const passwordHash = await bcryptjs.hash(password, saltRounds);
        console.log('密码哈希成功!');
        
        // 创建用户
        const now = Date.now();
        const result = await client.query(
          'INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [username, email, passwordHash, now, now]
        );
        
        const userId = result.rows[0].id;
        console.log(`用户注册成功! 用户ID: ${userId}`);
      }
    }
    
    // 测试用户查询
    const userResult = await client.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length > 0) {
      console.log('\n用户查询成功! 用户信息:');
      console.log(userResult.rows[0]);
    }
    
    // 关闭连接
    client.release();
    await pool.end();
    console.log('\n测试完成，连接已关闭!');
    
    return true;
  } catch (error) {
    console.error('测试失败:', error);
    return false;
  }
}

// 运行测试
testRegister();
