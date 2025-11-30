## 目标
- 在本项目新增服务端代理，安全调用 Ark Doubao Seedance 视频生成 API，提供前端可用的创建任务与查询任务接口。
- 解决鉴权与格式问题，统一错误处理与轮询，避免在浏览器暴露 API Key。

## 接口设计
- `POST /api/doubao/videos/tasks`：创建视频生成任务。
  - Body：`{ model?: string, content: [{ type: 'text', text: string }, { type: 'image_url', image_url: { url: string }}] }`
  - 返回：`{ id: string, status: 'submitted' }`
- `GET /api/doubao/videos/tasks/:id`：查询任务状态与结果。
  - 返回关键字段：`{ id, status, content: { video_url?, last_frame_url? }, usage?, updated_at }`

## 请求映射
- Ark Base：`https://ark.cn-beijing.volces.com/api/v3`
- 创建任务：代理到 `POST /contents/generations/tasks`，原样传递 `model` 与 `content`。
- 查询任务：代理到 `GET /contents/generations/tasks/{id}`，原样返回 Ark 响应。
- 统一去掉用户输入中的反引号与首尾空格；仅接受可公网访问的 `image_url`。

## 鉴权与配置
- 环境变量：`ARK_API_KEY`（长效 API Key），仅服务端持有。
- 请求头：`Authorization: Bearer ${ARK_API_KEY}`，`Content-Type: application/json`。
- 在 `.env` 或部署平台注入密钥；禁止在日志与错误中泄露密钥。

## 技术栈与文件
- 新增 `server/`：`Node.js + Express`（或 Koa/Fastify），`dotenv`，`node-fetch/axios`。
- 中间件：`cors`（限制来源）、`helmet`、`express-rate-limit`（限流）。
- 结构：
  - `server/index.ts`：应用入口与路由注册
  - `server/routes/doubaoVideo.ts`：两个端点的实现
  - `server/lib/arkClient.ts`：Ark 请求封装（create/get）与错误标准化
  - `server/config.ts`：读取环境变量与校验

## 错误处理与重试
- 标准化错误：`{ ok: false, error: { code, message }, status }`。
- 网络错误与 Ark 5xx：指数退避最多 3 次；客户端返回可读信息。
- 记录 Ark `request id`（响应头或 body 中出现时）以便排查。

## 安全与合规
- 仅服务端持有密钥；启用 CORS 白名单和速率限制；禁止任意来源请求。
- 清洗用户输入（去反引号、trim、校验 URL 协议与大小写）。
- 不持久化视频 URL；提示 24 小时有效期，需要用户及时转存。

## 代理与网络
- 可选代理支持：读取 `HTTP_PROXY/HTTPS_PROXY` 环境变量，供企业内网直连。
- 超时：Ark 请求 20–30s；查询端点 10s。

## 日志与观测
- 记录：`taskId`、`model`、`status`、`updated_at`、`usage.total_tokens`。
- 级别：`info`（成功）/`warn`（重试）/`error`（失败），不含密钥与隐私。

## 测试与验收
- 单元测试：`arkClient` 创建与查询的正/反用例。
- 集成测试：对两个端点的 200/4xx/5xx 覆盖；模拟鉴权错误与网络超时。
- 验收标准：前端可创建任务并轮询拿到 `video_url`；失败路径清晰，性能与限流符合预期。

## 前端对接说明
- 已封装服务端端点为 `/api/doubao/videos/tasks` 与 `/api/doubao/videos/tasks/:id`，前端直接调用，无需管理密钥。
- 提示词附加文本命令：`--resolution`/`--duration`/`--camerafixed`/`--ratio`。
- 首帧必须是公网 URL，拒绝 `data:` 本地数据，并给出错误提示。

## 交付步骤
1. 新建 `server/`，实现配置、Ark 客户端与路由。
2. 增加安全中间件与限流；适配企业代理与超时。
3. 写测试用例并本地验证两个端点。
4. 启动服务并与现有前端联调，确认成功生成与轮询流程。

准备开始以上实现。