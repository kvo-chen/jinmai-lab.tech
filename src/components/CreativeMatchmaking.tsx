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
  bio: string;
  location: string;
  joinDate: string;
  specialties: string[];
  avgResponseTime: string;
}

// 邀请状态类型
type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'sent';

// 邀请历史记录类型
interface InvitationHistory {
  id: number;
  creatorId: number;
  creatorName: string;
  status: InvitationStatus;
  sentAt: Date;
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
  // 邀请状态管理
  const [invitationStatus, setInvitationStatus] = useState<Record<number, InvitationStatus>>({});
  // 邀请历史记录
  const [invitationHistory, setInvitationHistory] = useState<InvitationHistory[]>([]);

  // 生成随机匹配数据
  const generateMatchData = () => {
    // 生成随机ID
    const generateId = () => Math.floor(Math.random() * 10000) + 1;
    
    // 模拟潜在合作伙伴数据
    const partners = [
      {
        id: generateId(),
        name: '创意总监小李',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaoli',
        level: '资深创作者',
        style: ['现代国潮', '插画设计', '品牌设计'],
        matchScore: Math.floor(Math.random() * 10) + 85, // 85-95之间的随机数
        worksCount: Math.floor(Math.random() * 100) + 30,
        followers: Math.floor(Math.random() * 2000) + 500,
        isOnline: Math.random() > 0.3, // 70%在线率
        bio: '专注于现代国潮设计，擅长将传统元素与现代设计相结合，创造出具有独特风格的作品。',
        location: '北京',
        joinDate: '2023-01-15',
        specialties: ['国潮设计', '品牌视觉', '插画创作'],
        avgResponseTime: '1小时内'
      },
      {
        id: generateId(),
        name: '插画师小陈',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaochen',
        level: '资深创作者',
        style: ['传统插画', '水墨风格', '人物设计'],
        matchScore: Math.floor(Math.random() * 10) + 80, // 80-90之间的随机数
        worksCount: Math.floor(Math.random() * 150) + 50,
        followers: Math.floor(Math.random() * 1500) + 300,
        isOnline: Math.random() > 0.3, // 70%在线率
        bio: '擅长传统水墨风格插画，作品富有诗意和文化内涵，多次获得国内外插画奖项。',
        location: '上海',
        joinDate: '2022-08-20',
        specialties: ['水墨插画', '传统纹样', '人物设计'],
        avgResponseTime: '2小时内'
      },
      {
        id: generateId(),
        name: '品牌设计师老王',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20laowang',
        level: '大师级创作者',
        style: ['品牌设计', '包装设计', '视觉识别'],
        matchScore: Math.floor(Math.random() * 10) + 82, // 82-92之间的随机数
        worksCount: Math.floor(Math.random() * 200) + 80,
        followers: Math.floor(Math.random() * 3000) + 1000,
        isOnline: Math.random() > 0.3, // 70%在线率
        bio: '拥有15年品牌设计经验，服务过众多知名企业，擅长打造具有市场影响力的品牌形象。',
        location: '广州',
        joinDate: '2021-03-10',
        specialties: ['品牌设计', '包装设计', 'VI设计'],
        avgResponseTime: '30分钟内'
      },
      {
        id: generateId(),
        name: '数字艺术家小张',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20xiaozhang',
        level: '新锐创作者',
        style: ['数字艺术', '3D建模', '互动媒体'],
        matchScore: Math.floor(Math.random() * 10) + 78, // 78-88之间的随机数
        worksCount: Math.floor(Math.random() * 80) + 10,
        followers: Math.floor(Math.random() * 1000) + 200,
        isOnline: Math.random() > 0.3, // 70%在线率
        bio: '年轻的数字艺术家，擅长使用前沿技术创作沉浸式数字艺术作品，风格独特前卫。',
        location: '深圳',
        joinDate: '2023-06-05',
        specialties: ['数字艺术', '3D建模', '互动媒体'],
        avgResponseTime: '3小时内'
      }
    ];

    // 模拟风格兼容性数据
    const compatibility = [
      { name: '国潮设计', compatibility: Math.floor(Math.random() * 20) + 80 }, // 80-100之间的随机数
      { name: '传统纹样', compatibility: Math.floor(Math.random() * 25) + 75 }, // 75-100之间的随机数
      { name: '现代插画', compatibility: Math.floor(Math.random() * 15) + 85 }, // 85-100之间的随机数
      { name: '品牌设计', compatibility: Math.floor(Math.random() * 20) + 75 }, // 75-95之间的随机数
      { name: '数字艺术', compatibility: Math.floor(Math.random() * 25) + 70 } // 70-95之间的随机数
    ];

    return { partners, compatibility };
  };

  // 加载匹配数据
  const loadMatchData = () => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const { partners, compatibility } = generateMatchData();
      setPotentialPartners(partners);
      setStyleCompatibility(compatibility);
      setIsLoading(false);
    }, 800);
  };

  // 初始加载数据
  useEffect(() => {
    loadMatchData();
  }, []);

  // 重新匹配功能
  const handleRematch = () => {
    loadMatchData();
    toast.info('正在寻找新的创作搭档...');
  };

  const handleViewProfile = (creator: Creator) => {
    setSelectedCreator(creator);
  };

  const handleCloseProfile = () => {
    setSelectedCreator(null);
  };

  const handleSendInvitation = (creatorId: number) => {
    // 发送邀请
    setInvitationStatus(prev => ({
      ...prev,
      [creatorId]: 'sent'
    }));
    
    toast.success('合作邀请已发送！');
    
    // 模拟邀请状态变化（2秒后随机变为接受或拒绝）
    setTimeout(() => {
      const randomStatus = Math.random() > 0.5 ? 'accepted' : 'rejected';
      setInvitationStatus(prev => ({
        ...prev,
        [creatorId]: randomStatus
      }));
      
      if (randomStatus === 'accepted') {
        toast.success('合作邀请已被接受！');
      } else {
        toast.info('合作邀请已被拒绝');
      }
    }, 2000);
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
        <button 
          onClick={handleRematch}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          <i className={`fas fa-sync-alt mr-1 ${isLoading ? 'animate-spin' : ''}`}></i>
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
                    className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  >
                    查看资料
                  </button>
                  {invitationStatus[creator.id] === 'sent' && (
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm transition-colors cursor-not-allowed"
                      disabled
                    >
                      邀请已发送
                    </button>
                  )}
                  {invitationStatus[creator.id] === 'accepted' && (
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors cursor-not-allowed"
                      disabled
                    >
                      邀请已接受
                    </button>
                  )}
                  {invitationStatus[creator.id] === 'rejected' && (
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm transition-colors cursor-not-allowed"
                      disabled
                    >
                      邀请已拒绝
                    </button>
                  )}
                  {!invitationStatus[creator.id] && (
                    <button 
                      onClick={() => handleSendInvitation(creator.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                    >
                      邀请合作
                    </button>
                  )}
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
                  <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${selectedCreator.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                </div>
                
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-2">
                    <h2 className="text-2xl font-bold mr-2">{selectedCreator.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCreator.level === '大师级创作者' ? 'bg-yellow-100 text-yellow-600' : selectedCreator.level === '资深创作者' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {selectedCreator.level}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {selectedCreator.style.map((style, index) => (
                      <span 
                        key={index} 
                        className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
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

              {/* 创作者简介 */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">个人简介</h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedCreator.bio}
                </p>
              </div>

              {/* 基本信息 */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-4">基本信息</h4>
                  <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-gray-500"></i>
                      <span className="text-sm">{selectedCreator.location}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-calendar-alt mr-2 text-gray-500"></i>
                      <span className="text-sm">加入时间: {selectedCreator.joinDate}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-clock mr-2 text-gray-500"></i>
                      <span className="text-sm">平均响应时间: {selectedCreator.avgResponseTime}</span>
                    </div>
                  </div>
                </div>

                {/* 特长标签 */}
                <div>
                  <h4 className="font-medium mb-4">擅长领域</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreator.specialties.map((skill, index) => (
                      <span 
                        key={index} 
                        className={`px-3 py-1.5 rounded-full text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        {skill}
                      </span>
                    ))}
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
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={handleCloseProfile}
                  className={`px-5 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  关闭
                </button>
                {invitationStatus[selectedCreator.id] === 'sent' && (
                  <button 
                    className="px-5 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors cursor-not-allowed"
                    disabled
                  >
                    邀请已发送
                  </button>
                )}
                {invitationStatus[selectedCreator.id] === 'accepted' && (
                  <button 
                    className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors cursor-not-allowed"
                    disabled
                  >
                    已接受邀请
                  </button>
                )}
                {invitationStatus[selectedCreator.id] === 'rejected' && (
                  <button 
                    className="px-5 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors cursor-not-allowed"
                    disabled
                  >
                    已拒绝邀请
                  </button>
                )}
                {!invitationStatus[selectedCreator.id] && (
                  <button 
                    onClick={() => handleSendInvitation(selectedCreator.id)}
                    className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    邀请合作
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
