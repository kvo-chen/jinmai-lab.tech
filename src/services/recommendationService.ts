/**
 * 智能推荐服务模块 - 基于用户行为和偏好提供个性化推荐
 */

// 用户行为类型
export type UserActionType = 'view' | 'like' | 'comment' | 'share' | 'save' | 'submit' | 'participate' | 'download' | 'click' | 'search';

// 用户行为接口
export interface UserAction {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'post' | 'challenge' | 'template' | 'user' | 'tag' | 'culturalElement';
  actionType: UserActionType;
  timestamp: string;
  value?: number; // 可选的评分或权重
  metadata?: Record<string, any>;
}

// 用户偏好接口
export interface UserPreference {
  userId: string;
  interests: Record<string, number>; // 兴趣标签及其权重
  culturalElements: Record<string, number>; // 文化元素偏好及其权重
  categories: Record<string, number>; // 内容分类偏好及其权重
  themes: Record<string, number>; // 主题偏好及其权重
  tags: Record<string, number>; // 标签偏好及其权重
  updateFrequency: number; // 更新频率（秒）
  lastUpdated: string;
}

// 推荐内容接口
export interface RecommendedItem {
  id: string;
  type: 'post' | 'challenge' | 'template' | 'user';
  title: string;
  thumbnail?: string;
  score: number; // 推荐分数
  reason?: string; // 推荐理由
  metadata?: Record<string, any>;
}

// 常量定义
const USER_ACTIONS_KEY = 'jmzf_user_actions';
const USER_PREFERENCES_KEY = 'jmzf_user_preferences';
const RECOMMENDATIONS_KEY = 'jmzf_recommendations';

// 行为权重配置
const ACTION_WEIGHTS: Record<UserActionType, number> = {
  view: 1,
  like: 5,
  comment: 8,
  share: 10,
  save: 7,
  submit: 12,
  participate: 15,
  download: 6,
  click: 2,
  search: 3
};

/**
 * 获取所有用户行为记录
 */
export function getUserActions(): UserAction[] {
  const raw = localStorage.getItem(USER_ACTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 记录用户行为
 */
export function recordUserAction(action: Omit<UserAction, 'id' | 'timestamp'>): UserAction {
  const newAction: UserAction = {
    id: `action-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...action
  };
  
  const actions = getUserActions();
  actions.push(newAction);
  localStorage.setItem(USER_ACTIONS_KEY, JSON.stringify(actions));
  
  // 更新用户偏好
  updateUserPreferences(newAction.userId);
  
  return newAction;
}

/**
 * 获取用户偏好
 */
export function getUserPreferences(userId: string): UserPreference | undefined {
  const raw = localStorage.getItem(USER_PREFERENCES_KEY);
  const allPreferences = raw ? JSON.parse(raw) : [];
  return allPreferences.find((pref: UserPreference) => pref.userId === userId);
}

/**
 * 初始化用户偏好
 */
export function initializeUserPreferences(userId: string): UserPreference {
  const newPreference: UserPreference = {
    userId,
    interests: {},
    culturalElements: {},
    categories: {},
    themes: {},
    tags: {},
    updateFrequency: 3600, // 默认每小时更新一次
    lastUpdated: new Date().toISOString()
  };
  
  const allPreferences = JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '[]');
  const existingIndex = allPreferences.findIndex((pref: UserPreference) => pref.userId === userId);
  
  if (existingIndex !== -1) {
    allPreferences[existingIndex] = newPreference;
  } else {
    allPreferences.push(newPreference);
  }
  
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
  return newPreference;
}

/**
 * 更新用户偏好
 */
export function updateUserPreferences(userId: string): UserPreference {
  const actions = getUserActions().filter(action => action.userId === userId);
  const preference = getUserPreferences(userId) || initializeUserPreferences(userId);
  
  // 重置偏好权重
  const interests: Record<string, number> = {};
  const culturalElements: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const themes: Record<string, number> = {};
  const tags: Record<string, number> = {};
  
  // 分析用户行为，计算偏好权重
  actions.forEach(action => {
    const weight = ACTION_WEIGHTS[action.actionType] * (action.value || 1);
    
    // 根据行为类型更新不同的偏好
    switch (action.itemType) {
      case 'tag':
        interests[action.itemId] = (interests[action.itemId] || 0) + weight;
        tags[action.itemId] = (tags[action.itemId] || 0) + weight;
        break;
      case 'culturalElement':
        culturalElements[action.itemId] = (culturalElements[action.itemId] || 0) + weight;
        break;
      case 'post':
        // 从元数据中提取分类、主题和标签
        if (action.metadata) {
          if (action.metadata.category) {
            categories[action.metadata.category] = (categories[action.metadata.category] || 0) + weight;
          }
          if (action.metadata.theme) {
            themes[action.metadata.theme] = (themes[action.metadata.theme] || 0) + weight;
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
          if (action.metadata.culturalElements) {
            action.metadata.culturalElements.forEach((element: string) => {
              culturalElements[element] = (culturalElements[element] || 0) + weight;
            });
          }
        }
        break;
      case 'challenge':
        // 从元数据中提取主题、文化元素和标签
        if (action.metadata) {
          if (action.metadata.theme) {
            themes[action.metadata.theme] = (themes[action.metadata.theme] || 0) + weight;
          }
          if (action.metadata.culturalElements) {
            action.metadata.culturalElements.forEach((element: string) => {
              culturalElements[element] = (culturalElements[element] || 0) + weight;
            });
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
        }
        break;
      case 'template':
        // 从元数据中提取标签和分类
        if (action.metadata) {
          if (action.metadata.category) {
            categories[action.metadata.category] = (categories[action.metadata.category] || 0) + weight;
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
        }
        break;
    }
  });
  
  // 更新偏好
  const updatedPreference: UserPreference = {
    ...preference,
    interests,
    culturalElements,
    categories,
    themes,
    tags,
    lastUpdated: new Date().toISOString()
  };
  
  // 保存更新后的偏好
  const allPreferences = JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '[]');
  const existingIndex = allPreferences.findIndex((pref: UserPreference) => pref.userId === userId);
  
  if (existingIndex !== -1) {
    allPreferences[existingIndex] = updatedPreference;
  } else {
    allPreferences.push(updatedPreference);
  }
  
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
  
  return updatedPreference;
}

/**
 * 生成推荐内容
 */
export function generateRecommendations(userId: string, limit: number = 20): RecommendedItem[] {
  const preference = getUserPreferences(userId) || initializeUserPreferences(userId);
  const actions = getUserActions().filter(action => action.userId === userId);
  
  // 这里实现一个简单的基于内容的推荐算法
  // 在实际应用中，这应该是一个更复杂的机器学习模型
  
  // 1. 获取所有可能的推荐项（这里我们从localStorage中获取）
  const posts = JSON.parse(localStorage.getItem('jmzf_posts') || '[]');
  const challenges = JSON.parse(localStorage.getItem('jmzf_challenges') || '[]');
  const templates = JSON.parse(localStorage.getItem('jmzf_templates') || '[]');
  
  // 2. 为每个项目计算推荐分数
  const recommendedItems: RecommendedItem[] = [];
  
  // 处理帖子推荐
  posts.forEach((post: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据分类计算分数
    if (post.category && preference.categories[post.category]) {
      score += preference.categories[post.category] * 0.3;
      reasons.push(`您喜欢${post.category}类型的内容`);
    }
    
    // 根据标签计算分数
    if (post.tags) {
      post.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.2;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据文化元素计算分数
    if (post.culturalElements) {
      post.culturalElements.forEach((element: string) => {
        if (preference.culturalElements[element]) {
          score += preference.culturalElements[element] * 0.25;
          reasons.push(`您喜欢${element}文化元素`);
        }
      });
    }
    
    // 根据主题计算分数
    if (post.theme && preference.themes[post.theme]) {
      score += preference.themes[post.theme] * 0.15;
      reasons.push(`您喜欢${post.theme}主题`);
    }
    
    // 根据互动数据调整分数
    score += (post.likes * 0.01) + (post.views * 0.001) + (post.shares * 0.02);
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: post.id,
        type: 'post',
        title: post.title,
        thumbnail: post.thumbnail,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: post
      });
    }
  });
  
  // 处理挑战推荐
  challenges.forEach((challenge: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据主题计算分数
    if (challenge.theme && preference.themes[challenge.theme]) {
      score += preference.themes[challenge.theme] * 0.3;
      reasons.push(`您喜欢${challenge.theme}主题`);
    }
    
    // 根据文化元素计算分数
    if (challenge.culturalElements) {
      challenge.culturalElements.forEach((element: string) => {
        if (preference.culturalElements[element]) {
          score += preference.culturalElements[element] * 0.3;
          reasons.push(`您喜欢${element}文化元素`);
        }
      });
    }
    
    // 根据标签计算分数
    if (challenge.tags) {
      challenge.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.2;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据参与度调整分数
    score += (challenge.participants * 0.02) + (challenge.submissionCount * 0.03);
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: challenge.id,
        type: 'challenge',
        title: challenge.title,
        thumbnail: challenge.featuredImage,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: challenge
      });
    }
  });
  
  // 处理模板推荐
  templates.forEach((template: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据分类计算分数
    if (template.category && preference.categories[template.category]) {
      score += preference.categories[template.category] * 0.4;
      reasons.push(`您喜欢${template.category}类型的模板`);
    }
    
    // 根据标签计算分数
    if (template.tags) {
      template.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.3;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据使用数据调整分数
    score += (template.usageCount || 0) * 0.02;
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: template.id,
        type: 'template',
        title: template.name,
        thumbnail: template.preview,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: template
      });
    }
  });
  
  // 3. 按分数排序并返回前N项
  return recommendedItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取推荐内容
 */
export function getRecommendations(userId: string, limit: number = 20): RecommendedItem[] {
  // 尝试从缓存中获取推荐
  const cacheKey = `${RECOMMENDATIONS_KEY}_${userId}_${limit}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const parsed = JSON.parse(cached);
    // 检查缓存是否过期（1小时）
    if (Date.now() - new Date(parsed.timestamp).getTime() < 3600000) {
      return parsed.recommendations;
    }
  }
  
  // 生成新的推荐
  const recommendations = generateRecommendations(userId, limit);
  
  // 缓存推荐结果
  localStorage.setItem(cacheKey, JSON.stringify({
    recommendations,
    timestamp: new Date().toISOString()
  }));
  
  return recommendations;
}

/**
 * 记录推荐点击
 */
export function recordRecommendationClick(userId: string, item: RecommendedItem): void {
  // 记录点击行为
  recordUserAction({
    userId,
    itemId: item.id,
    itemType: item.type,
    actionType: 'click',
    metadata: item.metadata
  });
  
  // 更新推荐分数（可选）
  // 这里可以实现一个反馈机制，根据用户的点击行为调整推荐算法
}

/**
 * 获取热门内容（基于所有用户的互动数据）
 */
export function getTrendingContent(limit: number = 10): RecommendedItem[] {
  const posts = JSON.parse(localStorage.getItem('jmzf_posts') || '[]');
  const challenges = JSON.parse(localStorage.getItem('jmzf_challenges') || '[]');
  
  const trendingItems: RecommendedItem[] = [];
  
  // 处理热门帖子
  posts.forEach((post: any) => {
    const score = (post.likes * 5) + (post.views * 0.5) + (post.shares * 10) + (post.comments.length * 8);
    trendingItems.push({
      id: post.id,
      type: 'post',
      title: post.title,
      thumbnail: post.thumbnail,
      score,
      reason: '热门内容',
      metadata: post
    });
  });
  
  // 处理热门挑战
  challenges.forEach((challenge: any) => {
    const score = (challenge.participants * 10) + (challenge.submissionCount * 8) + (challenge.views || 0) * 0.5;
    trendingItems.push({
      id: challenge.id,
      type: 'challenge',
      title: challenge.title,
      thumbnail: challenge.featuredImage,
      score,
      reason: '热门挑战',
      metadata: challenge
    });
  });
  
  // 按分数排序并返回前N项
  return trendingItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取相似内容
 */
export function getSimilarContent(itemId: string, itemType: 'post' | 'challenge' | 'template', limit: number = 10): RecommendedItem[] {
  // 这里实现一个简单的相似内容推荐算法
  // 在实际应用中，这应该基于内容相似度计算
  
  // 1. 获取目标项目
  let targetItem: any;
  if (itemType === 'post') {
    const posts = JSON.parse(localStorage.getItem('jmzf_posts') || '[]');
    targetItem = posts.find((p: any) => p.id === itemId);
  } else if (itemType === 'challenge') {
    const challenges = JSON.parse(localStorage.getItem('jmzf_challenges') || '[]');
    targetItem = challenges.find((c: any) => c.id === itemId);
  } else {
    const templates = JSON.parse(localStorage.getItem('jmzf_templates') || '[]');
    targetItem = templates.find((t: any) => t.id === itemId);
  }
  
  if (!targetItem) return [];
  
  // 2. 获取所有可能的相似项目
  let allItems: any[] = [];
  if (itemType === 'post') {
    allItems = JSON.parse(localStorage.getItem('jmzf_posts') || '[]').filter((p: any) => p.id !== itemId);
  } else if (itemType === 'challenge') {
    allItems = JSON.parse(localStorage.getItem('jmzf_challenges') || '[]').filter((c: any) => c.id !== itemId);
  } else {
    allItems = JSON.parse(localStorage.getItem('jmzf_templates') || '[]').filter((t: any) => t.id !== itemId);
  }
  
  // 3. 计算相似度分数
  const similarItems: RecommendedItem[] = [];
  
  allItems.forEach((item: any) => {
    let score = 0;
    
    // 基于标签的相似度
    if (targetItem.tags && item.tags) {
      const commonTags = targetItem.tags.filter((tag: string) => item.tags.includes(tag));
      score += commonTags.length * 3;
    }
    
    // 基于分类的相似度
    if (targetItem.category && item.category && targetItem.category === item.category) {
      score += 5;
    }
    
    // 基于文化元素的相似度
    if (targetItem.culturalElements && item.culturalElements) {
      const commonElements = targetItem.culturalElements.filter((elem: string) => item.culturalElements.includes(elem));
      score += commonElements.length * 2;
    }
    
    // 基于主题的相似度
    if (targetItem.theme && item.theme && targetItem.theme === item.theme) {
      score += 4;
    }
    
    // 基于互动数据的相似度
    if (itemType === 'post') {
      score += (item.likes * 0.1) + (item.views * 0.01);
    } else if (itemType === 'challenge') {
      score += (item.participants * 0.2) + (item.submissionCount * 0.15);
    }
    
    // 只添加相似度大于0的项目
    if (score > 0) {
      similarItems.push({
        id: item.id,
        type: itemType,
        title: itemType === 'post' ? item.title : itemType === 'challenge' ? item.title : item.name,
        thumbnail: itemType === 'post' ? item.thumbnail : itemType === 'challenge' ? item.featuredImage : item.preview,
        score,
        reason: '相似内容',
        metadata: item
      });
    }
  });
  
  // 4. 按相似度排序并返回前N项
  return similarItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 清除用户行为记录
 */
export function clearUserActions(userId?: string): void {
  if (userId) {
    // 只清除特定用户的行为记录
    const actions = getUserActions().filter(action => action.userId !== userId);
    localStorage.setItem(USER_ACTIONS_KEY, JSON.stringify(actions));
  } else {
    // 清除所有用户行为记录
    localStorage.removeItem(USER_ACTIONS_KEY);
  }
}

/**
 * 重置用户偏好
 */
export function resetUserPreferences(userId: string): UserPreference {
  return initializeUserPreferences(userId);
}

// 导出服务对象
export default {
  getUserActions,
  recordUserAction,
  getUserPreferences,
  initializeUserPreferences,
  updateUserPreferences,
  generateRecommendations,
  getRecommendations,
  recordRecommendationClick,
  getTrendingContent,
  getSimilarContent,
  clearUserActions,
  resetUserPreferences
};