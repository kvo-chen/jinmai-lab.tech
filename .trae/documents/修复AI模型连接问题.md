## 修复AI模型连接问题

### 问题分析
服务器端的健康检查端点 `/api/health/llms` 只返回了部分模型的状态，缺少了ChatGPT、Gemini、Gork和智谱模型的状态。当应用程序调用 `ensureAvailableModel` 方法时，它会首先尝试从服务器获取模型状态，但服务器只返回了部分模型的状态，导致新添加的模型被标记为不可用。

### 修复方案
1. **更新服务器端健康检查端点**：在 `local-api.mjs` 文件中，修改 `/api/health/llms` 路由，添加对ChatGPT、Gemini、Gork和智谱模型的状态检测。
2. **确保本地配置判断正确**：验证 `ensureAvailableModel` 方法中的本地配置判断部分，确保所有模型的密钥都能被正确检测。
3. **测试修复效果**：运行应用程序，测试所有模型的连接情况。

### 修复步骤
1. 打开 `local-api.mjs` 文件，找到 `/api/health/llms` 路由。
2. 在状态对象中添加新模型的状态检测：
   ```javascript
   const status = {
     doubao: { configured: !!(process.env.DOUBAO_API_KEY || API_KEY), base: (process.env.DOUBAO_BASE_URL || BASE_URL) },
     kimi: { configured: !!(process.env.KIMI_API_KEY || KIMI_API_KEY), base: (process.env.KIMI_BASE_URL || KIMI_BASE_URL) },
     deepseek: { configured: !!(process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY), base: (process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL) },
     qwen: { configured: !!(process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY), base: (process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL), model: (process.env.DASHSCOPE_MODEL_ID || DASHSCOPE_MODEL_ID) },
     wenxin: {
       configured: !!(process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK),
       base: (process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL),
       token_cached: !!__qf_token
     },
     // 添加新模型
     chatgpt: { configured: !!(process.env.CHATGPT_API_KEY || CHATGPT_API_KEY), base: (process.env.CHATGPT_BASE_URL || CHATGPT_BASE_URL), model: (process.env.CHATGPT_MODEL_ID || CHATGPT_MODEL_ID) },
     gemini: { configured: !!(process.env.GEMINI_API_KEY || GEMINI_API_KEY), base: (process.env.GEMINI_BASE_URL || GEMINI_BASE_URL), model: (process.env.GEMINI_MODEL_ID || GEMINI_MODEL_ID) },
     gork: { configured: !!(process.env.GORK_API_KEY || GORK_API_KEY), base: (process.env.GORK_BASE_URL || GORK_BASE_URL), model: (process.env.GORK_MODEL_ID || GORK_MODEL_ID) },
     zhipu: { configured: !!(process.env.ZHIPU_API_KEY || ZHIPU_API_KEY), base: (process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL), model: (process.env.ZHIPU_MODEL_ID || ZHIPU_MODEL_ID) }
   };
   ```
3. 保存文件，重启服务器。
4. 运行应用程序，测试所有模型的连接情况。

### 预期效果
所有模型都能被正确检测为可用，应用程序能够成功连接到所有模型。