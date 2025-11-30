/**
 * 成就服务模块 - 提供创作成就相关功能
 */

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
}

// 成就服务类
class AchievementService {
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
      unlockedAt: '2025-11-01'
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
      unlockedAt: '2025-11-07'
    },
    {
      id: 3,
      name: '人气王',
      description: '获得100个点赞',
      icon: 'thumbs-up',
      rarity: 'rare',
      criteria: '获得100个点赞',
      progress: 32,
      isUnlocked: false
    },
    {
      id: 4,
      name: '文化传播者',
      description: '使用5种不同文化元素',
      icon: 'book',
      rarity: 'rare',
      criteria: '使用5种不同文化元素',
      progress: 60,
      isUnlocked: false
    },
    {
      id: 5,
      name: '作品达人',
      description: '发布10篇作品',
      icon: 'image',
      rarity: 'rare',
      criteria: '发布10篇作品',
      progress: 30,
      isUnlocked: false
    },
    {
      id: 6,
      name: '商业成功',
      description: '作品被品牌采纳',
      icon: 'handshake',
      rarity: 'epic',
      criteria: '作品被品牌采纳1次',
      progress: 0,
      isUnlocked: false
    },
    {
      id: 7,
      name: '传统文化大师',
      description: '精通传统文化知识',
      icon: 'graduation-cap',
      rarity: 'legendary',
      criteria: '完成10个文化知识问答',
      progress: 0,
      isUnlocked: false
    }
  ];

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
}

// 导出单例实例
export default new AchievementService();