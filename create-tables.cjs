// 使用Supabase服务角色密钥创建数据库表的脚本
// 运行方法：node create-tables.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证配置
if (!supabaseUrl || !serviceRoleKey) {
  console.error('请确保.env.local文件中包含VITE_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY环境变量');
  process.exit(1);
}

// 创建Supabase服务端客户端（使用服务角色密钥）
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

// 使用服务角色密钥直接连接到PostgreSQL数据库
const { Client } = require('pg');

// 从连接字符串解析数据库配置
// 注意：需要将PostgreSQL连接字符串添加到环境变量中
// 示例：DATABASE_URL=postgresql://postgres:password@hostname:5432/database

// 或者使用Supabase的连接信息手动构建
const pgClient = new Client({
  connectionString: supabaseUrl.replace('https://', 'postgresql://'),
  password: serviceRoleKey,
  user: 'postgres', // 默认Supabase用户名
  database: 'postgres', // 默认Supabase数据库名
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// 直接使用pg客户端执行SQL语句的函数
async function executeSQLWithPg(sql) {
  try {
    await pgClient.connect();
    await pgClient.query(sql);
    console.log(`执行SQL成功: ${sql.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error(`执行SQL失败: ${sql}`);
    console.error(error.message);
    return false;
  } finally {
    await pgClient.end();
  }
}

// 定义创建表的SQL语句
const createTablesSQL = [
  // 创建用户表
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE
  );`,

  // 创建作品表
  `CREATE TABLE IF NOT EXISTS works (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator VARCHAR(255) NOT NULL,
    creator_avatar VARCHAR(255),
    thumbnail VARCHAR(255) NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    description TEXT,
    video_url VARCHAR(255),
    duration VARCHAR(20),
    image_tag VARCHAR(100),
    model_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 创建帖子表
  `CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 创建评论表
  `CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 创建点赞表
  `CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, work_id) WHERE work_id IS NOT NULL,
    UNIQUE(user_id, post_id) WHERE post_id IS NOT NULL
  );`,

  // 创建文化知识表
  `CREATE TABLE IF NOT EXISTS cultural_knowledge (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    image_url VARCHAR(255),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 创建索引
  `CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);`,
  `CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);`,
  `CREATE INDEX IF NOT EXISTS idx_works_featured ON works(featured);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments(work_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);`,
  `CREATE INDEX IF NOT EXISTS idx_likes_work_id ON likes(work_id);`,
  `CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);`,
  `CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_category ON cultural_knowledge(category);`
];

// 主函数
async function main() {
  console.log('开始创建数据库表...');
  
  // 安装pg依赖（如果尚未安装）
  try {
    require('pg');
  } catch (error) {
    console.log('pg依赖未安装，正在安装...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('pg依赖安装成功');
  }
  
  // 重新导入pg客户端（确保安装后能正确导入）
  const { Client } = require('pg');
  
  // 创建新的pg客户端实例
  const pgClient = new Client({
    connectionString: supabaseUrl.replace('https://', 'postgresql://'),
    password: serviceRoleKey,
    user: 'postgres',
    database: 'postgres',
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  // 执行所有SQL语句
  for (const sql of createTablesSQL) {
    try {
      await pgClient.connect();
      await pgClient.query(sql);
      console.log(`执行SQL成功: ${sql.substring(0, 100)}...`);
      await pgClient.end();
    } catch (error) {
      console.error(`执行SQL失败: ${sql}`);
      console.error(`错误信息: ${error.message}`);
      await pgClient.end();
      
      // 提供备选方案
      console.log('\n建议使用以下方法创建表：');
      console.log('1. 在Supabase控制台的SQL编辑器中执行database-schema.sql文件');
      console.log('2. 手动复制以下SQL语句到Supabase SQL编辑器：');
      console.log('\n' + createTablesSQL.join('\n\n'));
      
      process.exit(1);
    }
  }
  
  console.log('\n所有表创建成功！');
}

// 运行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
  process.exit(1);
});
