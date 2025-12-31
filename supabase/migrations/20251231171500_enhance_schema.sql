-- 继续完善数据库架构，添加视图、存储过程、函数和更细粒度的RLS策略

-- 1. 视图创建

-- 创建作品详情视图，包含创建者信息
CREATE OR REPLACE VIEW works_with_creator AS
SELECT 
  w.*,
  u.username AS creator_username,
  u.avatar_url AS creator_avatar
FROM works w
JOIN users u ON w.creator_id = u.id
WHERE w.deleted_at IS NULL AND u.deleted_at IS NULL;

-- 创建帖子详情视图，包含创建者信息
CREATE OR REPLACE VIEW posts_with_creator AS
SELECT 
  p.*,
  u.username AS creator_username,
  u.avatar_url AS creator_avatar
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.deleted_at IS NULL AND u.deleted_at IS NULL;

-- 创建评论详情视图，包含评论者信息
CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
  c.*,
  u.username AS commenter_username,
  u.avatar_url AS commenter_avatar
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.deleted_at IS NULL AND u.deleted_at IS NULL;

-- 2. 存储过程创建

-- 创建存储过程：获取用户活动统计
CREATE OR REPLACE FUNCTION get_user_activity_stats(user_id UUID)
RETURNS TABLE(
  total_works INTEGER,
  total_posts INTEGER,
  total_comments INTEGER,
  total_likes_given INTEGER,
  total_likes_received INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM works WHERE creator_id = user_id AND deleted_at IS NULL) AS total_works,
    (SELECT COUNT(*) FROM posts WHERE user_id = user_id AND deleted_at IS NULL) AS total_posts,
    (SELECT COUNT(*) FROM comments WHERE user_id = user_id AND deleted_at IS NULL) AS total_comments,
    (SELECT COUNT(*) FROM likes WHERE user_id = user_id AND deleted_at IS NULL) AS total_likes_given,
    (SELECT COUNT(*) FROM likes l JOIN works w ON l.work_id = w.id WHERE w.creator_id = user_id AND l.deleted_at IS NULL AND w.deleted_at IS NULL)
      + (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = user_id AND l.deleted_at IS NULL AND p.deleted_at IS NULL) AS total_likes_received;
END;
$$ LANGUAGE plpgsql;

-- 创建存储过程：获取热门作品
CREATE OR REPLACE FUNCTION get_trending_works(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR(255),
  thumbnail VARCHAR(255),
  likes INTEGER,
  comments INTEGER,
  views INTEGER,
  category VARCHAR(100),
  featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  creator_username VARCHAR(255),
  creator_avatar VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.thumbnail,
    w.likes,
    w.comments,
    w.views,
    w.category,
    w.featured,
    w.created_at,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar
  FROM works w
  JOIN users u ON w.creator_id = u.id
  WHERE w.deleted_at IS NULL AND u.deleted_at IS NULL
  ORDER BY (w.likes * 3 + w.comments * 2 + w.views) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 3. 函数创建

-- 创建函数：搜索作品
CREATE OR REPLACE FUNCTION search_works(query TEXT)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR(255),
  thumbnail VARCHAR(255),
  likes INTEGER,
  comments INTEGER,
  views INTEGER,
  category VARCHAR(100),
  featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  creator_username VARCHAR(255),
  creator_avatar VARCHAR(255),
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.thumbnail,
    w.likes,
    w.comments,
    w.views,
    w.category,
    w.featured,
    w.created_at,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar,
    similarity(w.title || ' ' || coalesce(w.description, ''), query) AS similarity
  FROM works w
  JOIN users u ON w.creator_id = u.id
  WHERE w.deleted_at IS NULL AND u.deleted_at IS NULL
    AND to_tsvector('english', w.title || ' ' || coalesce(w.description, '')) @@ plainto_tsquery('english', query)
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：搜索帖子
CREATE OR REPLACE FUNCTION search_posts(query TEXT)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR(255),
  content TEXT,
  likes INTEGER,
  comments INTEGER,
  views INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  creator_username VARCHAR(255),
  creator_avatar VARCHAR(255),
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.likes,
    p.comments,
    p.views,
    p.created_at,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar,
    similarity(p.title || ' ' || p.content, query) AS similarity
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.deleted_at IS NULL AND u.deleted_at IS NULL
    AND to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', query)
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. 更细粒度的RLS策略

-- 为视图添加RLS策略
ALTER TABLE works_with_creator ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_with_creator ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments_with_user ENABLE ROW LEVEL SECURITY;

-- 为works_with_creator视图添加RLS策略
CREATE POLICY works_with_creator_select_policy ON works_with_creator
FOR SELECT
USING (TRUE); -- 允许所有用户查看

-- 为posts_with_creator视图添加RLS策略
CREATE POLICY posts_with_creator_select_policy ON posts_with_creator
FOR SELECT
USING (TRUE); -- 允许所有用户查看

-- 为comments_with_user视图添加RLS策略
CREATE POLICY comments_with_user_select_policy ON comments_with_user
FOR SELECT
USING (TRUE); -- 允许所有用户查看

-- 5. 添加基于标签的索引

-- 为works表添加标签索引
CREATE INDEX IF NOT EXISTS idx_works_tags ON works USING gin(tags);

-- 为posts表添加标签索引
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING gin(tags);

-- 为cultural_knowledge表添加标签索引
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_tags ON cultural_knowledge USING gin(tags);

-- 6. 添加登录日志表

CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP WITH TIME ZONE,
  is_successful BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- 为登录日志表添加索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time DESC);

-- 7. 添加用户活动日志表

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- work_created, post_created, comment_created, like_given, etc.
  activity_data JSONB, -- 存储活动相关数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为用户活动日志表添加索引
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- 8. 添加触发器记录用户活动

-- 创建记录用户活动的函数
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
    VALUES (
      NEW.user_id,
      TG_TABLE_NAME || '_created',
      row_to_json(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
    VALUES (
      NEW.user_id,
      TG_TABLE_NAME || '_updated',
      json_build_object(
        'old_data', row_to_json(OLD),
        'new_data', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为works表添加活动日志触发器
CREATE TRIGGER log_work_activity
AFTER INSERT OR UPDATE ON works
FOR EACH ROW
EXECUTE FUNCTION log_user_activity();

-- 为posts表添加活动日志触发器
CREATE TRIGGER log_post_activity
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION log_user_activity();

-- 为comments表添加活动日志触发器
CREATE TRIGGER log_comment_activity
AFTER INSERT OR UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION log_user_activity();

-- 9. 添加更多数据完整性约束

-- 为users表添加邮箱格式约束
ALTER TABLE users
ADD CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 为works表添加标题长度约束
ALTER TABLE works
ADD CONSTRAINT works_title_length CHECK (char_length(title) BETWEEN 1 AND 255);

-- 为posts表添加标题长度约束
ALTER TABLE posts
ADD CONSTRAINT posts_title_length CHECK (char_length(title) BETWEEN 1 AND 255);

-- 为comments表添加内容长度约束
ALTER TABLE comments
ADD CONSTRAINT comments_content_length CHECK (char_length(content) BETWEEN 1 AND 1000);

-- 10. 添加外键约束的级联更新选项

-- 更新外键约束，添加级联更新选项
ALTER TABLE works
DROP CONSTRAINT IF EXISTS works_creator_id_fkey,
ADD CONSTRAINT works_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey,
ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE likes
DROP CONSTRAINT IF EXISTS likes_user_id_fkey,
ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. 添加函数：获取用户推荐作品
CREATE OR REPLACE FUNCTION get_recommended_works(user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR(255),
  thumbnail VARCHAR(255),
  likes INTEGER,
  comments INTEGER,
  views INTEGER,
  category VARCHAR(100),
  featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  creator_username VARCHAR(255),
  creator_avatar VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.thumbnail,
    w.likes,
    w.comments,
    w.views,
    w.category,
    w.featured,
    w.created_at,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar
  FROM works w
  JOIN users u ON w.creator_id = u.id
  WHERE w.deleted_at IS NULL AND u.deleted_at IS NULL
  AND w.creator_id != user_id
  -- 简单推荐算法：基于用户之前喜欢的作品分类
  AND w.category IN (
    SELECT DISTINCT w2.category
    FROM works w2
    JOIN likes l ON w2.id = l.work_id
    WHERE l.user_id = user_id AND l.deleted_at IS NULL AND w2.deleted_at IS NULL
  )
  ORDER BY w.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 12. 添加函数：获取最近活动
CREATE OR REPLACE FUNCTION get_recent_activity(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  activity_type VARCHAR(50),
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  username VARCHAR(255),
  avatar_url VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.activity_type,
    ual.activity_data,
    ual.created_at,
    u.username,
    u.avatar_url
  FROM user_activity_logs ual
  JOIN users u ON ual.user_id = u.id
  WHERE u.deleted_at IS NULL
  ORDER BY ual.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
