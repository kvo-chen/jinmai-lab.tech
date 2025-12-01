import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// IP孵化阶段类型定义
interface IPStage {
  id: number;
  name: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

// 商业化机会类型定义
interface CommercialOpportunity {
  id: number;
  name: string;
  description: string;
  brand: string;
  reward: string;
  status: 'open' | 'matched' | 'closed';
  image: string;
}

// 版权资产类型定义
interface CopyrightAsset {
  id: number;
  name: string;
  thumbnail: string;
  type: string;
  createdAt: string;
  status: string;
  canLicense: boolean;
}

export default function IPIncubationCenter() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'incubation' | 'opportunities' | 'copyright'>('incubation');
  const [ipStages, setIpStages] = useState<IPStage[]>([
    { id: 1, name: '创意设计', description: '完成原创设计作品', icon: 'palette', completed: true, active: false },
    { id: 2, name: '版权存证', description: '完成作品版权存证', icon: 'shield-alt', completed: true, active: false },
    { id: 3, name: 'IP孵化', description: '将设计转化为IP资产', icon: 'gem', completed: false, active: true },
    { id: 4, name: '商业合作', description: '对接品牌合作机会', icon: 'handshake', completed: false, active: false },
    { id: 5, name: '收益分成', description: '获得作品收益分成', icon: 'coins', completed: false, active: false }
  ]);
  
  const [commercialOpportunities, setCommercialOpportunities] = useState<CommercialOpportunity[]>([]);
  const [copyrightAssets, setCopyrightAssets] = useState<CopyrightAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 模拟加载数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟商业化机会数据
      setCommercialOpportunities([
        {
          id: 1,
          name: '国潮包装设计',
          description: '为老字号食品品牌设计国潮风格包装',
          brand: '桂发祥',
          reward: '¥15,000',
          status: 'open',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20brand%20packaging%20design%20opportunity'
        },
        {
          id: 2,
          name: '文创产品开发',
          description: '设计传统文化元素文创产品系列',
          brand: '杨柳青画社',
          reward: '¥20,000',
          status: 'open',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Cultural%20creative%20product%20development'
        },
        {
          id: 3,
          name: '数字藏品创作',
          description: '创作基于传统纹样的数字藏品系列',
          brand: '数字艺术馆',
          reward: '分成模式',
          status: 'matched',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Digital%20collectibles%20creation%20opportunity'
        }
      ]);

      // 模拟版权资产数据
      setCopyrightAssets([
        {
          id: 1,
          name: '国潮插画系列',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Copyrighted%20artwork%20example%201',
          type: '插画',
          createdAt: '2025-11-01',
          status: '已存证',
          canLicense: true
        },
        {
          id: 2,
          name: '传统纹样创新',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Copyrighted%20artwork%20example%202',
          type: '纹样',
          createdAt: '2025-10-25',
          status: '已授权',
          canLicense: false
        },
        {
          id: 3,
          name: '老字号品牌视觉',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Copyrighted%20artwork%20example%203',
          type: '品牌设计',
          createdAt: '2025-10-15',
          status: '已存证',
          canLicense: true
        }
      ]);

      setIsLoading(false);
    }, 800);
  }, []);

  const handleApplyOpportunity = (opportunityId: number) => {
    toast.success('已申请商业机会，等待品牌方审核');
  };

  const handleLicenseAsset = (assetId: number) => {
    toast.success('版权授权申请已提交');
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className={`h-32 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                  ))}
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
        <h3 className="text-xl font-bold">IP孵化中心</h3>
        <button className={`px-4 py-2 rounded-lg text-sm ${
          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}>
          <i className="fas fa-plus mr-1"></i>
          提交作品
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-3 mb-6 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'incubation', name: 'IP孵化路径' },
          { id: 'opportunities', name: '商业机会' },
          { id: 'copyright', name: '版权资产' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'incubation' | 'opportunities' | 'copyright')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-red-600 text-white shadow-md' 
                : isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* IP孵化路径 */}
      {activeTab === 'incubation' && (
        <div>
          {/* 孵化进度 */}
          <div className="mb-8">
            <h4 className="font-medium mb-4">孵化进度</h4>
            <div className="relative">
              {/* 进度线 */}
              <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '40%' }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>

              {/* 进度节点 */}
              <div className="flex justify-between relative z-10">
                {ipStages.map((stage, index) => (
                  <motion.div
                    key={stage.id}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 relative z-10 ${
                        stage.completed
                          ? 'bg-green-500 text-white'
                          : stage.active
                            ? 'bg-red-600 text-white ring-4 ring-red-200 ring-offset-2'
                            : isDark
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stage.completed ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        <i className={`fas fa-${stage.icon}`}></i>
                      )}
                    </div>
                    <span className={`text-sm ${
                      stage.active ? 'font-medium' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stage.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 孵化数据 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { title: '已孵化IP', value: '3', icon: 'gem', color: 'purple' },
              { title: '版权存证', value: '8', icon: 'shield-alt', color: 'blue' },
              { title: '商业合作', value: '2', icon: 'handshake', color: 'green' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                    <h3 className="text-xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                    <i className={`fas fa-${stat.icon} text-lg`}></i>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* IP孵化建议 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <h4 className="font-medium mb-4 flex items-center">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              IP孵化建议
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                <p className="text-sm">您的作品"国潮插画系列"已完成版权存证，可以开始申请商业合作</p>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                <p className="text-sm">建议将"传统纹样创新"设计转化为3D模型，提升商业价值</p>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                <p className="text-sm">参与当前开放的"桂发祥包装设计"项目，与您的风格高度匹配</p>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 商业机会 */}
      {activeTab === 'opportunities' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commercialOpportunities.map((opportunity) => (
              <motion.div
                key={opportunity.id}
                className={`rounded-xl overflow-hidden shadow-md border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <img 
                    src={opportunity.image} 
                    alt={opportunity.name} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      opportunity.status === 'open' 
                        ? 'bg-green-600 text-white' 
                        : opportunity.status === 'matched'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-white'
                    }`}>
                      {opportunity.status === 'open' ? '开放申请' : 
                       opportunity.status === 'matched' ? '匹配中' : '已关闭'}
                    </span>
                  </div>
                </div>
                
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{opportunity.name}</h4>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      {opportunity.brand}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {opportunity.description}
                  </p>
                  
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'} mb-4 flex justify-between items-center`}>
                    <span className="text-sm font-medium">奖励</span>
                    <span className="font-bold text-red-600">{opportunity.reward}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleApplyOpportunity(opportunity.id)}
                    disabled={opportunity.status !== 'open'}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${
                      opportunity.status === 'open'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : isDark
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {opportunity.status === 'open' ? '立即申请' : 
                     opportunity.status === 'matched' ? '匹配中' : '已关闭'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 版权资产 */}
      {activeTab === 'copyright' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {copyrightAssets.map((asset) => (
              <motion.div
                key={asset.id}
                className={`rounded-xl overflow-hidden shadow-md border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                whileHover={{ y: -5 }}
              >
                <img 
                  src={asset.thumbnail} 
                  alt={asset.name} 
                  className="w-full h-48 object-cover"
                />
                
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">{asset.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      {asset.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-4">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      创建于 {asset.createdAt}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      asset.status === '已存证' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleLicenseAsset(asset.id)}
                    disabled={!asset.canLicense}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${
                      asset.canLicense
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : isDark
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {asset.canLicense ? '版权授权' : '已授权'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 版权数据分析 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-medium mb-4">版权数据分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm mb-3">版权类型分布</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '插画', value: 4 },
                          { name: '纹样', value: 2 },
                          { name: '品牌设计', value: 2 },
                          { name: '其他', value: 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: '插画', value: 4 },
                          { name: '纹样', value: 2 },
                          { name: '品牌设计', value: 2 },
                          { name: '其他', value: 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#f87171', '#60a5fa', '#34d399', '#a78bfa'][index % 4]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h5 className="text-sm mb-3">版权收益预估</h5>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>已授权收益</span>
                      <span className="font-medium">¥3,500</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-green-500" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>待授权预估</span>
                      <span className="font-medium">¥6,500</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-blue-500" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <p className="text-sm opacity-70 mb-1">总预估收益</p>
                    <p className="text-2xl font-bold">¥10,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
