-- 实现自动更新updated_at字段的触发器

-- 创建通用的更新updated_at字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为users表创建触发器
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为works表创建触发器
CREATE TRIGGER update_works_updated_at
BEFORE UPDATE ON works
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为posts表创建触发器
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为comments表创建触发器
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为likes表创建触发器
CREATE TRIGGER update_likes_updated_at
BEFORE UPDATE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为cultural_knowledge表创建触发器
CREATE TRIGGER update_cultural_knowledge_updated_at
BEFORE UPDATE ON cultural_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
