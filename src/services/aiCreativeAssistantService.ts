// AI创意助手服务，用于生成创意建议

// 创意建议类型定义
export interface CreativeSuggestion {
  id: string;
  type: 'theme' | 'style' | 'color' | 'element' | 'layout' | 'concept';
  content: string;
  description: string;
  tags: string[];
  relevance: number; // 0-100，相关性评分
  createdAt: Date;
}

// 创意方向类型定义
export interface CreativeDirection {
  id: string;
  name: string;
  description: string;
  examples: string[];
  tags: string[];
}

// AI创意助手服务类
class AICreativeAssistantService {
  private nextSuggestionId = 1;
  private nextDirectionId = 1;
  private creativeDirections: CreativeDirection[] = [];

  constructor() {
    this.initCreativeDirections();
  }

  // 初始化创意方向
  private initCreativeDirections(): void {
    this.creativeDirections = [
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '国潮融合',
        description: '将传统中国元素与现代潮流设计相结合',
        examples: [
          '将青花瓷纹样与街头潮流服饰结合',
          '用中国传统色彩搭配现代UI设计',
          '将书法艺术融入数字媒体设计'
        ],
        tags: ['国潮', '传统', '现代', '融合']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '文化传承',
        description: '传承和弘扬中国传统文化元素',
        examples: [
          '基于非物质文化遗产的创意设计',
          '传统工艺的现代应用',
          '文化符号的创新表达'
        ],
        tags: ['文化', '传承', '传统', '创新']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '科技未来',
        description: '融合科技元素，展现未来感和科技感',
        examples: [
          'AI生成艺术与传统设计结合',
          '元宇宙概念设计',
          '数字化传统文化表达'
        ],
        tags: ['科技', '未来', 'AI', '数字化']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '生态环保',
        description: '以生态环保为主题，倡导可持续发展',
        examples: [
          '环保材料的创意应用',
          '生态主题的视觉设计',
          '可持续发展理念的创意表达'
        ],
        tags: ['环保', '生态', '可持续', '绿色']
      },
      {
        id: `direction-${this.nextDirectionId++}`,
        name: '地域特色',
        description: '突出地域文化特色，展现地方魅力',
        examples: [
          '天津杨柳青年画风格设计',
          '苏州园林元素应用',
          '敦煌壁画艺术创新'
        ],
        tags: ['地域', '特色', '地方', '文化']
      }
    ];
  }

  // 生成创意建议
  generateCreativeSuggestions(prompt: string, count: number = 5): CreativeSuggestion[] {
    // 模拟AI生成创意建议，实际应用中应调用AI模型
    const suggestions: CreativeSuggestion[] = [];
    const types: Array<'theme' | 'style' | 'color' | 'element' | 'layout' | 'concept'> = ['theme', 'style', 'color', 'element', 'layout', 'concept'];
    const tags = this.extractTags(prompt);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const suggestion = this.generateSuggestionByType(type, prompt, tags);
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  // 根据类型生成创意建议
  private generateSuggestionByType(type: CreativeSuggestion['type'], prompt: string, tags: string[]): CreativeSuggestion {
    const baseSuggestions: Record<CreativeSuggestion['type'], string[]> = {
      theme: [
        '将传统节日元素与现代设计结合',
        '以自然景观为灵感的创意设计',
        '融合不同文化元素的跨界设计',
        '以历史故事为主题的创意表达',
        '关注社会热点的创意设计'
      ],
      style: [
        '尝试使用扁平化设计风格',
        '采用渐变色彩和玻璃拟态效果',
        '结合手绘风格和数字艺术',
        '使用极简主义设计语言',
        '尝试复古风格与现代元素结合'
      ],
      color: [
        '使用中国传统色彩配色方案',
        '尝试对比色搭配增强视觉冲击力',
        '使用渐变色营造层次感',
        '采用单色调设计突出主题',
        '使用柔和色调营造温馨氛围'
      ],
      element: [
        '融入传统纹样元素',
        '添加动态效果增强交互性',
        '使用几何图形构建视觉层次',
        '添加纹理效果增强质感',
        '使用文字作为设计元素'
      ],
      layout: [
        '尝试非对称布局设计',
        '使用网格系统构建秩序感',
        '采用分层设计增强立体感',
        '使用留白营造呼吸感',
        '尝试动态布局设计'
      ],
      concept: [
        '以故事性为核心的设计',
        '强调情感共鸣的创意表达',
        '采用隐喻和象征手法',
        '关注用户体验的设计',
        '尝试跨学科融合的创意'
      ]
    };

    const content = baseSuggestions[type][Math.floor(Math.random() * baseSuggestions[type].length)];
    const description = this.generateDescription(type, content);

    return {
      id: `suggestion-${this.nextSuggestionId++}`,
      type,
      content,
      description,
      tags: [...tags, type],
      relevance: Math.floor(Math.random() * 30) + 70, // 70-100的相关性评分
      createdAt: new Date()
    };
  }

  // 生成建议描述
  private generateDescription(type: CreativeSuggestion['type'], content: string): string {
    const descriptions: Record<CreativeSuggestion['type'], string[]> = {
      theme: [
        '这个主题可以帮助你更好地表达设计理念',
        '尝试从这个角度出发，可能会有新的灵感',
        '这个主题适合当前的设计需求',
        '这个主题可以吸引目标受众的注意力',
        '尝试将这个主题与你的设计结合'
      ],
      style: [
        '这种风格可以增强设计的视觉效果',
        '尝试使用这种风格，可能会有意外的效果',
        '这种风格适合当前的设计主题',
        '这种风格可以提升设计的专业感',
        '尝试将这种风格与其他元素结合'
      ],
      color: [
        '这种配色方案可以营造特定的氛围',
        '尝试使用这种配色，可能会增强视觉冲击力',
        '这种配色适合当前的设计主题',
        '这种配色可以提升设计的美感',
        '尝试将这种配色与其他设计元素结合'
      ],
      element: [
        '添加这个元素可以增强设计的层次感',
        '尝试使用这个元素，可能会丰富设计内容',
        '这个元素适合当前的设计风格',
        '这个元素可以提升设计的独特性',
        '尝试将这个元素与其他元素结合'
      ],
      layout: [
        '这种布局可以增强设计的可读性',
        '尝试使用这种布局，可能会提升用户体验',
        '这种布局适合当前的设计内容',
        '这种布局可以增强设计的视觉引导',
        '尝试将这种布局与其他设计元素结合'
      ],
      concept: [
        '这个概念可以帮助你更好地表达设计思想',
        '尝试从这个概念出发，可能会有新的创意方向',
        '这个概念适合当前的设计目标',
        '这个概念可以提升设计的深度',
        '尝试将这个概念与其他设计元素结合'
      ]
    };

    return descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
  }

  // 从提示词中提取标签
  private extractTags(prompt: string): string[] {
    // 简单的标签提取，实际应用中可能需要更复杂的算法
    const commonTags = ['国潮', '传统', '现代', '文化', '创意', '设计', '艺术', '科技', '环保', '地域'];
    const extractedTags: string[] = [];

    commonTags.forEach(tag => {
      if (prompt.includes(tag)) {
        extractedTags.push(tag);
      }
    });

    // 如果没有提取到标签，返回默认标签
    if (extractedTags.length === 0) {
      return ['创意', '设计'];
    }

    return extractedTags;
  }

  // 获取创意方向列表
  getCreativeDirections(): CreativeDirection[] {
    return [...this.creativeDirections];
  }

  // 根据ID获取创意方向
  getCreativeDirectionById(id: string): CreativeDirection | undefined {
    return this.creativeDirections.find(direction => direction.id === id);
  }

  // 根据标签获取创意方向
  getCreativeDirectionsByTag(tag: string): CreativeDirection[] {
    return this.creativeDirections.filter(direction => direction.tags.includes(tag));
  }

  // 搜索创意方向
  searchCreativeDirections(query: string): CreativeDirection[] {
    const lowerQuery = query.toLowerCase();
    return this.creativeDirections.filter(direction => 
      direction.name.toLowerCase().includes(lowerQuery) ||
      direction.description.toLowerCase().includes(lowerQuery) ||
      direction.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // 生成创意方案
  generateCreativePlan(prompt: string, direction: string): string {
    // 模拟生成创意方案，实际应用中应调用AI模型
    const directionObj = this.getCreativeDirectionById(direction);
    const examples = directionObj?.examples || [];
    const example = examples[Math.floor(Math.random() * examples.length)];

    return `基于"${prompt}"的创意方案：

1. 创意方向：${directionObj?.name || '通用'}
2. 核心概念：${example}
3. 设计建议：
   - 尝试将传统元素与现代设计结合
   - 使用鲜明的色彩对比增强视觉效果
   - 添加动态元素提升交互体验
   - 注重用户体验和情感共鸣
4. 预期效果：
   - 突出主题，吸引目标受众
   - 展现独特的设计风格
   - 传达清晰的设计理念
   - 达到预期的设计目标

建议：可以尝试多种设计方案，从中选择最适合的一种进行深入开发。`;
  }
}

// 创建单例实例
const aiCreativeAssistantService = new AICreativeAssistantService();

export default aiCreativeAssistantService;