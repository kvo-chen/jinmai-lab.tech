/**
 * 成就服务模块 - 提供创作成就相关功能
 */

// 创作者等级类型定义
export interface CreatorLevel {
  level: number;
  name: string;
  icon: string;
  requiredPoints: number;
 权益: string[];
  description: string;
}

// 成就类型定义
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  points: number; // 成就对应的积分
}

// 创作者等级信息
export interface CreatorLevelInfo {
  currentLevel: CreatorLevel;
  nextLevel: CreatorLevel | null;
  currentPoints: number;
  pointsToNextLevel: number;
  levelProgress: number; // 0-100%
}

// 积分记录类型定义
export interface PointsRecord {
  id: number;
  source: string;
  type: 'achievement' | 'task' | 'daily' | 'other';
  points: number;
  date: string;
  description: string;
}

// 积分来源统计类型定义
export interface PointsSourceStats {
  achievement: number;
  task: number;
  daily: number;
  other: number;
}

// 成就服务类
class AchievementService {
  // 创作者等级数据
  private creatorLevels: CreatorLevel[] = [
    { level: 1, name: '创作新手', icon: '🌱', requiredPoints: 0, 权益: ['基础创作工具', '作品发布权限', '社区评论权限'], description: '刚刚开始创作之旅的新手' },
    { level: 2, name: '创作爱好者', icon: '✏️', requiredPoints: 100, 权益: ['高级创作工具', '模板库访问', '作品打赏权限'], description: '热爱创作的积极用户' },
    { level: 3, name: '创作达人', icon: '🌟', requiredPoints: 300, 权益: ['AI创意助手', '专属客服支持', '作品推广机会'], description: '创作能力突出的达人' },
    { level: 4, name: '创作大师', icon: '🎨', requiredPoints: 800, 权益: ['限量模板使用权', '线下活动邀请', '品牌合作机会'], description: '创作领域的大师级人物' },
    { level: 5, name: '创作传奇', icon: '👑', requiredPoints: 2000, 权益: ['平台荣誉认证', '定制化创作工具', 'IP孵化支持'], description: '创作界的传奇人物' }
  ];

  // 模拟成就数据
  private achievements: Achievement[] = [
    {
      id: 1,
      name: '初次创作',
      description: '完成第一篇创作作品',
      icon: 'star',
      rarity: 'common',
      criteria: '完成1篇作品',
      progress: 100,
      isUnlocked: true,
      unlockedAt: '2025-11-01',
      points: 10
    },
    {
      id: 2,
      name: '活跃创作者',
      description: '连续7天登录平台',
      icon: 'fire',
      rarity: 'common',
      criteria: '连续登录7天',
      progress: 100,
      isUnlocked: true,
      unlockedAt: '2025-11-07',
      points: 20
    },
    {
      id: 3,
      name: '人气王',
      description: '获得100个点赞',
      icon: 'thumbs-up',
      rarity: 'rare',
      criteria: '获得100个点赞',
      progress: 32,
      isUnlocked: false,
      points: 50
    },
    {
      id: 4,
      name: '文化传播者',
      description: '使用5种不同文化元素',
      icon: 'book',
      rarity: 'rare',
      criteria: '使用5种不同文化元素',
      progress: 60,
      isUnlocked: false,
      points: 40
    },
    {
      id: 5,
      name: '作品达人',
      description: '发布10篇作品',
      icon: 'image',
      rarity: 'rare',
      criteria: '发布10篇作品',
      progress: 30,
      isUnlocked: false,
      points: 80
    },
    {
      id: 6,
      name: '商业成功',
      description: '作品被品牌采纳',
      icon: 'handshake',
      rarity: 'epic',
      criteria: '作品被品牌采纳1次',
      progress: 0,
      isUnlocked: false,
      points: 200
    },
    {
      id: 7,
      name: '传统文化大师',
      description: '精通传统文化知识',
      icon: 'graduation-cap',
      rarity: 'legendary',
      criteria: '完成10个文化知识问答',
      progress: 0,
      isUnlocked: false,
      points: 300
    }
  ];

  // 模拟积分记录数据
  private pointsRecords: PointsRecord[] = [
    {
      id: 1,
      source: '初次创作',
      type: 'achievement',
      points: 10,
      date: '2025-11-01',
      description: '完成第一篇创作作品'
    },
    {
      id: 2,
      source: '活跃创作者',
      type: 'achievement',
      points: 20,
      date: '2025-11-07',
      description: '连续登录7天'
    },
    {
      id: 3,
      source: '完成新手引导',
      type: 'task',
      points: 50,
      date: '2025-11-01',
      description: '完成平台新手引导'
    },
    {
      id: 4,
      source: '发布第一篇作品',
      type: 'task',
      points: 100,
      date: '2025-11-01',
      description: '在平台发布第一篇作品'
    },
    {
      id: 5,
      source: '每日签到',
      type: 'daily',
      points: 5,
      date: '2025-11-08',
      description: '每日签到奖励'
    }
  ];

  // 模拟用户积分数据
  private userPoints: number = 0;

  // 获取所有成就
  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  // 获取已解锁的成就
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => achievement.isUnlocked);
  }

  // 获取未解锁的成就
  getLockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => !achievement.isUnlocked);
  }

  // 获取单个成就
  getAchievementById(id: number): Achievement | undefined {
    return this.achievements.find(achievement => achievement.id === id);
  }

  // 更新成就进度
  updateAchievementProgress(id: number, progress: number): boolean {
    const achievement = this.getAchievementById(id);
    if (achievement && !achievement.isUnlocked) {
      achievement.progress = Math.min(progress, 100);
      
      // 如果进度达到100%，解锁成就
      if (achievement.progress >= 100) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date().toISOString().split('T')[0];
        return true;
      }
    }
    return false;
  }

  // 批量更新成就进度
  updateMultipleAchievements(updates: Array<{id: number, progress: number}>): Array<number> {
    const newlyUnlocked: Array<number> = [];
    
    updates.forEach(update => {
      const unlocked = this.updateAchievementProgress(update.id, update.progress);
      if (unlocked) {
        newlyUnlocked.push(update.id);
      }
    });
    
    return newlyUnlocked;
  }

  // 获取成就统计信息
  getAchievementStats(): {
    total: number;
    unlocked: number;
    locked: number;
    completionRate: number;
    recentUnlocks: Achievement[];
  } {
    const unlocked = this.getUnlockedAchievements();
    
    return {
      total: this.achievements.length,
      unlocked: unlocked.length,
      locked: this.achievements.length - unlocked.length,
      completionRate: Math.round((unlocked.length / this.achievements.length) * 100),
      recentUnlocks: unlocked
        .sort((a, b) => new Date(b.unlockedAt || '').getTime() - new Date(a.unlockedAt || '').getTime())
        .slice(0, 3)
    };
  }

  // 获取成就稀有度分布
  getRarityDistribution(): {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  } {
    const distribution = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    this.achievements.forEach(achievement => {
      distribution[achievement.rarity]++;
    });
    
    return distribution;
  }

  // 计算用户总积分
  calculateUserPoints(): number {
    // 计算已解锁成就的总积分
    const unlockedAchievements = this.getUnlockedAchievements();
    this.userPoints = unlockedAchievements.reduce((total, achievement) => total + achievement.points, 0);
    return this.userPoints;
  }

  // 获取创作者等级信息
  getCreatorLevelInfo(): CreatorLevelInfo {
    const currentPoints = this.calculateUserPoints();
    
    // 找到当前等级和下一个等级
    let currentLevel: CreatorLevel = this.creatorLevels[0];
    let nextLevel: CreatorLevel | null = null;
    
    for (let i = 0; i < this.creatorLevels.length; i++) {
      if (currentPoints >= this.creatorLevels[i].requiredPoints) {
        currentLevel = this.creatorLevels[i];
        if (i < this.creatorLevels.length - 1) {
          nextLevel = this.creatorLevels[i + 1];
        } else {
          nextLevel = null;
        }
      } else {
        break;
      }
    }
    
    // 计算升级进度
    let pointsToNextLevel = 0;
    let levelProgress = 0;
    
    if (nextLevel) {
      pointsToNextLevel = nextLevel.requiredPoints - currentPoints;
      const levelRange = nextLevel.requiredPoints - currentLevel.requiredPoints;
      levelProgress = Math.min(100, Math.round(((currentPoints - currentLevel.requiredPoints) / levelRange) * 100));
    } else {
      pointsToNextLevel = 0;
      levelProgress = 100;
    }
    
    return {
      currentLevel,
      nextLevel,
      currentPoints,
      pointsToNextLevel,
      levelProgress
    };
  }

  // 获取所有创作者等级
  getAllCreatorLevels(): CreatorLevel[] {
    return [...this.creatorLevels];
  }

  // 获取单个创作者等级
  getCreatorLevelByLevel(level: number): CreatorLevel | undefined {
    return this.creatorLevels.find(levelInfo => levelInfo.level === level);
  }

  // 根据积分获取创作者等级
  getCreatorLevelByPoints(points: number): CreatorLevel {
    let level = this.creatorLevels[0];
    
    for (const levelInfo of this.creatorLevels) {
      if (points >= levelInfo.requiredPoints) {
        level = levelInfo;
      }
    }
    
    return level;
  }

  // 获取积分来源统计
  getPointsSourceStats(): PointsSourceStats {
    const stats = {
      achievement: 0,
      task: 0,
      daily: 0,
      other: 0
    };

    this.pointsRecords.forEach(record => {
      stats[record.type] += record.points;
    });

    return stats;
  }

  // 获取最近积分记录
  getRecentPointsRecords(limit: number = 5): PointsRecord[] {
    return [...this.pointsRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // 计算可获取的积分
  calculateAvailablePoints(): number {
    // 计算未解锁成就的积分
    const lockedAchievementsPoints = this.achievements
      .filter(achievement => !achievement.isUnlocked)
      .reduce((total, achievement) => total + achievement.points, 0);

    // 模拟任务可获取积分
    const availableTaskPoints = 300; // 邀请好友150 + 参与主题活动200

    // 模拟每日可获取积分（假设每天5分）
    const dailyPoints = 5;

    return lockedAchievementsPoints + availableTaskPoints + dailyPoints;
  }

  // 获取积分统计信息
  getPointsStats() {
    const currentPoints = this.calculateUserPoints();
    const availablePoints = this.calculateAvailablePoints();
    const totalPossiblePoints = currentPoints + availablePoints;
    const sourceStats = this.getPointsSourceStats();
    const recentRecords = this.getRecentPointsRecords();

    return {
      currentPoints,
      availablePoints,
      totalPossiblePoints,
      sourceStats,
      recentRecords
    };
  }
}

// 导出单例实例
export default new AchievementService();