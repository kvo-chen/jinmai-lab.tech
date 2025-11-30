## 目标
- 接入 DeepSeek 官方 API（含 deepseek-chat / deepseek-reasoner），与现有 Kimi 并行可选。
- 在模型面板支持 DeepSeek 的密钥输入、规格选择与流式输出；保留本地持久化与安全提示。

## 实施要点
- API 信息：
  - Base URL：`https://api.deepseek.com` 或 `https://api.deepseek.com/v1`（两者兼容）[1]
  - Chat 端点：`POST /chat/completions`（OpenAI 兼容），支持 `stream: true` 流式返回[1][3]
  - 模型：`deepseek-chat`（非思维）与 `deepseek-reasoner`（思维/推理，支持 `reasoning_content`）[2]

## 服务层（llmService）
1. 新增 DeepSeek 配置字段：
   - `deepseek_model`（默认 `deepseek-chat`）、`deepseek_base_url`（默认 `https://api.deepseek.com`）、`retry`/`backoff_ms` 复用、`stream` 复用。
   - 读取密钥顺序：`localStorage.DEPPSEEK_API_KEY`（拼写为 `DEEPSEEK_API_KEY`）或 `import.meta.env.VITE_DEEPSEEK_API_KEY`。
2. 新增 `callDeepseek(prompt, { onDelta, signal })`：
   - 非流式：解析 `data.choices[0].message.content`；
   - 流式：SSE 增量解析 `delta.content`，若为 `deepseek-reasoner`，兼顾 `delta.reasoning_content`（可选保存但默认不展示）。[2][3]
   - 指数退避重试与错误抛出。
3. 在 `generateResponse()` 中，当当前模型为 `deepseek` 时调用 `callDeepseek`，密钥缺失返回降级提示。

## UI（ModelSelector）
1. 当选择 `DeepSeek`：展示密钥输入、Base URL 下拉（固定两项）、模型规格选择（`deepseek-chat`/`deepseek-reasoner`）。
2. 复用「系统提示词」「上下文历史」与「流式输出开关」，与 Kimi 保持一致。
3. 保存逻辑：
   - 校验密钥以 `sk-` 开头；
   - 持久化到 `localStorage.DEPPSEEK_API_KEY`（命名为 `DEEPSEEK_API_KEY`）；
   - 写入 `deepseek_base_url` 与 `deepseek_model` 到配置；
   - 保留恢复默认与错误提示。

## 对话面板（LLMCommandPanel）
- 已支持流式增量渲染，无需额外改动；DeepSeek 流式将直接受 `stream` 开关控制。
- 如选择 `deepseek-reasoner`，暂不显示 `reasoning_content`，以免打扰创作流程；后续可加“显示推理过程”开关。

## 安全与生产建议
- 开发期可前端直连；生产建议走后端代理隐藏密钥并统一限流/审计。
- 不在仓库提交任何密钥；优先环境变量（`VITE_DEEPSEEK_API_KEY`）。

## 验证
- 非流式与流式分别在 `deepseek-chat` 与 `deepseek-reasoner` 下测试；
- 切换 Base URL 与模型规格验证成功返回；
- 错误场景：密钥错误、超时、网络错误，提示清晰。

## 参考
- [1] DeepSeek API Docs（Base URL 与Chat端点、OpenAI兼容）：https://api-docs.deepseek.com/
- [2] DeepSeek Reasoner（推理内容与流式参数）：https://api-docs.deepseek.com/guides/reasoning_model
- [3] Create Chat Completion（参数与流式返回规范）：https://api-docs.deepseek.com/api/create-chat-completion