-- 实现点赞和评论计数触发器

-- 1. 点赞计数触发器

-- 创建更新作品点赞计数的函数
CREATE OR REPLACE FUNCTION update_work_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE works
    SET likes = likes + 1
    WHERE id = NEW.work_id AND NEW.work_id IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE works
    SET likes = GREATEST(likes - 1, 0)
    WHERE id = OLD.work_id AND OLD.work_id IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建更新帖子点赞计数的函数
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET likes = likes + 1
    WHERE id = NEW.post_id AND NEW.post_id IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET likes = GREATEST(likes - 1, 0)
    WHERE id = OLD.post_id AND OLD.post_id IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. 评论计数触发器

-- 创建更新作品评论计数的函数
CREATE OR REPLACE FUNCTION update_work_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE works
    SET comments = comments + 1
    WHERE id = NEW.work_id AND NEW.work_id IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE works
    SET comments = GREATEST(comments - 1, 0)
    WHERE id = OLD.work_id AND OLD.work_id IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建更新帖子评论计数的函数
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments = comments + 1
    WHERE id = NEW.post_id AND NEW.post_id IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments = GREATEST(comments - 1, 0)
    WHERE id = OLD.post_id AND OLD.post_id IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建触发器

-- 为likes表创建更新作品点赞计数的触发器
CREATE TRIGGER update_work_likes_after_like
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_work_like_count();

-- 为likes表创建更新帖子点赞计数的触发器
CREATE TRIGGER update_post_likes_after_like
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

-- 为comments表创建更新作品评论计数的触发器
CREATE TRIGGER update_work_comments_after_comment
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_work_comment_count();

-- 为comments表创建更新帖子评论计数的触发器
CREATE TRIGGER update_post_comments_after_comment
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();
