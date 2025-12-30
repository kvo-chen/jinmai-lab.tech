# Supabase 数据库迁移指南

## 概述
本文档介绍如何使用 Supabase CLI 进行数据库迁移，以管理数据库 schema 变更。

## 前提条件
1. 安装 Supabase CLI
2. 配置 Supabase 项目
3. 确保已连接到正确的 Supabase 实例

## 安装 Supabase CLI

### Windows
```bash
npm install -g supabase
```

### macOS
```bash
brew install supabase/tap/supabase
```

### Linux
```bash
bash <(curl -s https://supabase.com/install.sh)
```

## 配置 Supabase CLI

1. 初始化 Supabase 项目
```bash
supabase init
```

2. 链接到现有 Supabase 项目
```bash
supabase link --project-ref <your-project-ref>
```

3. 配置环境变量
```bash
# 在 .env 文件中添加
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 创建迁移

1. 创建新的迁移文件
```bash
supabase migration new <migration-name>
```

2. 编辑迁移文件（位于 supabase/migrations/ 目录）

3. 应用迁移
```bash
supabase db push
```

## 迁移示例

### 创建 users 表
```sql
-- supabase/migrations/20251230000000_create_users_table.sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    interests TEXT[],
    is_admin BOOLEAN DEFAULT FALSE,
    age INTEGER DEFAULT 0,
    tags TEXT[],
    membership_level TEXT DEFAULT 'free',
    membership_status TEXT DEFAULT 'active',
    membership_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 添加 RLS 策略
CREATE POLICY "Allow users to view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
```

## 管理迁移

1. 查看迁移状态
```bash
supabase migration list
```

2. 回滚迁移
```bash
supabase db rollback
```

3. 重置数据库
```bash
supabase db reset
```

## 与 GitHub Actions 集成

可以在 GitHub Actions 中添加 Supabase 迁移步骤，实现自动部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase db push
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 最佳实践

1. 每次 schema 变更都创建一个新的迁移文件
2. 迁移文件应包含完整的 schema 变更，包括表创建、修改、索引、约束等
3. 测试迁移文件，确保它们能正确执行
4. 使用 RLS 保护敏感数据
5. 定期备份数据库

## 故障排除

### 常见错误

1. **外键约束错误**
   - 确保引用的表和列存在
   - 检查数据类型是否匹配
   - 考虑使用 ON DELETE CASCADE 或 ON UPDATE CASCADE

2. **权限错误**
   - 确保使用了正确的服务角色密钥
   - 检查表的 RLS 策略

3. **迁移冲突**
   - 避免手动修改数据库 schema
   - 总是使用迁移文件进行 schema 变更

## 相关资源

- [Supabase CLI 文档](https://supabase.com/docs/reference/cli/supabase)
- [数据库迁移最佳实践](https://supabase.com/docs/guides/database/transactions)
- [RLS 策略指南](https://supabase.com/docs/guides/auth/row-level-security)