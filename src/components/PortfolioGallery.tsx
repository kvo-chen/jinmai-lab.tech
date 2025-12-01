import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Post, PostCategory, getPosts } from '../services/postService';

interface PortfolioGalleryProps {
  userId?: string;
  showFilters?: boolean;
  showCategories?: boolean;
}

const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  userId,
  showFilters = true,
  showCategories = true
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views' | 'shares'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 加载作品数据
  useEffect(() => {
    const loadedPosts = getPosts();
    // 如果指定了用户ID，只显示该用户的作品
    const userPosts = userId ? loadedPosts.filter(post => post.author === userId) : loadedPosts;
    setPosts(userPosts);
    setFilteredPosts(userPosts);
    
    // 提取所有可用标签
    const tags = new Set<string>();
    userPosts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  }, [userId]);

  // 应用筛选和排序
  useEffect(() => {
    let result = [...posts];
    
    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.category === selectedCategory);
    }
    
    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(post => 
        selectedTags.every(tag => post.tags.includes(tag))
      );
    }
    
    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 排序
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'likes':
          aVal = a.likes;
          bVal = b.likes;
          break;
        case 'views':
          aVal = a.views;
          bVal = b.views;
          break;
        case 'shares':
          aVal = a.shares;
          bVal = b.shares;
          break;
        default:
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    setFilteredPosts(result);
  }, [posts, selectedCategory, selectedTags, searchQuery, sortBy, sortOrder]);

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // 分类选项
  const categoryOptions = [
    { value: 'all', label: '全部' },
    { value: 'design', label: '设计' },
    { value: 'writing', label: '写作' },
    { value: 'audio', label: '音频' },
    { value: 'video', label: '视频' },
    { value: 'other', label: '其他' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">创作者作品集</h2>
      
      {showFilters && (
        <div className="space-y-4 mb-6">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索作品标题、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 分类筛选 */}
            {showCategories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as PostCategory | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* 排序选项 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序依据</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'likes' | 'views' | 'shares')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">日期</option>
                  <option value="likes">点赞数</option>
                  <option value="views">浏览量</option>
                  <option value="shares">分享数</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序顺序</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 标签筛选 */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标签筛选</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <motion.button
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 作品展示 */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* 作品缩略图 */}
              <div className="relative">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                {/* 分类标签 */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.category === 'design' ? 'bg-purple-100 text-purple-800' : post.category === 'writing' ? 'bg-blue-100 text-blue-800' : post.category === 'audio' ? 'bg-green-100 text-green-800' : post.category === 'video' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {categoryOptions.find(opt => opt.value === post.category)?.label || '其他'}
                  </span>
                </div>
                {/* 特色标记 */}
                {post.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      精选
                    </span>
                  </div>
                )}
                {/* 草稿标记 */}
                {post.isDraft && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      草稿
                    </span>
                  </div>
                )}
              </div>
              
              {/* 作品信息 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
                
                {/* 统计信息 */}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 10.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L5.586 11H2a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3zM13 12a1 1 0 100-2h-3.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 13H13z" clipRule="evenodd" />
                      </svg>
                      {post.shares}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无作品</h3>
          <p className="text-gray-500">还没有符合条件的作品，快来创作吧！</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioGallery;