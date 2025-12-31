-- 优化数据库架构，添加软删除和审计字段，完善约束

-- 1. 为所有表添加软删除字段和审计字段

-- 更新users表，添加deleted_at字段和CHECK约束
ALTER TABLE users 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator')),
  ALTER COLUMN role SET NOT NULL;

-- 更新works表，移除冗余字段，添加审计字段和约束
ALTER TABLE works 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT works_likes_check CHECK (likes >= 0),
  ADD CONSTRAINT works_comments_check CHECK (comments >= 0),
  ADD CONSTRAINT works_views_check CHECK (views >= 0),
  DROP COLUMN creator,
  DROP COLUMN creator_avatar;

-- 更新posts表，添加软删除和审计字段，完善约束
ALTER TABLE posts 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT posts_likes_check CHECK (likes >= 0),
  ADD CONSTRAINT posts_comments_check CHECK (comments >= 0),
  ADD CONSTRAINT posts_views_check CHECK (views >= 0);

-- 更新comments表，添加软删除和审计字段
ALTER TABLE comments 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 更新likes表，添加软删除和审计字段
ALTER TABLE likes 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 更新cultural_knowledge表，添加软删除和审计字段，完善约束
ALTER TABLE cultural_knowledge 
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT cultural_knowledge_likes_check CHECK (likes >= 0),
  ADD CONSTRAINT cultural_knowledge_views_check CHECK (views >= 0);

-- 2. 确保所有时间戳字段使用带时区的格式

ALTER TABLE users 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN last_login TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE works 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE posts 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE comments 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE likes 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE cultural_knowledge 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- 3. 优化likes表的约束，确保每个用户只能对同一作品或帖子点赞一次
ALTER TABLE likes 
  ADD CONSTRAINT likes_work_unique UNIQUE (user_id, work_id) WHERE work_id IS NOT NULL,
  ADD CONSTRAINT likes_post_unique UNIQUE (user_id, post_id) WHERE post_id IS NOT NULL;

-- 4. 为works表添加外键约束，确保creator_id引用有效用户
ALTER TABLE works 
  ALTER COLUMN creator_id SET NOT NULL;

-- 5. 为posts表添加外键约束，确保user_id引用有效用户
ALTER TABLE posts 
  ALTER COLUMN user_id SET NOT NULL;

-- 6. 为comments表添加外键约束，确保user_id引用有效用户
ALTER TABLE comments 
  ALTER COLUMN user_id SET NOT NULL;

-- 7. 为likes表添加外键约束，确保user_id引用有效用户
ALTER TABLE likes 
  ALTER COLUMN user_id SET NOT NULL;
