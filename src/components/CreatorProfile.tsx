import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { PointsRecord, PointsSourceStats } from '@/services/achievementService';

interface CreatorProfileProps {
  creatorData: {
    level: string;
    levelProgress: number;
    points: number;
    achievements: Array<{
      id: number;
      name: string;
      description: string;
      icon: string;
    }>;
    availableRewards: Array<{
      id: number;
      name: string;
      description: string;
      requirement: string;
    }>;
    tasks: Array<{
      id: number;
      title: string;
      status: 'completed' | 'pending';
      reward: string;
    }>;
    commercialApplications: Array<{
      id: number;
      title: string;
      brand: string;
      status: string;
      date: string;
      revenue?: string;
    }>;
    pointsStats?: {
      currentPoints: number;
      availablePoints: number;
      totalPossiblePoints: number;
      sourceStats: PointsSourceStats;
      recentRecords: PointsRecord[];
    };
  };
  isDark: boolean;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorData, isDark }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const handleClaimReward = (rewardId: number) => {
    toast.success('奖励领取成功！');
  };
  
  const handleViewDetails = (taskId: number) => {
    toast.info('查看任务详情');
  };
  
  const handleViewMoreCommercialOpportunities = () => {
    navigate('/creative-matchmaking');
  };
  
  return (
    <motion.div 
      className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：成就与奖励 */}
        <div className="space-y-6">
          {/* 积分统计 */}
          {creatorData.pointsStats && (
            <div>
              <h3 className="font-medium mb-3">积分统计</h3>
              
              {/* 积分概览 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs opacity-70 mb-1">总积分</p>
                    <p className="text-xl font-bold">{creatorData.pointsStats.currentPoints}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">已获取</p>
                    <p className="text-xl font-bold text-green-600">{creatorData.pointsStats.currentPoints}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">可获取</p>
                    <p className="text-xl font-bold text-yellow-600">{creatorData.pointsStats.availablePoints}</p>
                  </div>
                </div>
              </div>

              {/* 积分来源分布 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                <h4 className="text-sm font-medium mb-3">积分来源</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(creatorData.pointsStats.sourceStats).map(([name, value]) => ({
                          name,
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(creatorData.pointsStats.sourceStats).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} 积分`, name === 'achievement' ? '成就' : name === 'task' ? '任务' : name === 'daily' ? '每日' : '其他']}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-4 mt-2">
                  {Object.entries(creatorData.pointsStats.sourceStats).map(([name, value], index) => (
                    <div key={name} className="flex items-center text-xs">
                      <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index] }}></div>
                      <span>{name === 'achievement' ? '成就' : name === 'task' ? '任务' : name === 'daily' ? '每日' : '其他'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近积分记录 */}
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="text-sm font-medium mb-3">最近获得积分</h4>
                <div className="space-y-3">
                  {creatorData.pointsStats.recentRecords.map((record) => (
                    <div key={record.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <i className={`fas fa-${record.type === 'achievement' ? 'trophy' : record.type === 'task' ? 'check-circle' : record.type === 'daily' ? 'calendar-day' : 'gift'} mr-2 text-xs text-yellow-500`}></i>
                        <div>
                          <p className="font-medium">{record.source}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{record.date}</p>
                        </div>
                      </div>
                      <p className="font-medium text-green-600">+{record.points}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 成就徽章 */}
          <div>
            <h3 className="font-medium mb-3">我的成就</h3>
            <div className="grid grid-cols-2 gap-3">
              {creatorData.achievements.map((achievement) => (
                <motion.div 
                  key={achievement.id}
                  className={`p-3 rounded-lg flex items-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  whileHover={{ y: -3 }}
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
                    <i className={`fas fa-${achievement.icon}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{achievement.name}</p>
                    <p className="text-xs opacity-70">{achievement.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* 可领取奖励 */}
          <div>
            <h3 className="font-medium mb-3">可领取奖励</h3>
            <div className="space-y-3">
              {creatorData.availableRewards.map((reward) => (
                <div 
                  key={reward.id}
                  className={`p-3 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{reward.name}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {reward.description}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      {reward.requirement}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleClaimReward(reward.id)}
                    className="w-full py-1.5 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    立即领取
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 右侧：任务与商业化 */}
        <div className="space-y-6">
          {/* 任务中心 */}
          <div>
            <h3 className="font-medium mb-3">任务中心</h3>
            <div className="space-y-3">
              {creatorData.tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    {task.status === 'completed' ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-xs">{task.id}</span>
                      </div>
                    )}
                    <div>
                      <p className={`text-sm ${task.status === 'completed' ? 'opacity-70' : 'font-medium'}`}>
                        {task.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.reward}
                      </p>
                    </div>
                  </div>
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => handleViewDetails(task.id)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      去完成
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 商业化应用 */}
          <div>
            <h3 className="font-medium mb-3">商业化应用</h3>
            <div className="space-y-3">
              {creatorData.commercialApplications.map((app) => (
                <div 
                  key={app.id}
                  className={`p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{app.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === '已采纳' 
                        ? 'bg-green-100 text-green-600' 
                        : app.status === '洽谈中'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      品牌：{app.brand}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {app.date}
                    </span>
                  </div>
                  {app.revenue && (
                    <div className="text-sm font-medium text-green-600">
                      预估收益：{app.revenue}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={handleViewMoreCommercialOpportunities}
              className="w-full mt-3 py-1.5 rounded-lg text-sm border transition-colors hover:bg-opacity-10"
              style={{
                borderColor: isDark ? '#4B5563' : '#E5E7EB',
                color: isDark ? '#E5E7EB' : '#4B5563'
              }}
            >
              查看更多商业化机会
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorProfile;