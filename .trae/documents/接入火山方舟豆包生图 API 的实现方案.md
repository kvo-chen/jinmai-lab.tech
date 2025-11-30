## 接入目标
- 在平台内新增 Doubao 生图能力（文本生成图片），并保留现有 SDXL 源作为备选引擎
- 支持基础参数：`prompt`、`size`、`n`、`seed`、`guidance_scale`，返回图片 URL 或 base64
- 统一错误处理、鉴权、安全存储密钥，不在前端暴露 API Key

## 能力校验与正确用法
- 你提供的示例是“图文理解”的接口（`/api/v3/chat/completions`，多模态理解），适用于问“图片主要讲了什么？”
- 生图请使用“图片生成”接口：`POST /api/v3/images/generations`
- 模型选择：需要在火山方舟控制台激活 Doubao 生图模型（如 `doubao-seedream-3.0-t2i`），然后“创建在线推理端点”，实际调用时 `model` 字段填该端点 ID（形如 `ep-xxxxxxxx`）

示例（生成图片）：
```
curl -X POST 'https://ark.cn-beijing.volces.com/api/v3/images/generations' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $DOUBAO_API_KEY' \
  -d '{
    "model": "ep-20250528154802-c4np4",
    "prompt": "天津老字号主题的国潮风宣传海报，高质感，暖色光",
    "size": "1024x1024",
    "n": 1,
    "seed": 42,
    "guidance_scale": 7.5
  }'
```
注意：你示例中的反引号和空格会导致无效 URL；另外若返回 `AuthenticationError`，需在控制台创建有效 API Key并使用 `Authorization: Bearer <API_KEY>` 鉴权。

示例（图文理解，修正格式）：
```
curl -X POST 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $DOUBAO_API_KEY' \
  -d '{
    "model": "doubao-seed-1-6-vision-250815",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {"url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"}},
        {"type": "text", "text": "图片主要讲了什么?"}
      ]
    }]
  }'
```

## 架构与安全
- 后端代理：新增轻量后端路由（或 serverless 函数）`POST /api/doubao/images/generate`，在后端转发到 Doubao `images/generations`，后端持有 `DOUBAO_API_KEY`
- 环境变量：`DOUBAO_API_KEY`、`DOUBAO_MODEL_ID(ep-...)`、`DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3`
- 不在前端代码或仓库中写入/暴露密钥；本地 `.env`，生产使用平台密钥管理
- 统一重试与速率限制，避免 500/限流造成体验不稳定

## 服务封装
- 新增服务模块（后端或中间层）：
  - `generateImage({ prompt, size, n, seed, guidance_scale })`
  - 可选：`editImage({ image, prompt })`、`variationImage({ image })`
  - `describeImage({ url | base64 })` 走 `chat/completions` 视觉理解，用于“AI点评/文案”
- 返回统一结构：`{ images: [{ url, b64? }], usage, requestId }`
- 错误映射：`AuthenticationError`、`InternalServiceError`、`RateLimitError` → 用户可读提示

## 前端集成点
- “灵感引擎”与“创作页”新增“生成引擎”切换（`SDXL | Doubao`）
- 调用后端代理生成图片，保留现有进度与结果卡片 UI，无需大改
- 工具页的“AI助手”建议文案可直接喂给 `generateImage` 的 `prompt`

## 验证与灰度
- 用“天津老字号”主题做 3 组样例，验证不同分辨率与参数影响
- 发生失败回退到 SDXL 源，保证用户可用性
- 记录 `request_id` 与 prompt 以便问题追踪

## 交付内容（实施后）
- 后端代理路由与配置
- 服务封装模块与类型定义
- 前端引擎切换与最小改动接入
- 使用说明与最小演示脚本（不含密钥）

## 需要你的配合
- 提供或在控制台创建：有效 `API Key` 与已激活的 Doubao 生图端点 ID（`ep-...`）
- 确认是否采用后端代理（推荐）或暂时本地演示模式（仅开发环境）
