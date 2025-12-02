# 部署问题排查指南

## 1. 检查数据库表结构

### 1.1 查看用户表结构

在Neon控制台中：
1. 点击左侧菜单的"SQL编辑器"
2. 执行以下SQL查询查看用户表结构：
   ```sql
   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
   ```

### 1.2 预期结果

用户表应该包含以下字段：
- id (SERIAL PRIMARY KEY)
- username (VARCHAR(20) UNIQUE NOT NULL)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- phone (VARCHAR(20))
- avatar_url (VARCHAR(255))
- interests (TEXT)
- age (INTEGER)
- tags (TEXT)
- created_at (BIGINT NOT NULL)
- updated_at (BIGINT NOT NULL)

## 2. 查看Vercel部署日志

1. 登录Vercel控制台
2. 选择您的项目
3. 点击"Deployments"选项卡
4. 选择最新的部署
5. 点击"Functions"选项卡查看API日志
6. 查找包含"register"或"error"的日志

## 3. 检查API端点

### 3.1 检查注册端点

在浏览器中打开开发者工具，切换到"网络"选项卡，然后测试注册功能，查看API请求的响应。

### 3.2 预期响应

成功注册应该返回：
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "token": "jwt-token-here"
  }
}
```

## 4. 常见问题及解决方案

### 4.1 表结构不完整

**问题**：用户表缺少age或tags字段

**解决方案**：执行以下SQL语句添加缺少的字段：
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT;
```

### 4.2 数据库连接失败

**问题**：API无法连接到数据库

**解决方案**：
- 检查DATABASE_URL是否正确
- 确保连接字符串包含sslmode=require
- 检查Neon项目是否处于活跃状态

### 4.3 JWT配置错误

**问题**：JWT_SECRET配置错误

**解决方案**：
- 确保JWT_SECRET是一个非空字符串
- 尝试使用更强的随机字符串

### 4.4 API端点错误

**问题**：注册端点返回错误

**解决方案**：
- 检查server/local-api.mjs文件中的register端点
- 确保所有必填字段都已正确处理
- 检查密码哈希是否正确实现

## 5. 手动测试API

使用curl命令手动测试注册API：

```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com","password":"password123","age":18,"tags":"test"}' https://your-vercel-domain/api/register
```

查看返回结果，获取具体的错误信息。

## 6. 检查代码

### 6.1 检查register端点

查看server/local-api.mjs文件中的register端点，确保：
- 所有必填字段都已正确处理
- 密码哈希已正确实现
- 数据库插入语句包含所有字段

### 6.2 检查数据库连接

查看server/database.mjs文件中的postgresql连接配置，确保：
- 连接字符串格式正确
- ssl配置正确

## 7. 重新部署

在修复问题后，重新部署项目：

```bash
git add .
git commit -m "修复部署问题"
git push origin main
```

Vercel会自动检测到GitHub的更改并开始部署。

## 8. 联系支持

如果以上步骤都无法解决问题：
1. 收集详细的错误信息
2. 检查Vercel和Neon的状态页面
3. 联系Vercel或Neon的支持团队

---

通过以上步骤，您应该能够找到并解决部署过程中遇到的问题，使注册功能正常工作。