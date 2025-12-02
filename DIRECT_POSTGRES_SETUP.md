# 直接PostgreSQL连接配置指南

## 为什么使用直接PostgreSQL连接？

直接使用PostgreSQL连接字符串比配置复杂的Data API更简单，更适合我们的项目：

1. **配置简单**：只需要一个`DATABASE_URL`环境变量
2. **兼容性好**：我们的代码已经完全支持
3. **成熟稳定**：PostgreSQL连接是成熟的技术
4. **性能优秀**：直接连接性能更好
5. **无需额外配置**：不需要复杂的身份验证设置

## 如何获取PostgreSQL连接字符串

1. 登录Neon控制台
2. 进入项目页面
3. 点击左侧菜单的"连接"或"Connect"
4. 选择"psql"或"Direct Connection"
5. 复制完整的连接字符串，格式类似：
   ```
   postgresql://neondb_owner:your_password@ep-bold-flower-agmuls0b-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

## Vercel环境变量配置

1. 登录Vercel控制台
2. 选择您的项目
3. 点击"Settings" > "Environment Variables"
4. 添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| DB_TYPE | postgresql |
| DATABASE_URL | 您的PostgreSQL连接字符串 |
| JWT_SECRET | 一个安全的随机字符串 |
| JWT_EXPIRES_IN | 7d |
| CORS_ALLOW_ORIGIN | * |

## 部署代码

1. 提交本地代码到GitHub：
   ```bash
   git add .
   git commit -m "配置PostgreSQL直接连接"
   git push origin main
   ```

2. Vercel会自动检测到GitHub的更改并开始部署

## 验证功能

部署完成后：
1. 访问您的Vercel域名
2. 测试注册功能，确保数据存入Neon
3. 测试登录功能，验证用户数据读取
4. 在管理后台查看用户列表

## 常见问题排查

### 连接失败
- 检查`DATABASE_URL`是否正确
- 确保连接字符串包含`sslmode=require`
- 检查Neon项目是否处于活跃状态

### 注册失败
- 查看Vercel部署日志获取详细错误信息
- 确保JWT_SECRET已正确配置

### 登录后无法获取用户信息
- 检查JWT令牌是否包含完整的用户数据
- 确保API端点返回完整的用户信息

## 安全建议

1. 不要将连接字符串直接提交到代码仓库
2. 使用Vercel的环境变量加密功能
3. 定期更换数据库密码和JWT_SECRET
4. 监控数据库连接和查询

---

通过以上步骤，您的项目将成功使用直接PostgreSQL连接，实现完整的线上数据库功能。这种方式配置简单，性能优秀，适合我们的项目需求。