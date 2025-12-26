/**
 * 知识库服务模块
 * 管理平台知识和文化知识库
 */

// 审核状态类型
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'published';

// 版本信息类型
export interface VersionInfo {
  version: string;
  createdAt: number;
  updatedBy: string;
  changes: string[];
}

// 文化资产元数据类型
export interface CulturalAssetMetadata {
  sourceUrl?: string;
  sourceType?: 'official' | 'community' | 'crawled';
  copyright?: string;
  license?: string;
  author?: string;
  originalId?: string;
}

// 知识条目类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  relevanceScore?: number; // 相关性评分，用于搜索排序
  reviewStatus: ReviewStatus; // 审核状态
  metadata?: CulturalAssetMetadata; // 文化资产元数据
  versions?: VersionInfo[]; // 版本历史
}

// 知识库配置类型定义
export interface KnowledgeBaseConfig {
  enableKnowledgeBase: boolean;
  enableAutoSearch: boolean;
  searchThreshold: number; // 搜索相关性阈值
  maxResults: number; // 最大返回结果数
}

// 默认知识库配置
export const DEFAULT_KB_CONFIG: KnowledgeBaseConfig = {
  enableKnowledgeBase: true,
  enableAutoSearch: true,
  searchThreshold: 0.5,
  maxResults: 3
};

// 平台知识数据
const PLATFORM_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'platform-1',
    title: '创作流程指南',
    content: '我们平台的创作流程包括：1. 构思创意，2. 选择文化元素，3. 使用AI生成工具创作，4. 编辑优化，5. 发布分享。详细步骤可在创作工坊页面查看完整教程。',
    category: 'platform',
    tags: ['创作流程', '教程', '平台功能'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '平台官方'
    }
  },
  {
    id: 'platform-2',
    title: 'AI生成功能说明',
    content: '我们的AI生成功能支持多种模型，包括DeepSeek、豆包、文心一言等。您可以通过调整参数来控制生成结果的风格和质量。生成的作品可以直接保存或进一步编辑。',
    category: 'platform',
    tags: ['AI生成', '模型', '参数调整'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '平台官方'
    }
  },
  {
    id: 'platform-3',
    title: '文化元素使用指南',
    content: '平台提供了丰富的传统文化元素库，包括传统纹样、非遗技艺、民族图案等。您可以直接使用这些元素，或基于它们进行创新设计。',
    category: 'platform',
    tags: ['文化元素', '传统纹样', '非遗技艺'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '平台官方'
    }
  },
  {
    id: 'platform-4',
    title: '作品分享与推广',
    content: '发布作品后，您可以通过社交媒体分享链接，或参与平台的社区活动获得更多曝光。平台会根据作品质量和互动情况进行推荐。',
    category: 'platform',
    tags: ['分享', '推广', '社区活动'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '平台官方'
    }
  },
  {
    id: 'platform-5',
    title: '数据分析功能',
    content: '在"我的作品"页面，您可以查看作品的浏览量、点赞数、分享数等数据。这些数据可以帮助您了解作品的受欢迎程度，优化后续创作。',
    category: 'platform',
    tags: ['数据分析', '作品统计', '创作优化'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '平台官方'
    }
  }
];

// 文化知识库数据
const CULTURAL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'culture-1',
    title: '传统纹样分类',
    content: '中国传统纹样主要包括：1. 几何纹样（如回纹、云纹），2. 动物纹样（如龙纹、凤纹），3. 植物纹样（如牡丹纹、莲花纹），4. 人物纹样，5. 文字纹样。这些纹样常被用于传统服饰、陶瓷、建筑等领域。',
    category: 'culture',
    tags: ['传统纹样', '分类', '文化元素'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '文化研究团队'
    }
  },
  {
    id: 'culture-2',
    title: '非遗技艺介绍',
    content: '非物质文化遗产技艺包括：1. 传统手工艺（如刺绣、木雕、陶瓷），2. 传统表演艺术（如京剧、皮影戏），3. 传统节日（如春节、端午节），4. 传统知识（如中医、天文历法）。',
    category: 'culture',
    tags: ['非遗技艺', '传统工艺', '文化传承'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '文化研究团队'
    }
  },
  {
    id: 'culture-3',
    title: '中国传统色彩体系',
    content: '中国传统色彩体系源于自然和哲学思想，主要包括：1. 五行色彩（青、赤、黄、白、黑），2. 传统染料（如靛蓝、朱砂、赭石），3. 宫廷色彩（如明黄、朱红），4. 民间色彩（如大红、翠绿）。',
    category: 'culture',
    tags: ['传统色彩', '五行色彩', '色彩体系'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '文化研究团队'
    }
  },
  {
    id: 'culture-4',
    title: '传统建筑元素',
    content: '中国传统建筑元素包括：1. 斗拱，2. 飞檐，3. 彩绘，4. 石狮，5. 门钉，6. 藻井。这些元素不仅具有实用功能，还蕴含着丰富的文化内涵。',
    category: 'culture',
    tags: ['传统建筑', '建筑元素', '文化内涵'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '文化研究团队'
    }
  },
  {
    id: 'culture-5',
    title: '传统节日习俗',
    content: '中国传统节日有丰富的习俗：1. 春节（贴春联、吃年夜饭、放鞭炮），2. 元宵节（赏花灯、吃元宵），3. 清明节（扫墓、踏青），4. 端午节（吃粽子、赛龙舟），5. 中秋节（赏月、吃月饼）。',
    category: 'culture',
    tags: ['传统节日', '节日习俗', '文化活动'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: 'published',
    metadata: {
      sourceType: 'official',
      author: '文化研究团队'
    }
  }
];

/**
 * 知识库服务类
 */
class KnowledgeBaseService {
  private knowledgeItems: KnowledgeItem[] = [...PLATFORM_KNOWLEDGE, ...CULTURAL_KNOWLEDGE];
  private config: KnowledgeBaseConfig = { ...DEFAULT_KB_CONFIG };
  
  /**
   * 初始化知识库
   */
  constructor() {
    this.loadKnowledgeBase();
  }
  
  /**
   * 加载知识库数据
   */
  private loadKnowledgeBase(): void {
    try {
      const savedConfig = localStorage.getItem('KB_CONFIG');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      
      const savedKnowledge = localStorage.getItem('KB_ITEMS');
      if (savedKnowledge) {
        const parsedKnowledge = JSON.parse(savedKnowledge);
        this.knowledgeItems = [...this.knowledgeItems, ...parsedKnowledge];
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }
  
  /**
   * 保存知识库配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('KB_CONFIG', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save knowledge base config:', error);
    }
  }
  
  /**
   * 保存知识库数据
   */
  private saveKnowledgeBase(): void {
    try {
      // 只保存用户添加的知识条目，不保存默认数据
      const userKnowledge = this.knowledgeItems.filter(item => 
        !item.id.startsWith('platform-') && !item.id.startsWith('culture-')
      );
      localStorage.setItem('KB_ITEMS', JSON.stringify(userKnowledge));
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
    }
  }
  
  /**
   * 设置知识库配置
   */
  setConfig(config: Partial<KnowledgeBaseConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }
  
  /**
   * 获取知识库配置
   */
  getConfig(): KnowledgeBaseConfig {
    return { ...this.config };
  }
  
  /**
   * 计算文本相关性（简单的词频匹配）
   */
  private calculateRelevance(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    if (queryWords.length === 0) return 0;
    
    let matchCount = 0;
    for (const word of queryWords) {
      if (contentWords.includes(word)) {
        matchCount++;
      }
    }
    
    return matchCount / queryWords.length;
  }
  
  /**
   * 搜索知识库
   */
  searchKnowledge(query: string, options?: {
    category?: string;
    maxResults?: number;
    threshold?: number;
    includeUnpublished?: boolean; // 是否包含未发布内容
    status?: ReviewStatus[]; // 允许的状态列表
  }): KnowledgeItem[] {
    const maxResults = options?.maxResults || this.config.maxResults;
    const threshold = options?.threshold || this.config.searchThreshold;
    const includeUnpublished = options?.includeUnpublished || false;
    const allowedStatuses = options?.status || (includeUnpublished ? ['pending', 'approved', 'rejected', 'published'] : ['published']);
    
    // 简单的关键词匹配搜索
    const results = this.knowledgeItems
      .filter(item => {
        // 状态过滤
        if (!allowedStatuses.includes(item.reviewStatus)) {
          return false;
        }
        
        // 类别过滤
        if (options?.category && item.category !== options.category) {
          return false;
        }
        
        // 关键词匹配
        const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = item.content.toLowerCase().includes(query.toLowerCase());
        const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        return titleMatch || contentMatch || tagMatch;
      })
      .map(item => ({
        ...item,
        relevanceScore: this.calculateRelevance(query, `${item.title} ${item.content} ${item.tags.join(' ')}`)
      }))
      .filter(item => item.relevanceScore >= threshold)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxResults);
    
    return results;
  }
  
  /**
   * 添加知识条目
   */
  addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewStatus'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      ...item,
      id: `custom-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewStatus: 'pending' // 默认审核状态为待审核
    };
    
    this.knowledgeItems.push(newItem);
    this.saveKnowledgeBase();
    
    return newItem;
  }
  
  /**
   * 批量添加知识条目（用于内容抓取）
   */
  batchAddKnowledgeItems(items: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewStatus'>[]): KnowledgeItem[] {
    const newItems: KnowledgeItem[] = items.map(item => ({
      ...item,
      id: `crawled-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewStatus: 'pending' // 抓取的内容默认待审核
    }));
    
    this.knowledgeItems.push(...newItems);
    this.saveKnowledgeBase();
    
    return newItems;
  }
  
  /**
   * 更新知识条目审核状态
   */
  updateReviewStatus(id: string, status: ReviewStatus, reviewer?: string): KnowledgeItem | null {
    const index = this.knowledgeItems.findIndex(item => item.id === id);
    if (index !== -1) {
      const updatedItem: KnowledgeItem = {
        ...this.knowledgeItems[index],
        reviewStatus: status,
        updatedAt: Date.now()
      };
      
      this.knowledgeItems[index] = updatedItem;
      this.saveKnowledgeBase();
      
      return updatedItem;
    }
    
    return null;
  }
  
  /**
   * 获取待审核知识条目
   */
  getPendingReviewItems(category?: string): KnowledgeItem[] {
    return this.knowledgeItems.filter(item => {
      const statusMatch = item.reviewStatus === 'pending';
      const categoryMatch = !category || item.category === category;
      return statusMatch && categoryMatch;
    });
  }
  
  /**
   * 发布知识条目
   */
  publishKnowledgeItem(id: string, publisher: string): KnowledgeItem | null {
    const index = this.knowledgeItems.findIndex(item => item.id === id);
    if (index !== -1 && this.knowledgeItems[index].reviewStatus === 'approved') {
      const item = this.knowledgeItems[index];
      const updatedItem: KnowledgeItem = {
        ...item,
        reviewStatus: 'published',
        updatedAt: Date.now(),
        versions: [
          ...(item.versions || []),
          {
            version: `v${(item.versions?.length || 0) + 1}.0.0`,
            createdAt: Date.now(),
            updatedBy: publisher,
            changes: ['发布知识条目']
          }
        ]
      };
      
      this.knowledgeItems[index] = updatedItem;
      this.saveKnowledgeBase();
      
      return updatedItem;
    }
    
    return null;
  }
  
  /**
   * 抓取内容（模拟实现，实际应调用外部API或爬虫服务）
   */
  async crawlContent(sourceUrl: string, sourceType: 'official' | 'community' | 'crawled' = 'crawled'): Promise<KnowledgeItem[]> {
    // 模拟抓取过程，实际实现应调用爬虫服务
    console.log(`Crawling content from ${sourceUrl}...`);
    
    // 模拟抓取结果
    const crawledItems: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewStatus'>[] = [
      {
        title: `从${sourceUrl}抓取的内容`,
        content: `这是从${sourceUrl}抓取的模拟内容。在实际实现中，这里会包含从源网址提取的结构化数据。`,
        category: 'culture',
        tags: ['抓取内容', '自动生成'],
        metadata: {
          sourceUrl,
          sourceType,
          author: '自动抓取'
        }
      }
    ];
    
    // 模拟异步延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.batchAddKnowledgeItems(crawledItems);
  }
  
  /**
   * 同步知识库（与后端服务同步）
   */
  async syncWithBackend(): Promise<{ success: boolean; syncedItems: number; message: string }> {
    try {
      // 模拟同步过程，实际实现应调用后端API
      console.log('Syncing knowledge base with backend...');
      
      // 模拟同步结果
      const syncedItems = this.knowledgeItems.filter(item => 
        item.reviewStatus === 'published' && item.metadata?.sourceType === 'official'
      ).length;
      
      // 模拟异步延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        syncedItems,
        message: '知识库同步成功'
      };
    } catch (error) {
      console.error('Failed to sync knowledge base:', error);
      return {
        success: false,
        syncedItems: 0,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
  
  /**
   * 更新知识条目
   */
  updateKnowledgeItem(id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>, updater?: string, changes?: string[]): KnowledgeItem | null {
    const index = this.knowledgeItems.findIndex(item => item.id === id);
    if (index !== -1) {
      const currentItem = this.knowledgeItems[index];
      const updatedItem: KnowledgeItem = {
        ...currentItem,
        ...updates,
        updatedAt: Date.now(),
        versions: [
          ...(currentItem.versions || []),
          {
            version: `v${(currentItem.versions?.length || 0) + 1}.0.0`,
            createdAt: Date.now(),
            updatedBy: updater || '系统',
            changes: changes || ['更新知识条目']
          }
        ]
      };
      
      this.knowledgeItems[index] = updatedItem;
      this.saveKnowledgeBase();
      
      return updatedItem;
    }
    
    return null;
  }
  
  /**
   * 删除知识条目
   */
  deleteKnowledgeItem(id: string): boolean {
    // 不能删除默认知识条目
    if (id.startsWith('platform-') || id.startsWith('culture-')) {
      return false;
    }
    
    const index = this.knowledgeItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.knowledgeItems.splice(index, 1);
      this.saveKnowledgeBase();
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取所有知识条目
   */
  getAllKnowledgeItems(category?: string): KnowledgeItem[] {
    if (category) {
      return this.knowledgeItems.filter(item => item.category === category);
    }
    return [...this.knowledgeItems];
  }
  
  /**
   * 根据ID获取知识条目
   */
  getKnowledgeItemById(id: string): KnowledgeItem | undefined {
    return this.knowledgeItems.find(item => item.id === id);
  }
  
  /**
   * 清空用户添加的知识条目
   */
  clearCustomKnowledge(): void {
    this.knowledgeItems = this.knowledgeItems.filter(item => 
      item.id.startsWith('platform-') || item.id.startsWith('culture-')
    );
    this.saveKnowledgeBase();
  }
  
  /**
   * 获取知识库统计信息
   */
  getStatistics(): {
    totalItems: number;
    platformItems: number;
    culturalItems: number;
    customItems: number;
    categories: Record<string, number>;
  } {
    const stats = {
      totalItems: this.knowledgeItems.length,
      platformItems: this.knowledgeItems.filter(item => item.category === 'platform').length,
      culturalItems: this.knowledgeItems.filter(item => item.category === 'culture').length,
      customItems: this.knowledgeItems.filter(item => 
        !item.id.startsWith('platform-') && !item.id.startsWith('culture-')
      ).length,
      categories: this.knowledgeItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  }
}

// 导出单例实例
export const knowledgeBaseService = new KnowledgeBaseService();
