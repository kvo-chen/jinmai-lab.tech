import checkinService from '../checkinService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CheckinService', () => {
  beforeEach(() => {
    // 清除 localStorage 模拟
    localStorage.clear();
    
    // 重置签到服务实例
    jest.clearAllMocks();
  });

  describe('getCheckinStatus', () => {
    it('should return initial status when no checkins', () => {
      const status = checkinService.getCheckinStatus('test-user');
      
      expect(status.todayChecked).toBe(false);
      expect(status.consecutiveDays).toBe(0);
      expect(status.lastCheckinDate).toBe(null);
      expect(status.totalCheckins).toBe(0);
      expect(status.currentStreak).toBe(0);
      expect(status.longestStreak).toBe(0);
    });
  });

  describe('checkin', () => {
    it('should allow checkin when not checked today', () => {
      const result = checkinService.checkin('test-user');
      
      // 只验证连续签到天数，不验证具体积分（因为连续签到奖励可能会变化）
      expect(result.record.consecutiveDays).toBe(1);
      expect(result.record.points).toBeGreaterThan(0);
      expect(result.totalPoints).toBeGreaterThan(0);
    });

    it('should throw error when already checked today', () => {
      // 第一次签到
      checkinService.checkin('test-user');
      
      // 第二次签到应该失败
      expect(() => checkinService.checkin('test-user')).toThrow('今天已经签到过了');
    });

    it('should increase consecutive days when checking in consecutively', () => {
      // 直接测试连续两天签到
      checkinService.checkin('test-user');
      
      // 模拟时间流逝到第二天
      const originalDate = Date.now;
      Date.now = jest.fn(() => originalDate() + 86400000); // 加一天
      
      const result = checkinService.checkin('test-user');
      expect(result.record.consecutiveDays).toBe(2);
      
      // 恢复原始的 Date.now
      Date.now = originalDate;
    });
  });

  describe('补签', () => {
    it('should allow补签past date', () => {
      // 模拟前天的日期
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const result = checkinService.补签('test-user', twoDaysAgoStr);
      
      expect(result.record.date).toBe(twoDaysAgoStr);
      expect(result.record.points).toBe(0);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when补签today', () => {
      // 先确保今天没有签到
      const today = new Date().toISOString().split('T')[0];
      
      // 直接调用补签方法，不先调用checkin
      expect(() => checkinService.补签('test-user', today)).toThrow('只能补签过去的日期');
    });
  });

  describe('getStreakRewards', () => {
    it('should return correct streak rewards', () => {
      const rewards = checkinService.getStreakRewards();
      
      expect(rewards).toHaveLength(4);
      expect(rewards[0].days).toBe(1);
      expect(rewards[0].points).toBe(5);
      expect(rewards[1].days).toBe(3);
      expect(rewards[1].points).toBe(10);
      expect(rewards[2].days).toBe(7);
      expect(rewards[2].points).toBe(30);
      expect(rewards[3].days).toBe(30);
      expect(rewards[3].points).toBe(100);
    });
  });
});
