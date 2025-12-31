-- 添加高级功能：数据归档、分区表、高级推荐算法、数据同步和备份恢复策略

-- 1. 数据归档策略

-- 创建归档表：归档超过1年的作品
CREATE TABLE IF NOT EXISTS works_archive (
  LIKE works INCLUDING ALL
);

-- 创建归档表：归档超过1年的帖子
CREATE TABLE IF NOT EXISTS posts_archive (
  LIKE posts INCLUDING ALL
);

-- 创建归档表：归档超过1年的评论
CREATE TABLE IF NOT EXISTS comments_archive (
  LIKE comments INCLUDING ALL
);

-- 创建归档表：归档超过3个月的点赞
CREATE TABLE IF NOT EXISTS likes_archive (
  LIKE likes INCLUDING ALL
);

-- 创建归档函数
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS VOID AS $$
BEGIN
  -- 归档超过1年的作品
  INSERT INTO works_archive
  SELECT * FROM works WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 删除已归档的作品
  DELETE FROM works WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 归档超过1年的帖子
  INSERT INTO posts_archive
  SELECT * FROM posts WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 删除已归档的帖子
  DELETE FROM posts WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 归档超过1年的评论
  INSERT INTO comments_archive
  SELECT * FROM comments WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 删除已归档的评论
  DELETE FROM comments WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
  
  -- 归档超过3个月的点赞
  INSERT INTO likes_archive
  SELECT * FROM likes WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '3 months' AND deleted_at IS NOT NULL;
  
  -- 删除已归档的点赞
  DELETE FROM likes WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '3 months' AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建定期归档的事件触发器（每月执行一次）
-- 注意：在Supabase中，需要在控制台设置定时任务

-- 2. 分区表实现（针对登录日志表，按月份分区）

-- 创建登录日志主表
CREATE TABLE IF NOT EXISTS login_logs_partitioned (
  LIKE login_logs INCLUDING ALL
) PARTITION BY RANGE (login_time);

-- 创建2025年12月的分区
CREATE TABLE IF NOT EXISTS login_logs_2025_12
PARTITION OF login_logs_partitioned
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 创建2026年1月的分区
CREATE TABLE IF NOT EXISTS login_logs_2026_01
PARTITION OF login_logs_partitioned
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- 创建2026年2月的分区
CREATE TABLE IF NOT EXISTS login_logs_2026_02
PARTITION OF login_logs_partitioned
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 创建2026年3月的分区
CREATE TABLE IF NOT EXISTS login_logs_2026_03
PARTITION OF login_logs_partitioned
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 为分区表添加索引
CREATE INDEX IF NOT EXISTS idx_login_logs_partitioned_user_id ON login_logs_partitioned(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_partitioned_login_time ON login_logs_partitioned(login_time DESC);

-- 3. 更复杂的推荐算法

-- 创建用户兴趣标签表
CREATE TABLE IF NOT EXISTS user_interest_tags (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  interest_score FLOAT DEFAULT 1.0, -- 兴趣分数，范围0-1
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tag)
);

-- 为用户兴趣标签表添加索引
CREATE INDEX IF NOT EXISTS idx_user_interest_tags_user_id ON user_interest_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interest_tags_tag ON user_interest_tags(tag);

-- 创建更新用户兴趣标签的函数
CREATE OR REPLACE FUNCTION update_user_interest_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- 当用户点赞作品时，更新用户兴趣标签
  IF TG_OP = 'INSERT' AND NEW.work_id IS NOT NULL THEN
    -- 获取作品的标签
    DECLARE
      work_tags TEXT[];
    BEGIN
      SELECT tags INTO work_tags FROM works WHERE id = NEW.work_id;
      
      -- 更新每个标签的兴趣分数
      IF work_tags IS NOT NULL THEN
        FOREACH tag IN ARRAY work_tags
        LOOP
          -- 如果标签已存在，则增加兴趣分数，否则插入新标签
          INSERT INTO user_interest_tags (user_id, tag, interest_score)
          VALUES (NEW.user_id, tag, 0.2)
          ON CONFLICT (user_id, tag) DO UPDATE
          SET interest_score = LEAST(user_interest_tags.interest_score + 0.1, 1.0),
              updated_at = CURRENT_TIMESTAMP;
        END LOOP;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为likes表添加更新用户兴趣标签的触发器
CREATE TRIGGER update_user_interests_after_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_user_interest_tags();

-- 创建基于兴趣标签的高级推荐算法
CREATE OR REPLACE FUNCTION get_advanced_recommendations(user_id UUID, limit_count INTEGER DEFAULT 10)
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
  match_score FLOAT
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
    -- 计算匹配分数：基于标签匹配度、作品受欢迎程度和发布时间
    (COALESCE((
      SELECT SUM(uit.interest_score) 
      FROM unnest(w.tags) AS work_tag
      JOIN user_interest_tags uit ON uit.tag = work_tag AND uit.user_id = user_id
    ), 0) / GREATEST(array_length(w.tags, 1), 1) * 0.6 + 
    -- 作品受欢迎程度分数
    LEAST((w.likes * 3 + w.comments * 2 + w.views) / 1000.0, 1.0) * 0.3 + 
    -- 发布时间分数（越新分数越高）
    LEAST(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - w.created_at)) / 86400 / 30, 1.0) * 0.1) AS match_score
  FROM works w
  JOIN users u ON w.creator_id = u.id
  WHERE w.deleted_at IS NULL AND u.deleted_at IS NULL
  AND w.creator_id != user_id
  ORDER BY match_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. 数据同步机制

-- 创建数据同步配置表
CREATE TABLE IF NOT EXISTS data_sync_configs (
  id SERIAL PRIMARY KEY,
  sync_name VARCHAR(100) NOT NULL UNIQUE,
  source_table VARCHAR(100) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- incremental, full, realtime
  last_sync_time TIMESTAMP WITH TIME ZONE,
  sync_interval INTEGER, -- 同步间隔（秒）
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据同步日志表
CREATE TABLE IF NOT EXISTS data_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_config_id INTEGER REFERENCES data_sync_configs(id) ON DELETE CASCADE,
  sync_start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sync_end_time TIMESTAMP WITH TIME ZONE,
  records_synced INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL, -- success, failed, running
  error_message TEXT,
  sync_duration INTEGER -- 同步持续时间（毫秒）
);

-- 为数据同步日志表添加索引
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_config_id ON data_sync_logs(sync_config_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_status ON data_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_start_time ON data_sync_logs(sync_start_time DESC);

-- 5. 备份和恢复策略

-- 创建备份配置表
CREATE TABLE IF NOT EXISTS backup_configs (
  id SERIAL PRIMARY KEY,
  backup_name VARCHAR(100) NOT NULL UNIQUE,
  backup_type VARCHAR(50) NOT NULL, -- full, incremental, differential
  backup_schedule VARCHAR(100) NOT NULL, -- cron表达式
  backup_retention_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建备份日志表
CREATE TABLE IF NOT EXISTS backup_logs (
  id SERIAL PRIMARY KEY,
  backup_config_id INTEGER REFERENCES backup_configs(id) ON DELETE CASCADE,
  backup_start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  backup_end_time TIMESTAMP WITH TIME ZONE,
  backup_size BIGINT, -- 备份大小（字节）
  status VARCHAR(50) NOT NULL, -- success, failed, running
  backup_file_path TEXT, -- 备份文件路径
  error_message TEXT,
  backup_duration INTEGER -- 备份持续时间（毫秒）
);

-- 为备份日志表添加索引
CREATE INDEX IF NOT EXISTS idx_backup_logs_config_id ON backup_logs(backup_config_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_start_time ON backup_logs(backup_start_time DESC);

-- 6. 性能监控和告警机制

-- 创建性能监控表
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为性能监控表添加索引
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

-- 创建告警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  metric_name VARCHAR(100) NOT NULL,
  operator VARCHAR(10) NOT NULL, -- >, <, >=, <=, =, !=
  threshold FLOAT NOT NULL,
  alert_level VARCHAR(50) NOT NULL, -- info, warning, error, critical
  alert_message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建告警日志表
CREATE TABLE IF NOT EXISTS alert_logs (
  id SERIAL PRIMARY KEY,
  alert_rule_id INTEGER REFERENCES alert_rules(id) ON DELETE CASCADE,
  alert_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  alert_level VARCHAR(50) NOT NULL,
  alert_message TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  threshold FLOAT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_time TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 为告警日志表添加索引
CREATE INDEX IF NOT EXISTS idx_alert_logs_rule_id ON alert_logs(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_time ON alert_logs(alert_time DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_is_resolved ON alert_logs(is_resolved);

-- 7. 数据质量检查

-- 创建数据质量检查规则表
CREATE TABLE IF NOT EXISTS data_quality_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  table_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100),
  check_type VARCHAR(50) NOT NULL, -- not_null, unique, min, max, range, pattern, foreign_key
  check_value TEXT NOT NULL, -- 检查值，根据check_type不同而不同
  severity VARCHAR(50) NOT NULL, -- low, medium, high
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据质量检查结果表
CREATE TABLE IF NOT EXISTS data_quality_results (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES data_quality_rules(id) ON DELETE CASCADE,
  check_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_records INTEGER,
  failed_records INTEGER,
  success_rate FLOAT,
  status VARCHAR(50) NOT NULL, -- passed, failed
  error_message TEXT,
  sample_failed_records JSONB -- 失败记录示例
);

-- 为数据质量检查结果表添加索引
CREATE INDEX IF NOT EXISTS idx_data_quality_results_rule_id ON data_quality_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_results_check_time ON data_quality_results(check_time DESC);
CREATE INDEX IF NOT EXISTS idx_data_quality_results_status ON data_quality_results(status);

-- 8. 缓存机制

-- 创建查询缓存表
CREATE TABLE IF NOT EXISTS query_cache (
  id SERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL UNIQUE, -- 查询语句的哈希值
  query_text TEXT NOT NULL, -- 原始查询语句
  result JSONB NOT NULL, -- 查询结果
  cache_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expire_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 缓存过期时间
  hit_count INTEGER DEFAULT 0 -- 缓存命中次数
);

-- 为查询缓存表添加索引
CREATE INDEX IF NOT EXISTS idx_query_cache_query_hash ON query_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_cache_expire_time ON query_cache(expire_time);

-- 创建清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS VOID AS $$
BEGIN
  DELETE FROM query_cache WHERE expire_time < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 9. 物化视图

-- 创建热门作品物化视图，每小时刷新一次
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_works
AS
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
LIMIT 20;

-- 为物化视图添加索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_trending_works_id ON mv_trending_works(id);
CREATE INDEX IF NOT EXISTS idx_mv_trending_works_category ON mv_trending_works(category);

-- 创建刷新物化视图的函数
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_trending_works;
END;
$$ LANGUAGE plpgsql;
