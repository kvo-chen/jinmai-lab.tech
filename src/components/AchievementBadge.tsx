import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface AchievementBadgeProps {
  level: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ level }) => {
  const { isDark } = useTheme();
  
  // 根据等级确定徽章样式
  const getBadgeStyle = () => {
    switch(level) {
      case '新锐创作者':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          icon: 'star'
        };
      case '资深创作者':
        return {
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-200',
          icon: 'award'
        };
      case '大师级创作者':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          icon: 'trophy'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          icon: 'user'
        };
    }
  };
  
  const badgeStyle = getBadgeStyle();
  
  return (
    <motion.div 
      className={`text-xs flex items-center px-2 py-0.5 rounded-full border ${badgeStyle.bgColor} ${badgeStyle.textColor} ${badgeStyle.borderColor}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <i className={`fas fa-${badgeStyle.icon} mr-1 text-xs`}></i>
      {level}
    </motion.div>
  );
};

export default AchievementBadge;