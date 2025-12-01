import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import tianjinCultureService, { KnowledgeItem, KNOWLEDGE_CATEGORIES } from '@/services/tianjinCultureService';
import { toast } from 'sonner';

interface CulturalKnowledgeBaseProps {
  onItemSelect?: (item: KnowledgeItem) => void;
}

export default React.memo(function CulturalKnowledgeBase({ onItemSelect }: CulturalKnowledgeBaseProps) {
  const { isDark } = useTheme();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [relatedItems, setRelatedItems] = useState<KnowledgeItem[]>([]);

  // 加载知识库数据
  useEffect(() => {
    const allItems = tianjinCultureService.getAllKnowledge();
    setKnowledgeItems(allItems);
    setFilteredItems(allItems);
  }, []);

  // 筛选知识库条目
  useEffect(() => {
    let result = [...knowledgeItems];

    // 按分类筛选
    if (selectedCategory !== '全部') {
      result = tianjinCultureService.getKnowledgeByCategory(selectedCategory);
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      result = tianjinCultureService.searchKnowledge(searchQuery);
    }

    setFilteredItems(result);
  }, [knowledgeItems, selectedCategory, searchQuery]);

  // 处理条目选择
  const handleItemSelect = (item: KnowledgeItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      setSelectedItem(item);
      // 获取相关条目
      const related = tianjinCultureService.getRelatedItems(item.id);
      setRelatedItems(related);
      setShowDetail(true);
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={`p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">天津历史文化知识库</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            探索天津丰富的历史文化遗产，了解天津的过去与现在
          </p>
        </div>

        {/* 筛选和搜索 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 分类筛选 */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">分类筛选</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory('全部')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === '全部' ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                全部
              </button>
              {KNOWLEDGE_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === category ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">搜索知识库</label>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索天津历史、文化、艺术等相关知识"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* 知识库条目列表 */}
        {filteredItems.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-book-open text-4xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">未找到相关知识</h3>
            <p>尝试调整筛选条件或搜索词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                className={`rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border cursor-pointer`}
                whileHover={{ y: -4 }}
                onClick={() => handleItemSelect(item)}
              >
                {/* 条目图片 */}
                {item.imageUrl && (
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}

                {/* 条目信息 */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                    {item.content}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{item.subcategory}</span>
                    <span>{formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 知识库条目详情模态框 */}
      {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className={`rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 模态框头部 */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedItem.title}</h3>
              <button
                onClick={() => setShowDetail(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-4">
              {/* 条目图片 */}
              {selectedItem.imageUrl && (
                <div className="mb-4">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* 条目分类和更新时间 */}
              <div className="flex flex-wrap gap-2 mb-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {selectedItem.category}
                </span>
                <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {selectedItem.subcategory}
                </span>
                <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} text-gray-400`}>
                  更新时间：{formatDate(selectedItem.updatedAt)}
                </span>
              </div>

              {/* 条目内容 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">内容详情</h4>
                <div className={`whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedItem.content}
                </div>
              </div>

              {/* 来源 */}
              {selectedItem.sources && selectedItem.sources.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">参考来源</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedItem.sources.map((source, index) => (
                      <li key={index} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 相关条目 */}
              {relatedItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">相关知识</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedItems.map(item => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        onClick={() => {
                          setSelectedItem(item);
                          const newRelated = tianjinCultureService.getRelatedItems(item.id);
                          setRelatedItems(newRelated);
                        }}
                      >
                        <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
