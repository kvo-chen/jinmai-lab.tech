-- 创建用户表
CREATE TABLE users (
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
);

-- 创建作品表
CREATE TABLE works (
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
);

-- 创建帖子表
CREATE TABLE posts (
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
);

-- 创建评论表
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建部分唯一索引，确保用户对同一作品或帖子只能点赞一次
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_work_like ON likes(user_id, work_id) WHERE work_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_post_like ON likes(user_id, post_id) WHERE post_id IS NOT NULL;

-- 创建文化知识表
CREATE TABLE cultural_knowledge (
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
);

-- 创建索引，提高查询性能
CREATE INDEX idx_works_creator_id ON works(creator_id);
CREATE INDEX idx_works_category ON works(category);
CREATE INDEX idx_works_featured ON works(featured);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_work_id ON comments(work_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_work_id ON likes(work_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_cultural_knowledge_category ON cultural_knowledge(category);
