import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import checkinService, { CheckinStatus, CheckinRecord } from '@/services/checkinService';
import achievementService from '@/services/achievementService';

interface CheckinCalendarProps {
  userId?: string;
}

const CheckinCalendar: React.FC<CheckinCalendarProps> = ({ userId = 'current-user' }) => {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    todayChecked: false,
    consecutiveDays: 0,
    lastCheckinDate: null,
    totalCheckins: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkinPoints, setCheckinPoints] = useState(0);

  // 获取签到状态和记录
  useEffect(() => {
    const status = checkinService.getCheckinStatus(userId);
    const records = checkinService.getUserCheckinRecords(userId);
    setCheckinStatus(status);
    setCheckinRecords(records);
  }, [userId]);

  // 处理签到
  const handleCheckin = () => {
    try {
      const { record, totalPoints } = checkinService.checkin(userId);
      setCheckinPoints(totalPoints);
      
      // 更新成就服务中的积分记录
      achievementService.pointsRecords.push({
        id: achievementService.pointsRecords.length + 1,
        source: '每日签到',
        type: 'daily',
        points: totalPoints,
        date: new Date().toISOString().split('T')[0],
        description: `连续签到${record.consecutiveDays}天，获得${totalPoints}积分`
      });
      
      // 更新签到状态和记录
      const status = checkinService.getCheckinStatus(userId);
      const records = checkinService.getUserCheckinRecords(userId);
      setCheckinStatus(status);
      setCheckinRecords(records);
    } catch (error) {
      console.error('签到失败:', error);
    }
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 添加前一个月的天数
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(year, month, -i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        isChecked: false
      });
    }
    
    // 添加当前月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dateStr = currentDay.toISOString().split('T')[0];
      const isChecked = checkinRecords.some(record => record.date === dateStr);
      
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        isChecked
      });
    }
    
    // 添加下一个月的天数，使日历有6行
    const remainingDays = 42 - days.length; // 6行 * 7天 = 42天
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isChecked: false
      });
    }
    
    return days;
  };

  // 切换月份
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 获取连续签到奖励
  const getStreakReward = () => {
    const rewards = checkinService.getStreakRewards();
    const nextReward = rewards.find(reward => reward.days > checkinStatus.consecutiveDays);
    return nextReward;
  };

  const calendarDays = generateCalendarDays();
  const nextReward = getStreakReward();

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">每日签到</h2>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {showCalendar ? '隐藏日历' : '查看日历'}
        </button>
      </div>

      {/* 签到信息卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 mb-6`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-sm opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>连续签到</div>
            <div className="text-3xl font-bold mt-1">{checkinStatus.consecutiveDays} 天</div>
          </div>
          <div className="text-right">
            <div className={`text-sm opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总签到次数</div>
            <div className="text-2xl font-bold mt-1">{checkinStatus.totalCheckins}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>最长连续签到</div>
            <div className="text-2xl font-bold mt-1">{checkinStatus.longestStreak} 天</div>
          </div>
        </div>
      </motion.div>

      {/* 签到按钮 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {!checkinStatus.todayChecked ? (
          <button
            onClick={handleCheckin}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            立即签到
          </button>
        ) : (
          <div className={`w-full py-4 rounded-xl font-bold text-lg text-center ${isDark ? 'bg-green-600' : 'bg-green-500'} text-white`}>
            今日已签到
          </div>
        )}
      </motion.div>

      {/* 签到奖励信息 */}
      {!checkinStatus.todayChecked && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 text-center text-sm opacity-70"
        >
          <p>签到可获得 5 积分</p>
          {nextReward && (
            <p className="mt-1">再签到 {nextReward.days - checkinStatus.consecutiveDays} 天，可获得额外 {nextReward.points} 积分</p>
          )}
        </motion.div>
      )}

      {/* 签到成功提示 */}
      {checkinPoints > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mt-4 p-3 rounded-lg text-center ${isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-100'} text-green-500 font-medium`}
        >
          签到成功！获得 {checkinPoints} 积分
        </motion.div>
      )}

      {/* 签到日历 */}
      {showCalendar && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6"
        >
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
            {/* 日历头部 */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth('prev')}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                &lt;
              </button>
              <h3 className="font-bold text-lg">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </h3>
              <button
                onClick={() => changeMonth('next')}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                &gt;
              </button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-center text-sm font-medium opacity-70">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历天数 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} ${!day.isCurrentMonth ? 'opacity-30' : ''} ${day.isChecked ? `${isDark ? 'bg-green-600' : 'bg-green-500'} text-white` : ''}`}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 最近签到记录 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-6"
      >
        <h3 className="font-medium mb-3">最近签到记录</h3>
        <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 max-h-40 overflow-y-auto`}>
          {checkinRecords.slice(0, 5).map(record => (
            <div key={record.id} className="flex justify-between items-center py-2 border-b last:border-b-0 ${isDark ? 'border-gray-600' : 'border-gray-200'}">
              <div>
                <div className="font-medium">{record.date}</div>
                <div className={`text-xs opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {record.isBonus ? '连续签到奖励' : '每日签到'}
                </div>
              </div>
              <div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-500'}`}>
                +{record.points}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckinCalendar;
