/**
 * 大语言模型服务模块
 * 提供与各类大语言模型交互的接口
 */

// 模型类型定义
export interface LLMModel {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  isDefault: boolean;
  apiKey?: string;
}

// 对话历史类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 模型配置类型定义
export interface ModelConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
  system_prompt: string;
  max_history: number;
  stream: boolean;
  kimi_model: string;
  kimi_base_url: string;
  retry: number;
  backoff_ms: number;
  deepseek_model?: string;
  deepseek_base_url?: string;
}

// 可用的模型列表
export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '擅长传统纹样生成和文化元素融合',
    strengths: ['传统纹样生成', '文化元素融合', '设计创意'],
    isDefault: false
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '擅长现代设计风格和创新表达',
    strengths: ['现代设计', '创新表达', '交互对话'],
    isDefault: false
  },
  {
    id: 'wenxinyiyan',
    name: '文心一言',
    description: '擅长多模态生成和传统文化理解',
    strengths: ['多模态生成', '传统文化理解', '创意激发'],
    isDefault: false
  },
  {
    id: 'qwen',
    name: '通义千问',
    description: '阿里云DashScope，中文对话与综合任务表现优秀',
    strengths: ['中文对话', '综合任务', '工具调用'],
    isDefault: false
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Kimi（Moonshot AI），擅长中文长文创作与协作',
    strengths: ['中文对话', '长上下文写作', '检索增强'],
    isDefault: true
  }
];

// 默认模型配置
export const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2000,
  timeout: 30000,
  system_prompt: '你是一个帮助创作者进行设计构思与文化融合的助手。',
  max_history: 10,
  stream: false,
  kimi_model: 'moonshot-v1-32k',
  kimi_base_url: 'https://api.moonshot.cn/v1',
  retry: 2,
  backoff_ms: 800,
  deepseek_model: 'deepseek-chat',
  deepseek_base_url: 'https://api.deepseek.com'
};

/**
 * LLM服务类
 */
class LLMService {
  private currentModel: LLMModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
  private modelConfig: ModelConfig = { ...DEFAULT_CONFIG };
  private conversationHistory: Message[] = [];

  /**
   * 设置当前使用的模型
   */
  setCurrentModel(modelId: string): void {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      this.currentModel = model;
      try { localStorage.setItem('LLM_CURRENT_MODEL', model.id); } catch {}
    }
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): LLMModel {
    return this.currentModel;
  }

  /**
   * 更新模型配置
   */
  updateConfig(config: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...config };
    try { localStorage.setItem('LLM_CONFIG', JSON.stringify(this.modelConfig)); } catch {}
  }

  /**
   * 获取当前模型配置
   */
  getConfig(): ModelConfig {
    return { ...this.modelConfig };
  }

  /**
   * 清除对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  importHistory(messages: Message[]): void {
    const limit = this.modelConfig.max_history || 10;
    const trimmed = messages.slice(-limit);
    this.conversationHistory = [...trimmed];
    try { localStorage.setItem('LLM_HISTORY_IMPORTED_AT', String(Date.now())); } catch {}
  }

  /**
   * 向模型发送请求
   * 由于是模拟环境，我们返回预设的模拟响应
   */
  async generateResponse(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }): Promise<string> {
    // 添加用户消息到历史
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.addToHistory(userMessage);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('模型响应超时'));
      }, this.modelConfig.timeout);

      if (this.currentModel.id === 'kimi') {
        this.callKimi(prompt, options)
          .then((response) => {
            clearTimeout(timeoutId);
            const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(response);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            const fallback = 'Kimi接口不可用或未配置密钥，返回模拟响应。';
            const aiMessage: Message = { role: 'assistant', content: fallback, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(fallback);
          });
        return;
      }
      if (this.currentModel.id === 'deepseek') {
        this.callDeepseek(prompt, options)
          .then((response) => {
            clearTimeout(timeoutId);
            const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(response);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            const fallback = 'DeepSeek接口不可用或未配置密钥，返回模拟响应。';
            const aiMessage: Message = { role: 'assistant', content: fallback, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(fallback);
          });
        return;
      }
      if (this.currentModel.id === 'wenxinyiyan') {
        this.callWenxin(prompt, options)
          .then((response) => {
            clearTimeout(timeoutId);
            const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(response);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            const fallback = '文心一言接口鉴权失败或未配置密钥，请在 .env.local 设置 QIANFAN_ACCESS_TOKEN（或 QIANFAN_AK/QIANFAN_SK）后重试。';
            const aiMessage: Message = { role: 'assistant', content: fallback, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(fallback);
          });
        return;
      }
      if (this.currentModel.id === 'qwen') {
        this.callQwen(prompt, options)
          .then((response) => {
            clearTimeout(timeoutId);
            const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(response);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            const fallback = '通义千问接口不可用或未配置密钥，请在 .env.local 设置 DASHSCOPE_API_KEY 后重试。';
            const aiMessage: Message = { role: 'assistant', content: fallback, timestamp: Date.now() };
            this.addToHistory(aiMessage);
            resolve(fallback);
          });
        return;
      }

      setTimeout(() => {
        clearTimeout(timeoutId);
        
        let response = '';
        
        // 根据当前模型生成不同风格的响应
        if (this.currentModel.id === 'deepseek') {
          response = this.generateDeepSeekResponse(prompt);
        } else if (this.currentModel.id === 'doubao') {
          response = this.generateDoubaoResponse(prompt);
        } else if (this.currentModel.id === 'wenxinyiyan') {
          response = this.generateWenxinResponse(prompt);
        }
        
        // 添加AI响应到历史
        const aiMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        this.addToHistory(aiMessage);
        
        resolve(response);
      }, Math.random() * 1500 + 500);
    });
  }

  private async callKimi(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }): Promise<string> {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_KIMI_API_KEY) || '';
    const storedKey = localStorage.getItem('KIMI_API_KEY') || '';
    const key = storedKey || envKey;
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    if (!useProxy && !key) {
      throw new Error('Missing Kimi API key');
    }
    const base = this.modelConfig.kimi_base_url || 'https://api.moonshot.cn/v1';
    const url = useProxy ? `${apiBase}/api/kimi/chat/completions` : (base + '/chat/completions');
    const effectiveStream = useProxy ? false : (this.modelConfig.stream === true);
    const payload: any = {
      model: this.modelConfig.kimi_model || 'moonshot-v1-32k',
      messages: [
        { role: 'system', content: this.modelConfig.system_prompt },
        { role: 'user', content: prompt }
      ],
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens
    };
    if (effectiveStream) payload.stream = true;

    const doFetch = async () => {
      const headers: any = { 'Content-Type': 'application/json' };
      if (!useProxy) headers['Authorization'] = `Bearer ${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal
      });
      if (!res.ok) throw new Error('Kimi API error');
      if (effectiveStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const json = t.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const obj = JSON.parse(json);
              const delta = obj?.choices?.[0]?.delta?.content || '';
              if (delta) {
                full += delta;
                if (options?.onDelta) options.onDelta(full);
              }
            } catch {}
          }
        }
        return full || 'Kimi未返回内容';
      } else {
        const data = await res.json();
        const raw = useProxy ? (data?.data || {}) : data;
        const content = raw?.choices?.[0]?.message?.content || '';
        return content || 'Kimi未返回内容';
      }
    };

    let attempt = 0;
    let lastErr: any;
    while (attempt <= this.modelConfig.retry) {
      try { return await doFetch(); } catch (e) {
        lastErr = e;
        attempt++;
        if (attempt > this.modelConfig.retry) break;
        await new Promise(r => setTimeout(r, this.modelConfig.backoff_ms * attempt));
      }
    }
    throw lastErr || new Error('Kimi API error');
  }

  private async callDeepseek(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }): Promise<string> {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_DEEPSEEK_API_KEY) || '';
    const storedKey = localStorage.getItem('DEEPSEEK_API_KEY') || '';
    const key = storedKey || envKey;
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    if (!useProxy && !key) throw new Error('Missing DeepSeek API key');
    const base = this.modelConfig.deepseek_base_url || 'https://api.deepseek.com';
    const url = useProxy ? `${apiBase}/api/deepseek/chat/completions` : ((base.endsWith('/v1') ? base : base + '/v1') + '/chat/completions');
    const effectiveStream = useProxy ? false : (this.modelConfig.stream === true);
    const payload: any = {
      model: this.modelConfig.deepseek_model || 'deepseek-chat',
      messages: [
        { role: 'system', content: this.modelConfig.system_prompt },
        { role: 'user', content: prompt }
      ],
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens
    };
    if (effectiveStream) payload.stream = true;

    const doFetch = async () => {
      const headers: any = { 'Content-Type': 'application/json' };
      if (!useProxy) headers['Authorization'] = `Bearer ${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal
      });
      if (!res.ok) throw new Error('DeepSeek API error');
      if (effectiveStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const json = t.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const obj = JSON.parse(json);
              const delta = obj?.choices?.[0]?.delta?.content || '';
              if (delta) {
                full += delta;
                if (options?.onDelta) options.onDelta(full);
              }
              const rdelta = obj?.choices?.[0]?.delta?.reasoning_content || '';
              if (rdelta) {
                // 可扩展：保存推理内容
              }
            } catch {}
          }
        }
        return full || 'DeepSeek未返回内容';
      } else {
        const data = await res.json();
        const raw = useProxy ? (data?.data || {}) : data;
        const content = raw?.choices?.[0]?.message?.content || '';
        return content || 'DeepSeek未返回内容';
      }
    };

    let attempt = 0;
    let lastErr: any;
    while (attempt <= this.modelConfig.retry) {
      try { return await doFetch(); } catch (e) {
        lastErr = e;
        attempt++;
        if (attempt > this.modelConfig.retry) break;
        await new Promise(r => setTimeout(r, this.modelConfig.backoff_ms * attempt));
      }
    }
    throw lastErr || new Error('DeepSeek API error');
  }

  private async callWenxin(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    if (!apiBase) throw new Error('Missing API base for Wenxin');
    const url = `${apiBase}/api/qianfan/chat/completions`;
    const payload: any = {
      model: 'ERNIE-Speed-8K',
      messages: [
        { role: 'system', content: this.modelConfig.system_prompt },
        { role: 'user', content: prompt }
      ],
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: options?.signal });
    if (!res.ok) throw new Error('Wenxin API error');
    const data = await res.json();
    const raw = data?.data || {};
    const content = raw?.result || raw?.choices?.[0]?.message?.content || '';
    return content || '文心一言未返回内容';
  }

  private async callQwen(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    if (!apiBase) throw new Error('Missing API base for Qwen');
    const url = `${apiBase}/api/dashscope/chat/completions`;
    const payload: any = {
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: this.modelConfig.system_prompt },
        { role: 'user', content: prompt }
      ],
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: options?.signal });
    if (!res.ok) throw new Error('Qwen API error');
    const data = await res.json();
    const raw = data?.data || {};
    const content = raw?.choices?.[0]?.message?.content || raw?.output_text || '';
    return content || '通义千问未返回内容';
  }

  /**
   * 添加消息到历史，并保持历史长度限制
   */
  private addToHistory(message: Message): void {
    this.conversationHistory.push(message);
    const limit = this.modelConfig.max_history || 10;
    if (this.conversationHistory.length > limit) {
      this.conversationHistory.shift();
    }
  }

  /**
   * 生成DeepSeek模型的模拟响应
   */
  private generateDeepSeekResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('青花瓷') || lowerPrompt.includes('纹样')) {
      return '已为您生成融合青花瓷纹样的设计方案。这种纹样源自明代永宣时期，以其典雅的蓝色调和流畅的线条著称。设计中结合了传统青花瓷的经典元素和现代简约风格，既保留了文化底蕴，又符合当代审美。您可以继续调整色彩或添加其他文化元素。';
    } else if (lowerPrompt.includes('中秋') || lowerPrompt.includes('节日')) {
      return '为您设计了一套中秋主题的国潮风格方案。方案融合了传统中秋元素（如月饼、玉兔、桂花）与现代设计语言，色彩以喜庆的红色和金色为主，传达团圆美满的节日氛围。建议添加传统纹样如云纹或回纹作为装饰元素，增强文化感。';
    } else if (lowerPrompt.includes('调整') || lowerPrompt.includes('修改')) {
      return '已根据您的要求调整设计。颜色已从红色调改为靛蓝色，这种颜色在传统中国文化中象征着宁静和智慧，与您的设计主题非常契合。同时优化了元素布局，使其更加平衡和谐。您可以继续提出调整建议。';
    } else {
      return '根据您的描述，我为您生成了一个融合传统与现代的设计方案。方案注重文化元素的合理运用，同时保持了现代设计的简洁美感。您可以提出具体的修改意见，或添加更多细节要求，我会进一步优化方案。';
    }
  }

  /**
   * 生成豆包模型的模拟响应
   */
  private generateDoubaoResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('创新') || lowerPrompt.includes('现代')) {
      return '为您打造了一款充满现代感的创新设计。设计采用了大胆的几何形状和鲜明的色彩对比，同时巧妙融入了传统元素，实现了传统与现代的完美平衡。这种风格特别适合吸引年轻消费群体，展现品牌的活力与创新精神。';
    } else if (lowerPrompt.includes('年轻化') || lowerPrompt.includes('潮流')) {
      return '根据您的需求，我设计了一套年轻化的国潮方案。方案结合了当下流行的设计趋势，使用了明亮活泼的色彩和有趣的图形元素，同时保留了足够的文化识别度。这种设计能够有效吸引Z世代消费者的关注，提升品牌在年轻群体中的影响力。';
    } else if (lowerPrompt.includes('优化') || lowerPrompt.includes('改进')) {
      return '已对您的设计进行了优化。主要改进了视觉层次和信息传达效率，使设计更加清晰易懂。同时调整了色彩搭配，使其更加和谐统一。您可以继续提出具体的优化方向，我会进一步完善方案。';
    } else {
      return '基于您的需求，我为您生成了一个富有创意的设计方案。这个方案注重视觉冲击力和情感表达，能够有效传达品牌信息和文化内涵。您可以告诉我您对方案的看法，或提出具体的调整要求，我会根据您的反馈进一步优化。';
    }
  }

  /**
   * 生成文心一言模型的模拟响应
   */
  private generateWenxinResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('文化') || lowerPrompt.includes('传统')) {
      return '为您生成了一个深度融合传统文化元素的设计方案。方案参考了多个历史时期的艺术风格，将传统纹样、色彩和构图原则与现代设计需求相结合，创造出既有文化底蕴又符合当代审美的作品。这种设计能够有效传达品牌的文化价值和历史传承。';
    } else if (lowerPrompt.includes('多模态') || lowerPrompt.includes('综合')) {
      return '根据您的需求，我为您创建了一个多模态设计方案。这个方案结合了视觉、文字和互动元素，提供了丰富的用户体验。设计中融入了多种文化符号和表现手法，能够在不同场景下有效传达信息。您可以告诉我您对方案的具体看法。';
    } else if (lowerPrompt.includes('建议') || lowerPrompt.includes('指导')) {
      return '根据您的创作内容，我提供以下建议：1. 可以增加一些传统纹样作为装饰元素，增强文化识别度；2. 考虑调整色彩搭配，使其更加和谐统一；3. 优化元素布局，提升整体视觉效果。这些调整将有助于提升作品的文化内涵和艺术表现力。';
    } else {
      return '基于您的描述，我为您生成了一个富有文化内涵的设计方案。这个方案注重文化元素的准确运用和创意表达，能够有效传达品牌的文化价值和理念。您可以提出具体的修改意见，我会根据您的反馈进一步完善方案。';
    }
  }

  /**
   * 创意启发功能 - 基于用户输入扩展创作方向
   */
  generateCreativeDirections(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const directions: string[] = [];
    
     // 根据关键词生成不同的创意方向
    if (lowerPrompt.includes('海河') || lowerPrompt.includes('天津')) {
      directions.push('津味民俗+现代插画风格');
      directions.push('传统漕运文化与现代城市景观结合');
      directions.push('天津地方特色小吃元素融入');
      directions.push('海河两岸历史建筑与现代艺术表现');
      directions.push('杨柳青年画风格创新设计');
      directions.push('泥人张彩塑元素数字化应用');
    } else if (lowerPrompt.includes('春节')) {
      directions.push('传统春联与现代设计语言结合');
      directions.push('剪纸艺术的现代演绎');
      directions.push('传统灯笼元素创新应用');
      directions.push('团圆主题的现代诠释');
      directions.push('中国传统色彩的现代应用');
      directions.push('非遗技艺的年轻化表达');
      directions.push('老字号品牌的现代视觉重构');
    } else {
      directions.push('传统文化元素与现代简约风格结合');
      directions.push('地域文化特色的创新表达');
      directions.push('传统技艺的现代应用');
      directions.push('经典纹样的重新诠释');
    }
    
    return directions;
  }

  /**
   * 文化元素推荐功能 - 根据主题推荐相关文化元素
   */
  recommendCulturalElements(topic: string): string[] {
    const lowerTopic = topic.toLowerCase();
    const elements: string[] = [];
    
    // 根据主题推荐文化元素
    if (lowerTopic.includes('春节')) {
      elements.push('春联');
      elements.push('剪纸');
      elements.push('红灯笼');
      elements.push('中国结');
      elements.push('鞭炮');
      elements.push('福字');
    } else if (lowerTopic.includes('中秋')) {
      elements.push('月饼');
      elements.push('玉兔');
      elements.push('桂花');
      elements.push('月亮');
      elements.push('灯笼');
      elements.push('团圆');
    } else if (lowerTopic.includes('国潮')) {
      elements.push('祥云纹');
      elements.push('龙纹');
      elements.push('凤纹');
      elements.push('青花瓷');
      elements.push('中国红');
      elements.push('书法');
    } else if (lowerTopic.includes('传统纹样')) {
      elements.push('云纹');
      elements.push('回纹');
      elements.push('花卉纹');
      elements.push('几何纹');
      elements.push('龙纹');
      elements.push('凤纹');
    } else {
      elements.push('传统色彩');
      elements.push('经典纹样');
      elements.push('书法元素');
      elements.push('传统符号');
      elements.push('非遗技艺');
      elements.push('历史故事');
    }
    
    return elements;
  }

  /**
   * 创作问题诊断功能 - 分析创作中可能存在的问题
   */
  diagnoseCreationIssues(contentDescription: string): string[] {
    const lowerContent = contentDescription.toLowerCase();
    const issues: string[] = [];
    
    // 模拟检测可能存在的问题
    if (lowerContent.includes('密集') || lowerContent.includes('拥挤')) {
      issues.push('纹样排布过于密集，建议采用散点式布局，增加留白空间');
    }
    if (lowerContent.includes('龙纹') && Math.random() > 0.5) {
      issues.push('此龙纹形态不符合清代官窑标准，是否替换为品牌标准龙纹？');
    }
    if (lowerContent.includes('色彩') && Math.random() > 0.5) {
      issues.push('色彩搭配较为单调，建议增加传统色彩层次，提升视觉丰富度');
    }
    if (Math.random() > 0.7) {
      issues.push('文化元素融合略显生硬，建议调整元素比例和组合方式，使整体更加和谐');
    }
    
    // 如果没有检测到明显问题，提供一些通用建议
    if (issues.length === 0) {
      issues.push('整体设计良好，建议进一步强化文化元素的独特性和识别度');
      if (Math.random() > 0.5) {
        issues.push('可以考虑增加互动性元素，提升用户参与感和体验');
      }
    }
    
    return issues;
  }
}

// 导出单例实例
const service = new LLMService();
try {
  const savedModel = localStorage.getItem('LLM_CURRENT_MODEL');
  if (savedModel) service.setCurrentModel(savedModel);
  const savedCfg = localStorage.getItem('LLM_CONFIG');
  if (savedCfg) service.updateConfig(JSON.parse(savedCfg));
} catch {}
export default service;
