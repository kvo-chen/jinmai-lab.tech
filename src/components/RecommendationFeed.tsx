import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import recommendationService, { RecommendedItem } from '../services/recommendationService';

interface RecommendationFeedProps {
  userId: string;
  title?: string;
  limit?: number;
  showReason?: boolean;
  onItemClick?: (item: RecommendedItem) => void;
}

const RecommendationFeed: React.FC<RecommendationFeedProps> = ({
  userId,
  title = '为您推荐',
  limit = 10,
  showReason = true,
  onItemClick
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'challenges' | 'templates'>('all');

  // 加载推荐内容
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      const items = recommendationService.getRecommendations(userId, limit * 2); // 加载更多以支持筛选
      setRecommendations(items);
      setIsLoading(false);
    };

    fetchRecommendations();
  }, [userId, limit]);

  // 处理标签筛选
  const filteredRecommendations = activeTab === 'all' 
    ? recommendations.slice(0, limit)
    : recommendations
        .filter(item => item.type === activeTab.slice(0, -1) as 'post' | 'challenge' | 'template')
        .slice(0, limit);

  // 处理推荐项点击
  const handleItemClick = (item: RecommendedItem) => {
    // 记录点击行为
    recommendationService.recordRecommendationClick(userId, item);
    
    // 调用外部点击处理函数
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // 获取推荐类型的中文名称
  const getTypeName = (type: string): string => {
    switch (type) {
      case 'post': return '作品';
      case 'challenge': return '挑战';
      case 'template': return '模板';
      default: return '内容';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        
        {/* 推荐类型筛选标签 */}
        <div className="flex space-x-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'posts', label: '作品' },
            { value: 'challenges', label: '挑战' },
            { value: 'templates', label: '模板' }
          ].map(tab => (
            <motion.button
              key={tab.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${activeTab === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRecommendations.length > 0 ? (
        <div className="space-y-4">
          {filteredRecommendations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* 缩略图 */}
              {item.thumbnail && (
                <div className="sm:w-32 sm:h-24 flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* 内容信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 'post' ? 'bg-purple-100 text-purple-800' : item.type === 'challenge' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {getTypeName(item.type)}
                  </span>
                </div>
                
                {/* 推荐理由 */}
                {showReason && item.reason && (
                  <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                )}
                
                {/* 元数据信息 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    推荐指数: {Math.round(item.score * 10) / 10}
                  </span>
                  
                  {/* 互动数据 */}
                  {item.metadata && (
                    <div className="flex gap-3">
                      {item.metadata.likes !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {item.metadata.likes}
                        </span>
                      )}
                      
                      {item.metadata.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {item.metadata.views}
                        </span>
                      )}
                      
                      {item.metadata.participants !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {item.metadata.participants}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无推荐内容</h3>
          <p className="text-gray-500">继续探索平台内容，我们会为您提供更精准的推荐</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationFeed;