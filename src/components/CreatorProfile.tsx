import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
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