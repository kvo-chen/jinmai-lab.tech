-- 优化索引策略，添加复合索引和全文搜索索引

-- 1. 复合索引添加

-- works表复合索引
CREATE INDEX IF NOT EXISTS idx_works_category_created_at ON works(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_featured_created_at ON works(featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_creator_id_created_at ON works(creator_id, created_at DESC);

-- posts表复合索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- comments表复合索引
CREATE INDEX IF NOT EXISTS idx_comments_work_id_created_at ON comments(work_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON comments(post_id, created_at DESC);

-- likes表复合索引
CREATE INDEX IF NOT EXISTS idx_likes_user_id_created_at ON likes(user_id, created_at DESC);

-- 2. 全文搜索索引

-- 为works表创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_works_search ON works USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- 为posts表创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));

-- 为cultural_knowledge表创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_search ON cultural_knowledge USING gin(to_tsvector('english', title || ' ' || content));

-- 3. 优化现有索引（调整顺序或添加新索引）

-- 为works表添加created_at索引，用于时间排序
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);

-- 为cultural_knowledge表添加created_at索引，用于时间排序
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_created_at ON cultural_knowledge(created_at DESC);

-- 为users表添加email和username索引，用于登录和查询
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
