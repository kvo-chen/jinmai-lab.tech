/**
 * 积分管理服务 - 提供积分的获取、消耗和记录功能
 */

// 导入成就服务
import achievementService from './achievementService';

// 积分来源类型
export type PointsSource = 'achievement' | 'task' | 'daily' | 'consumption' | 'exchange' | 'system';

// 积分记录类型定义
export interface PointsRecord {
  id: number;
  source: string;
  type: PointsSource;
  points: number;
  date: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
}

// 积分变动类型
export interface PointsChange {
  id: number;
  source: string;
  type: PointsSource;
  points: number;
  date: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
}

// 积分管理服务类
class PointsService {
  private readonly POINTS_RECORD_KEY = 'SECURE_POINTS_RECORDS';
  private pointsRecords: PointsChange[] = [];
  private currentPoints: number = 0;
  private cache: { [key: string]: any } = {};
  private readonly CACHE_KEYS = ['currentPoints', 'pointsRecords'];

  constructor() {
    this.loadPointsRecords();
    this.calculateCurrentPoints();
  }

  /**
   * 从本地存储加载积分记录
   */
  private loadPointsRecords() {
    try {
      const stored = localStorage.getItem(this.POINTS_RECORD_KEY);
      if (stored) {
        this.pointsRecords = JSON.parse(stored);
      } else {
        // 初始化默认积分记录
        this.pointsRecords = [
          {
            id: 1,
            source: '系统初始化',
            type: 'system',
            points: 0,
            date: new Date().toISOString().split('T')[0],
            description: '初始积分',
            balanceAfter: 0
          }
        ];
        this.savePointsRecords();
      }
    } catch (error) {
      console.error('Failed to load points records:', error);
      this.pointsRecords = [];
    }
  }

  /**
   * 保存积分记录到本地存储
   */
  private savePointsRecords() {
    try {
      localStorage.setItem(this.POINTS_RECORD_KEY, JSON.stringify(this.pointsRecords));
    } catch (error) {
      console.error('Failed to save points records:', error);
    }
  }

  /**
   * 计算当前积分
   */
  private calculateCurrentPoints() {
    this.currentPoints = this.pointsRecords.reduce((total, record) => total + record.points, 0);
    this.cache['currentPoints'] = this.currentPoints;
  }

  /**
   * 获取当前积分
   */
  getCurrentPoints(): number {
    // 从缓存获取，提升性能
    if (this.cache['currentPoints'] !== undefined) {
      return this.cache['currentPoints'];
    }
    
    this.calculateCurrentPoints();
    return this.currentPoints;
  }

  /**
   * 获取积分记录
   */
  getPointsRecords(filter?: {
    startDate?: string;
    endDate?: string;
    type?: PointsSource;
    search?: string;
  }, limit: number = 20, offset: number = 0): PointsChange[] {
    let filteredRecords = [...this.pointsRecords];
    
    if (filter) {
      // 按时间范围筛选
      if (filter.startDate) {
        const startDate = filter.startDate;
        filteredRecords = filteredRecords.filter(record => record.date >= startDate);
      }
      
      if (filter.endDate) {
        const endDate = filter.endDate;
        filteredRecords = filteredRecords.filter(record => record.date <= endDate);
      }
      
      // 按类型筛选
      if (filter.type) {
        filteredRecords = filteredRecords.filter(record => record.type === filter.type);
      }
      
      // 按关键词搜索
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.source.toLowerCase().includes(searchLower) ||
          record.description.toLowerCase().includes(searchLower)
        );
      }
    }
    
    // 排序并分页
    return filteredRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
  }

  /**
   * 获取最近积分记录
   */
  getRecentPointsRecords(limit: number = 5): PointsChange[] {
    // 使用缓存提升性能
    const cacheKey = `recentRecords_${limit}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    const records = this.getPointsRecords(undefined, limit);
    this.cache[cacheKey] = records;
    return records;
  }

  /**
   * 添加积分
   */
  addPoints(points: number, source: string, type: PointsSource, description: string, relatedId?: string): PointsChange {
    const newRecord: PointsChange = {
      id: this.pointsRecords.length + 1,
      source,
      type,
      points,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId,
      balanceAfter: this.currentPoints + points
    };
    
    this.pointsRecords.push(newRecord);
    this.calculateCurrentPoints();
    this.savePointsRecords();
    
    // 清除相关缓存
    this.clearCache();
    
    return newRecord;
  }

  /**
   * 消耗积分
   */
  consumePoints(points: number, source: string, type: PointsSource, description: string, relatedId?: string): PointsChange {
    if (points > this.currentPoints) {
      throw new Error('积分不足');
    }
    
    const newRecord: PointsChange = {
      id: this.pointsRecords.length + 1,
      source,
      type,
      points: -points,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId,
      balanceAfter: this.currentPoints - points
    };
    
    this.pointsRecords.push(newRecord);
    this.calculateCurrentPoints();
    this.savePointsRecords();
    
    // 清除相关缓存
    this.clearCache();
    
    return newRecord;
  }

  /**
   * 与成就服务同步积分记录
   */
  private syncWithAchievementService() {
    // 更新成就服务中的积分记录
    achievementService.pointsRecords = this.pointsRecords.map(record => ({
      id: record.id,
      source: record.source,
      type: record.type,
      points: record.points,
      date: record.date,
      description: record.description,
      relatedId: record.relatedId,
      balanceAfter: record.balanceAfter
    }));
  }

  /**
   * 获取积分来源统计
   */
  getPointsSourceStats() {
    // 使用缓存提升性能
    if (this.cache['pointsSourceStats']) {
      return this.cache['pointsSourceStats'];
    }
    
    const stats = {
      achievement: 0,
      task: 0,
      daily: 0,
      consumption: 0,
      exchange: 0,
      other: 0
    };

    this.pointsRecords.forEach(record => {
      // 将'system'类型映射到'other'
      const statKey = record.type in stats ? record.type : 'other';
      stats[statKey as keyof typeof stats] += record.points;
    });
    
    this.cache['pointsSourceStats'] = stats;
    return stats;
  }

  /**
   * 清除缓存
   */
  private clearCache(keys?: string[]) {
    if (keys) {
      keys.forEach(key => {
        delete this.cache[key];
      });
    } else {
      this.CACHE_KEYS.forEach(key => {
        delete this.cache[key];
      });
    }
  }

  /**
   * 重置缓存
   */
  resetCache() {
    this.cache = {};
  }
}

// 导出单例实例
const service = new PointsService();
export default service;
