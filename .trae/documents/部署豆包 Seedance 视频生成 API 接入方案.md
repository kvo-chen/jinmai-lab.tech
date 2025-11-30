## 目标

* 在当前项目接入 Doubao Seedance 视频生成（图生视频、文生视频），提供创建任务与轮询查询，最终展示并下载生成视频。

* 修复鉴权与请求格式问题，确保在 Windows PowerShell、项目后端与前端均可稳定调用。

## 接口纠错与最小可用示例

* 去掉所有反引号与多余空格；严格使用 `Authorization: Bearer <API_KEY>`。

* PowerShell 最小示例：

```
$env:ARK_API_KEY = "<你的ARK_API_KEY>"

curl -X POST "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer $env:ARK_API_KEY" ^
  -d "{\"model\":\"doubao-seedance-1-0-pro-250528\",\"content\":[{\"type\":\"text\",\"text\":\"无人机以极快速度穿越复杂障碍或自然奇观，带来沉浸式飞行体验  --resolution 1080p  --duration 5 --camerafixed false --watermark true\"},{\"type\":\"image_url\",\"image_url\":{\"url\":\"https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_i2v.png\"}}]}"
```

* 查询任务：

```
curl -X GET "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/<任务id>" ^
  -H "Authorization: Bearer $env:ARK_API_KEY"
```

## 架构方案

* 后端代理：在服务端实现 Ark API 代理，持有 `ARK_API_KEY`，避免在浏览器暴露密钥。

* 两个核心接口：

  * `POST /api/video/tasks`：创建视频生成任务，转发到 Ark `POST /contents/generations/tasks`。

  * `GET /api/video/tasks/:id`：查询任务状态，转发到 Ark `GET /contents/generations/tasks/{id}`。

* 前端：提供表单（Prompt + 图片 URL + 可选参数）与任务进度展示；轮询成功后展示 `video_url` 并提供下载。

## 后端实现步骤

* 配置：在 `.env` 增加 `ARK_API_KEY`，运行时通过配置模块读取；禁止日志打印密钥。

* HTTP 客户端：使用 `fetch/axios` 调用 Ark；`base_url` 为 `https://ark.cn-beijing.volces.com/api/v3`。

* 创建任务映射：将前端传入 `prompt` 与 `imageUrl` 转成 Ark 所需 JSON：

  * `model`: 默认 `doubao-seedance-1-0-pro-250528`（可通过请求参数覆盖）。

  * `content`: `[{ type: "text", text: "... --resolution 720p --duration 5" }, { type: "image_url", image_url: { url: "..." } }]`。

* 查询任务映射：将 Ark 返回原样转发（含 `status`, `content.video_url`, `usage` 等）。

* 轮询策略：后端或前端每 10 秒查询一次，超时上限 10 分钟；可选 SSE 推送。

## 前端实现步骤

* UI 表单：`prompt`、`imageUrl`、分辨率/时长/镜头参数（文本命令如 `--ratio 16:9 --duration 5`）。

* 提交后显示任务 `id` 与状态；`succeeded` 时显示可点击的 `video_url`，并提供“下载/转存”按钮。

* 失败时展示 `error.code` 与 `error.message`，给出重试建议。

## 错误处理与重试

* 鉴权：`AuthenticationError` → 检查 `Bearer` 是否为长效 API Key，去除不可见字符；通过服务端环境变量注入。

* 网络：公司内网可能需代理；针对 `timeout` 设置合理重试（指数退避），并记录 Ark `request id` 便于定位。

* 业务：对 `queued/running/succeeded/failed/cancelled` 做显式分支；失败时保留最近一次响应。

* 资源：图像 URL 必须可公网直连，≤30MB，格式合法；视频链接有效期约 24 小时，提示及时保存。

## 安全与配置

* 密钥仅存服务端；CI/构建不输出密钥；禁止在浏览器端拼接 `Authorization`。

* 请求限流与并发保护：简单令牌桶或队列，避免触发平台限流。

* 观测：记录任务创建与状态查询的 `id/status/updated_at/usage.total_tokens`，便于成本与性能分析。

## 验证与交付

* 本地验证：使用示例图片 URL 与 5 秒 720p/1080p，确认 `queued → running → succeeded` 流转正常。

* 回归用例：

  * 文生视频（仅文本）

  * 图生视频（首帧）

  * 参数覆盖（`--ratio`/`--duration`/`--camerafixed`）

* 结果展示：确认 `content.video_url` 可下载，提示 24 小时有效期。

## 后续扩展

* 模型选择：支持 `doubao-seedance-1-0-pro-fast-251015` 与 `doubao-seedance-1-0-lite-i2v-250428`。

* 功能扩展：首尾帧、参考图（1-4 张）、尾帧返回开关、SSE 推送进度、批量任务列表。

## 附：简化 PowerShell 示例（Invoke-RestMethod）

```
$env:ARK_API_KEY = "<你的ARK_API_KEY>"
$body = @{ model = "doubao-seedance-1-0-pro-250528"; content = @(
  @{ type = "text"; text = "女孩抱着狐狸... --resolution 720p --duration 5" },
  @{ type = "image_url"; image_url = @{ url = "https://ark-project.tos-cn-beijing.volces.com/doc_image/i2v_foxrgirl.png" } }
) } | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST `
  -Uri "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks" `
  -Headers @{ Authorization = "Bearer $env:ARK_API_KEY"; "Content-Type" = "application/json" } `
  -Body $body
```

请确认以上方案；确认后我
