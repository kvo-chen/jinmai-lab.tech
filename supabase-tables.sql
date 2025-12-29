-- 数据库表格完善脚本

-- 1. 用户表（users）
-- 用于存储用户基本信息和会员状态
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    phone VARCHAR(20),
    interests TEXT[],
    is_admin BOOLEAN DEFAULT FALSE,
    age INTEGER,
    tags TEXT[],
    membership_level VARCHAR(20) DEFAULT 'free' CHECK (membership_level IN ('free', 'premium', 'vip')),
    membership_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end TIMESTAMP WITH TIME ZONE,
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('active', 'expired', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为users表添加索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_membership_level ON users(membership_level);

-- 2. 社区表（communities）
-- 用于存储社群基本信息
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover TEXT,
    tags TEXT[],
    members_count INTEGER DEFAULT 0,
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为communities表添加索引
CREATE INDEX IF NOT EXISTS idx_communities_tags ON communities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at);

-- 3. 社区成员表（community_members）
-- 用于存储用户与社区的关联关系
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    UNIQUE(community_id, user_id)
);

-- 为community_members表添加索引
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

-- 4. 帖子表（posts）
-- 用于存储讨论帖子
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    topic VARCHAR(50),
    mode VARCHAR(20) CHECK (mode IN ('style', 'topic')),
    selected_value VARCHAR(50),
    upvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为posts表添加索引
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);

-- 5. 回复表（replies）
-- 用于存储帖子回复
CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为replies表添加索引
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON replies(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at);

-- 6. 消息表（messages）
-- 用于存储社群聊天消息
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    avatar TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为messages表添加索引
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON messages(is_pinned);

-- 7. 收藏表（favorites）
-- 用于存储用户收藏的帖子
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 为favorites表添加索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id);

-- 8. 关注表（follows）
-- 用于存储用户关注关系
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 为follows表添加索引
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- 9. 会员权益表（membership_benefits）
-- 用于存储不同会员级别的权益
CREATE TABLE IF NOT EXISTS membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_level VARCHAR(20) CHECK (membership_level IN ('free', 'premium', 'vip')),
    benefit TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(membership_level, benefit)
);

-- 10. 计划帖子表（scheduled_posts）
-- 用于存储定时发布的帖子
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_mode VARCHAR(20) CHECK (target_mode IN ('style', 'topic')),
    target_value VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为scheduled_posts表添加索引
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_is_published ON scheduled_posts(is_published);

-- 11. 社区公告表（community_announcements）
-- 用于存储社区公告
CREATE TABLE IF NOT EXISTS community_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为community_announcements表添加索引
CREATE INDEX IF NOT EXISTS idx_community_announcements_community_id ON community_announcements(community_id);

-- 添加RLS策略，确保数据安全
-- 用户表策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- 社区表策略
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public communities are viewable by everyone" ON communities FOR SELECT USING (privacy = 'public');
CREATE POLICY "Community members can view private communities" ON communities FOR SELECT USING (
    privacy = 'private' AND 
    EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid())
);

-- 社区成员表策略
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community members can view members" ON community_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM community_members WHERE community_id = community_members.community_id AND user_id = auth.uid())
);

-- 帖子表策略
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public posts are viewable by everyone" ON posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM communities WHERE id = posts.community_id AND privacy = 'public')
);
CREATE POLICY "Private community posts are viewable by members" ON posts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = posts.community_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can create posts in communities they are members of" ON posts FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = posts.community_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 消息表策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community members can view messages" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = messages.community_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Community members can send messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = messages.community_id AND user_id = auth.uid()
    )
);

-- 插入初始数据
-- 插入会员权益数据
INSERT INTO membership_benefits (membership_level, benefit, sort_order) VALUES
-- 免费会员权益
('free', '基础AI创作功能', 1),
('free', '每天限量生成次数', 2),
('free', '基础社区功能', 3),
('free', '基础作品存储', 4),
-- 高级会员权益
('premium', '无限AI生成次数', 1),
('premium', '高级AI模型访问', 2),
('premium', '高清作品导出', 3),
('premium', '优先处理队列', 4),
('premium', '专属模板库', 5),
('premium', '去除水印', 6),
-- VIP会员权益
('vip', '无限AI生成次数', 1),
('vip', '高级AI模型访问', 2),
('vip', '高清作品导出', 3),
('vip', '优先处理队列', 4),
('vip', '专属模板库', 5),
('vip', '去除水印', 6),
('vip', '专属AI训练模型', 7),
('vip', '一对一设计师服务', 8),
('vip', '商业授权', 9),
('vip', '专属活动邀请', 10)
ON CONFLICT (membership_level, benefit) DO NOTHING;

-- 插入推荐社群数据
INSERT INTO communities (id, name, description, cover, tags, members_count)
VALUES
('c-guochao', '国潮设计社群', '讨论国潮视觉、品牌联名与配色体系', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20design%20community%20banner', ARRAY['国潮', '联名', '品牌'], 1286),
('c-heritage', '非遗数字化社群', '分享非遗数字化案例与教育传播', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20heritage%20digital%20community%20banner', ARRAY['非遗', '教育', '海报'], 986),
('c-ip', 'IP联名与授权', '围绕IP设计与商业授权的合作讨论', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=IP%20collaboration%20and%20licensing%20community%20banner', ARRAY['IP', '联名', '授权'], 742),
('c-peking-opera', '京剧视觉社群', '京剧元素的现代视觉化与海报设计讨论', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Peking%20opera%20visual%20community%20banner%2C%20bold%20graphics', ARRAY['京剧', '戏曲', '海报'], 812),
('c-jingdezhen', '景德镇陶瓷文创社群', '蓝白瓷与陶瓷文创的设计分享与交流', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jingdezhen%20ceramics%20community%20banner%2C%20blue%20and%20white', ARRAY['景德镇', '陶瓷', '文创'], 654)
ON CONFLICT (id) DO NOTHING;
