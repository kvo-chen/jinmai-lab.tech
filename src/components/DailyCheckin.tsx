import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

// 打卡奖励类型定义
interface CheckinReward {
  day: number;
  name: string;
  description: string;
  icon: string;
  isClaimed: boolean;
  isAvailable: boolean;
}

export default function DailyCheckin() {
  const { isDark } = useTheme();
  
  // 从localStorage读取持久化的打卡数据
  const getInitialData = () => {
    const savedData = localStorage.getItem('dailyCheckin');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Failed to parse saved checkin data:', error);
      }
    }
    // 默认数据
    return {
      currentStreak: 3,
      lastCheckinDate: '2025-11-28',
      rewards: [
        { day: 1, name: '基础素材包', description: '解锁10个基础文化素材', icon: 'gift', isClaimed: true, isAvailable: true },
        { day: 3, name: '高级滤镜', description: '解锁5个AI高级滤镜', icon: 'image', isClaimed: true, isAvailable: true },
        { day: 7, name: '泥人张彩塑工具', description: '解锁泥人张风格专用工具', icon: 'magic', isClaimed: false, isAvailable: true },
        { day: 15, name: '专属AI模型', description: '获得7天专属AI模型使用权', icon: 'robot', isClaimed: false, isAvailable: false },
        { day: 30, name: '老字号联名认证', description: '获得老字号联名创作者认证', icon: 'certificate', isClaimed: false, isAvailable: false },
      ]
    };
  };

  const initialData = getInitialData();
  const [currentStreak, setCurrentStreak] = useState<number>(initialData.currentStreak);
  const [lastCheckinDate, setLastCheckinDate] = useState<string>(initialData.lastCheckinDate);
  const [rewards, setRewards] = useState<CheckinReward[]>(initialData.rewards);
  const [canCheckinToday, setCanCheckinToday] = useState<boolean>(false);

  // 保存打卡数据到localStorage
  const saveCheckinData = (streak: number, date: string, checkinRewards: CheckinReward[]) => {
    const data = {
      currentStreak: streak,
      lastCheckinDate: date,
      rewards: checkinRewards
    };
    localStorage.setItem('dailyCheckin', JSON.stringify(data));
  };

  // 检查今天是否可以打卡
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCanCheckinToday(today !== lastCheckinDate);
  }, [lastCheckinDate]);

  const handleCheckin = () => {
    if (!canCheckinToday) return;

    // 更新打卡状态
    const newStreak = currentStreak + 1;
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否有可领取的奖励
    const newRewards = rewards.map(reward => {
      if (reward.day === newStreak) {
        return { ...reward, isAvailable: true };
      }
      return reward;
    });
    
    // 更新状态
    setCurrentStreak(newStreak);
    setLastCheckinDate(today);
    setCanCheckinToday(false);
    setRewards(newRewards);
    
    // 保存数据到localStorage
    saveCheckinData(newStreak, today, newRewards);

    toast.success(`打卡成功！连续打卡 ${newStreak} 天`);
  };

  const handleClaimReward = (day: number) => {
    const newRewards = rewards.map(reward => {
      if (reward.day === day && reward.isAvailable && !reward.isClaimed) {
        return { ...reward, isClaimed: true };
      }
      return reward;
    });
    
    setRewards(newRewards);
    
    // 保存数据到localStorage
    saveCheckinData(currentStreak, lastCheckinDate, newRewards);

    const reward = rewards.find(r => r.day === day);
    if (reward) {
      toast.success(`恭喜获得：${reward.name}`);
    }
  };

  // 计算进度条百分比
  const progressPercentage = (currentStreak / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">每日打卡</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <i className="fas fa-fire text-yellow-500 mr-1"></i>
          <span>连续 {currentStreak} 天</span>
        </div>
      </div>

      {/* 打卡按钮 */}
      <div className="flex justify-center mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCheckin}
          disabled={!canCheckinToday}
          className={`px-6 py-3 rounded-full flex items-center transition-colors ${
            canCheckinToday
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : isDark
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <i className="fas fa-calendar-check mr-2"></i>
          {canCheckinToday ? '立即打卡' : '今日已打卡'}
        </motion.button>
      </div>

      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>当前进度</span>
          <span>{currentStreak} / 30 天</span>
        </div>
        <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
          ></motion.div>
        </div>
      </div>

      {/* 奖励列表 */}
      <h4 className="font-medium mb-4">打卡奖励</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {rewards.map((reward) => (
          <motion.div
            key={reward.day}
            className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
              reward.isClaimed
                ? `${isDark ? 'border-gray-700 bg-gray-700 opacity-70' : 'border-gray-200 bg-gray-50 opacity-70'}`
                : reward.isAvailable
                ? `${isDark ? 'border-red-500 bg-red-500 bg-opacity-10' : 'border-red-200 bg-red-50'}`
                : `${isDark ? 'border-gray-700' : 'border-gray-200'}`
            }`}
            whileHover={reward.isAvailable && !reward.isClaimed ? { scale: 1.05 } : {}}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              reward.isClaimed
                ? 'bg-gray-600 text-gray-400'
                : reward.isAvailable
                ? 'bg-red-100 text-red-600'
                : isDark
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <i className={`fas fa-${reward.icon} text-xl`}></i>
            </div>
            <h5 className="font-medium mb-1">{reward.name}</h5>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {reward.day} 天
            </p>
            {reward.isAvailable && !reward.isClaimed && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClaimReward(reward.day)}
                className="px-3 py-1 rounded-full bg-red-600 text-white text-xs w-full"
              >
                领取奖励
              </motion.button>
            )}
            {reward.isClaimed && (
              <span className={`px-3 py-1 rounded-full text-xs ${
                isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-600'
              } w-full`}>
                已领取
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}