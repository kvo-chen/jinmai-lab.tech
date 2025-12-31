-- 实现Row Level Security (RLS)策略

-- 1. 启用RLS

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_knowledge ENABLE ROW LEVEL SECURITY;

-- 2. RLS策略实现

-- 2.1 users表RLS策略

-- 允许用户查看自己的信息，管理员查看所有用户
CREATE POLICY users_select_policy ON users
FOR SELECT
USING (
  (auth.uid() = id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 允许用户更新自己的信息，管理员更新所有用户
CREATE POLICY users_update_policy ON users
FOR UPDATE
USING (
  (auth.uid() = id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 2.2 works表RLS策略

-- 允许所有用户查看非删除作品
CREATE POLICY works_select_policy ON works
FOR SELECT
USING (deleted_at IS NULL);

-- 允许创建者更新和删除自己的作品，管理员更新所有作品
CREATE POLICY works_update_policy ON works
FOR UPDATE
USING (
  (auth.uid() = creator_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 允许创建者和管理员删除作品（软删除）
CREATE POLICY works_delete_policy ON works
FOR UPDATE OF deleted_at
USING (
  (auth.uid() = creator_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 2.3 posts表RLS策略

-- 允许所有用户查看非删除帖子
CREATE POLICY posts_select_policy ON posts
FOR SELECT
USING (deleted_at IS NULL);

-- 允许创建者更新和删除自己的帖子，管理员更新所有帖子
CREATE POLICY posts_update_policy ON posts
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 允许创建者和管理员删除帖子（软删除）
CREATE POLICY posts_delete_policy ON posts
FOR UPDATE OF deleted_at
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 2.4 comments表RLS策略

-- 允许所有用户查看非删除评论
CREATE POLICY comments_select_policy ON comments
FOR SELECT
USING (deleted_at IS NULL);

-- 允许评论者更新和删除自己的评论，管理员更新所有评论
CREATE POLICY comments_update_policy ON comments
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 允许评论者、作品/帖子创建者和管理员删除评论（软删除）
CREATE POLICY comments_delete_policy ON comments
FOR UPDATE OF deleted_at
USING (
  (auth.uid() = user_id) OR 
  (work_id IS NOT NULL AND EXISTS (SELECT 1 FROM works WHERE id = work_id AND creator_id = auth.uid())) OR
  (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 2.5 likes表RLS策略

-- 允许用户查看自己的点赞，管理员查看所有点赞
CREATE POLICY likes_select_policy ON likes
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- 允许用户创建和删除自己的点赞
CREATE POLICY likes_insert_policy ON likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY likes_delete_policy ON likes
FOR DELETE
USING (
  auth.uid() = user_id
);

-- 2.6 cultural_knowledge表RLS策略

-- 允许所有用户查看非删除记录
CREATE POLICY cultural_knowledge_select_policy ON cultural_knowledge
FOR SELECT
USING (deleted_at IS NULL);

-- 允许管理员管理所有记录
CREATE POLICY cultural_knowledge_update_policy ON cultural_knowledge
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY cultural_knowledge_delete_policy ON cultural_knowledge
FOR UPDATE OF deleted_at
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
