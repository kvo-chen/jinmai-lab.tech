## 目标
- 在现有架构中新增语音合成能力：后端安全签名转发，前端一键朗读播放。
- 与已存在的 Ark Doubao 代理保持一致的路由风格与调用方式。

## 服务端实现
- 文件：`server/local-api.mjs`
  - 新增路由：`POST /api/volc/tts/synthesize`（并行于 Doubao 路由，参考 L55–102 的实现结构）。
  - 复用：`setCors`、`readBody`。
  - 新增签名与转发：在靠近 `proxyFetch` 附近加入 `volcTtsFetch`，按火山引擎 TTS要求写入鉴权 Header（`AccessToken/SecretKey` 或 AK/SK V4 签名），将文本、音色、语速、音高等参数转发到官方 TTS接口，返回音频（`audio/mpeg` 或 `audio/wav`，亦可 `base64`）。
  - 返回格式：默认返回 `base64`（字段 `audio_base64`），可通过查询参数 `?format=binary` 返回二进制音频流。
- Serverless 同步副本（可选部署）：新增 `api/volc/tts/synthesize.ts`，实现同样的逻辑与入参，保证在 Vercel/Serverless 环境可用。

## 环境变量
- 仅在后端读取，前端不暴露：
  - `VOLC_TTS_APP_ID`
  - `VOLC_TTS_ACCESS_TOKEN`
  - `VOLC_TTS_SECRET_KEY`
  - 或使用 AK/SK：`VOLC_AK`、`VOLC_SK`
- 启动时在本地以 PowerShell 注入，或放置到后端 `.env`：与当前 Doubao 环境变量方式一致。

## 前端服务封装
- 文件：`src/services/voiceService.ts`
  - 新增方法：`synthesize(text: string, opts?)` → `POST /api/volc/tts/synthesize`，优先拿 `audio_base64` 返回 `Blob`，或直接返回 `ArrayBuffer`。
  - 提供默认配置：`voice='female'`、`speed=1.0`、`pitch=1.0`，可传入可选参数覆盖。
- 文件：`src/lib/apiClient.ts` 无需改动；沿用 `apiRequest` 封装。

## 页面改造（一键朗读）
- `src/pages/Generation.tsx`：为生成结果的文案区域添加“朗读”按钮，调用 `voiceService.synthesize`，用 `<audio>` 播放。
- `src/pages/Wizard.tsx` 与 `src/pages/Neo.tsx`：在展示 AI 文案的区域增设“朗读”同样入口，统一体验（可复用一个 `AudioPlayer` 轻组件）。
- 资源管理：使用 `URL.createObjectURL(new Blob([...]))` 绑定到 `<audio src>`；组件卸载时 `URL.revokeObjectURL`。

## 安全与合规
- 秘钥与签名仅在服务端处理；前端只拿音频结果。
- 校验文本长度与速率限制（后端对 `text.length` 与调用频率做防护，避免滥用）。

## 验证方案
- 单接口验证：在本地启动 `node server/local-api.mjs` 后，用 `curl`/`Postman` 发送 `POST /api/volc/tts/synthesize`，确认返回 `audio_base64` 可解码为可播放音频。
- 前端验证：在 `Generation.tsx` 中点击“朗读”，确认 `<audio>` 正常播放；切换音色/速度参数观察效果。
- 回归验证：确保原有 Doubao 路由（图片/视频/对话）与 `apiClient` 正常工作。

## 交付物
- 新增后端路由与签名工具函数（本地代理 + 可选 Serverless）。
- 前端 `voiceService.synthesize` 封装与页面朗读入口。
- 使用说明与环境变量示例（不写入任何真实秘钥）。

## 可选增强
- 流式 TTS：改为后端与官方 SSE/WebSocket 流式对接，前端边收边播（逐段 `MediaSource`）。
- 统一音色配置面板：在设置页集中管理声线、语速、语调及停顿策略。