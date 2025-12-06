import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TianjinImage } from './TianjinStyleComponents';

// 创作者类型定义
interface Creator {
  id: number;
  name: string;
  avatar: string;
  level: string;
  style: string[];
  matchScore: number;
  worksCount: number;
  followers: number;
  isOnline: boolean;
}

// 风格兼容性数据类型定义
interface StyleCompatibilityData {
  name: string;
  compatibility: number;
}

export default function CreativeMatchmaking() {
  const { isDark } = useTheme();
  const [potentialPartners, setPotentialPartners] = useState<Creator[]>([]);
  const [styleCompatibility, setStyleCompatibility] = useState<StyleCompatibilityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  // 模拟加载数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟潜在合作伙伴数据
      setPotentialPartners([
        {
          id: 1,
          name: '创意总监小李',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaoli',
          level: '资深创作者',
          style: ['现代国潮', '插画设计', '品牌设计'],
          matchScore: 92,
          worksCount: 45,
          followers: 1240,
          isOnline: true
        },
        {
          id: 2,
          name: '插画师小陈',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaochen',
          level: '资深创作者',
          style: ['传统插画', '水墨风格', '人物设计'],
          matchScore: 88,
          worksCount: 67,
          followers: 876,
          isOnline: false
        },
        {
          id: 3,
          name: '品牌设计师老王',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20laowang',
          level: '大师级创作者',
          style: ['品牌设计', '包装设计', '视觉识别'],
          matchScore: 85,
          worksCount: 120,
          followers: 2530,
          isOnline: true
        },
        {
          id: 4,
          name: '数字艺术家小张',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaozhang',
          level: '新锐创作者',
          style: ['数字艺术', '3D建模', '互动媒体'],
          matchScore: 82,
          worksCount: 23,
          followers: 345,
          isOnline: true
        }
      ]);

      // 模拟风格兼容性数据
      setStyleCompatibility([
        { name: '国潮设计', compatibility: 95 },
        { name: '传统纹样', compatibility: 88 },
        { name: '现代插画', compatibility: 92 },
        { name: '品牌设计', compatibility: 85 },
        { name: '数字艺术', compatibility: 78 }
      ]);

      setIsLoading(false);
    }, 800);
  }, []);

  const handleViewProfile = (creator: Creator) => {
    setSelectedCreator(creator);
  };

  const handleCloseProfile = () => {
    setSelectedCreator(null);
  };

  const handleSendInvitation = (creatorId: number) => {
    toast.success('合作邀请已发送！');
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className={`h-64 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">创作搭档匹配</h3>
        <button className={`px-4 py-2 rounded-lg text-sm ${
          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}>
          <i className="fas fa-sync-alt mr-1"></i>
          重新匹配
        </button>
      </div>

      {/* 风格兼容性图表 */}
      <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h4 className="font-medium mb-4">风格兼容性分析</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={styleCompatibility}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, '兼容性']}
                contentStyle={{ 
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '0.5rem',
                  color: isDark ? '#ffffff' : '#000000'
                }} 
              />
              <Bar 
                dataKey="compatibility" 
                name="兼容性" 
                fill="#ef4444" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 潜在合作伙伴列表 */}
      <h4 className="font-medium mb-4">潜在创作搭档</h4>
      <div className="space-y-4">
        {potentialPartners.map((creator) => (
          <motion.div
            key={creator.id}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            } transition-all hover:shadow-md`}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <TianjinImage 
                      src={creator.avatar} 
                      alt={creator.name} 
                      ratio="square"
                      fit="cover"
                      className="w-full h-full"
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    creator.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h5 className="font-medium mr-2">{creator.name}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      creator.level === '大师级创作者' 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : creator.level === '资深创作者'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {creator.level}
                    </span>
                    <span className={`ml-2 text-sm ${
                      creator.matchScore > 90 ? 'text-green-500' : 
                      creator.matchScore > 80 ? 'text-blue-500' : 'text-yellow-500'
                    }`}>
                      {creator.matchScore}% 匹配度
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {creator.style.map((style, index) => (
                      <span 
                        key={index} 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex text-xs opacity-70">
                    <span className="mr-3">{creator.worksCount} 作品</span>
                    <span>{creator.followers} 粉丝</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewProfile(creator)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    查看资料
                  </button>
                  <button 
                    onClick={() => handleSendInvitation(creator.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                  >
                    邀请合作
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 创作者详情弹窗 */}
      {selectedCreator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
        >
          <motion.div 
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className="text-xl font-bold">{selectedCreator.name} - 个人资料</h3>
              <button 
                onClick={handleCloseProfile}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                aria-label="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start mb-6">
                <div className="relative mb-4 md:mb-0 md:mr-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <TianjinImage 
                      src={selectedCreator.avatar} 
                      alt={selectedCreator.name} 
                      ratio="square"
                      fit="cover"
                      className="w-full h-full"
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                    selectedCreator.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                </div>
                
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-2">
                    <h2 className="text-2xl font-bold mr-2">{selectedCreator.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCreator.level === '大师级创作者' 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : selectedCreator.level === '资深创作者'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedCreator.level}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {selectedCreator.style.map((style, index) => (
                      <span 
                        key={index} 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-center md:justify-start space-x-6">
                    <div className="text-center">
                      <p className="font-bold">{selectedCreator.worksCount}</p>
                      <p className="text-sm opacity-70">作品</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{selectedCreator.followers}</p>
                      <p className="text-sm opacity-70">粉丝</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{selectedCreator.matchScore}</p>
                      <p className="text-sm opacity-70">匹配度</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 作品预览 */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">代表作品</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <TianjinImage 
                        src={`https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Creative%20work%20example%20${i}`}
                        alt={`作品 ${i}`} 
                        ratio="square"
                        fit="cover"
                        rounded="lg"
                        className="w-full h-full"

                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 技能标签 */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">擅长技能</h4>
                <div className="flex flex-wrap gap-2">
                  {['国潮设计', '传统纹样融合', '品牌视觉', '插画艺术', 'UI设计', '3D建模'].map((skill, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={handleCloseProfile}
                  className={`px-5 py-2.5 rounded-lg transition-colors ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  关闭
                </button>
                <button 
                  onClick={() => handleSendInvitation(selectedCreator.id)}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  邀请合作
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
