## 更新AI模型API密钥并添加新模型

### 现有模型API密钥更新

1. **更新Kimi模型API密钥**
2. **更新DeepSeek模型API密钥**
3. **更新文心一言(百度千帆)模型API密钥**
4. **更新豆包模型API密钥**
5. **更新通义千问模型API密钥**

### 新模型添加

1. **添加ChatGPT模型**
2. **添加Gemini模型**
3. **添加Gork模型**
4. **添加智谱模型**

### 具体实现步骤

1. **更新`ModelConfig`接口**：
   - 添加新模型的配置项（model和base_url）

2. **更新`AVAILABLE_MODELS`数组**：
   - 添加新模型的定义

3. **更新`DEFAULT_CONFIG`**：
   - 添加新模型的默认配置

4. **更新`LLMService`类**：
   - 添加新模型的调用方法（callChatGPT、callGemini、callGork、callZhipu）
   - 更新`ensureAvailableModel`方法以支持新模型

5. **更新`ModelSelector`组件**：
   - 添加新模型的API密钥状态管理
   - 添加新模型的配置界面
   - 更新`handleSave`方法以保存新模型的配置

6. **更新`getFallbackResponse`方法**：
   - 添加新模型的回退响应

### 预期效果

1. 现有模型的API密钥将被更新
2. 新模型将出现在模型选择列表中
3. 每个新模型都有相应的配置界面，允许用户输入API密钥和调整参数
4. 所有模型都支持直连和代理两种连接方式
5. 连接测试功能将支持所有新模型
6. 当API免费额度用完时，模型将自动停止使用

### 具体修改文件

1. **`src/services/llmService.ts`**：
   - 更新`ModelConfig`接口
   - 更新`AVAILABLE_MODELS`数组
   - 更新`DEFAULT_CONFIG`
   - 添加新模型的调用方法
   - 更新相关辅助方法

2. **`src/components/ModelSelector.tsx`**：
   - 添加新模型的API密钥状态管理
   - 添加新模型的配置界面
   - 更新`handleSave`方法

### 注意事项

1. 确保新模型的API调用符合各平台的规范
2. 注意处理API密钥的安全存储
3. 确保错误处理机制完善
4. 确保连接测试功能正常工作
5. 确保免费额度用完时的自动停止功能正常