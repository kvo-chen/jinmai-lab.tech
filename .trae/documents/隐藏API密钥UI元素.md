1. 打开 `src/components/ModelSelector.tsx` 文件
2. 移除或注释掉所有模型（ChatGPT、Kimi、DeepSeek、豆包、文心一言、通义千问、Gemini、Gork、智谱）的API密钥输入区域
3. 具体需要移除的内容包括：

   * h4标题（如"ChatGPT API 密钥"）

   * password类型的input输入框

   * 密钥说明文本

   * Base URL和模型规格的select下拉框
4. 确保移除这些元素后，组件的其他功能仍然正常工作
5. 测试修改后的组件，确保没有语法错误或运行时错误

