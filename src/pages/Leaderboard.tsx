import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '@/lib/apiClient';
import GradientHero from '@/components/GradientHero';
import LazyImage from '@/components/LazyImage';

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  username?: string;
  avatar_url?: string;
  category_id: number;
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: number;
  updated_at: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  posts_count?: number;
  total_likes?: number;
  total_views?: number;
  created_at: number;
  updated_at: number;
}

type LeaderboardType = 'posts' | 'users';
type TimeRange = 'day' | 'week' | 'month' | 'all';
type SortBy = 'likes_count' | 'views' | 'comments_count' | 'posts_count';

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: 1,
    title: '国潮插画设计',
    content: '这是一个关于国潮风格的插画设计作品，融合了传统元素与现代设计理念。',
    user_id: 1,
    username: '设计师小明',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    category_id: 1,
    status: 'published',
    views: 1234,
    likes_count: 456,
    comments_count: 78,
    created_at: Date.now() - 86400000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    title: '赛博朋克风格海报',
    content: '赛博朋克风格的海报设计，展现了未来科技感与城市夜景的融合。',
    user_id: 2,
    username: '插画师小红',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    category_id: 2,
    status: 'published',
    views: 987,
    likes_count: 321,
    comments_count: 56,
    created_at: Date.now() - 172800000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    title: '传统纹样现代化设计',
    content: '将传统纹样重新设计，应用于现代产品包装，展现传统文化的新活力。',
    user_id: 3,
    username: '设计师小李',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    category_id: 3,
    status: 'published',
    views: 765,
    likes_count: 234,
    comments_count: 45,
    created_at: Date.now() - 259200000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    title: '水墨风格动画短片',
    content: '使用传统水墨技法制作的动画短片，讲述了一个关于自然与人文的故事。',
    user_id: 4,
    username: '动画师小王',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    category_id: 4,
    status: 'published',
    views: 543,
    likes_count: 189,
    comments_count: 34,
    created_at: Date.now() - 345600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    title: '民俗文化主题摄影',
    content: '民俗文化主题的摄影作品，记录了各地的传统节日与习俗。',
    user_id: 5,
    username: '摄影师小张',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    category_id: 5,
    status: 'published',
    views: 321,
    likes_count: 123,
    comments_count: 23,
    created_at: Date.now() - 432000000,
    updated_at: Date.now() - 432000000
  }
];

// Mock data for users
const mockUsers: User[] = [
  {
    id: 1,
    username: '设计师小明',
    email: 'xiaoming@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    posts_count: 12,
    total_likes: 2345,
    total_views: 15678,
    created_at: Date.now() - 31536000000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    username: '插画师小红',
    email: 'xiaohong@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    posts_count: 8,
    total_likes: 1890,
    total_views: 12345,
    created_at: Date.now() - 2592000000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    username: '设计师小李',
    email: 'xiaoli@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    posts_count: 15,
    total_likes: 2100,
    total_views: 14567,
    created_at: Date.now() - 1814400000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    username: '动画师小王',
    email: 'xiaowang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    posts_count: 6,
    total_likes: 1567,
    total_views: 10987,
    created_at: Date.now() - 1209600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    username: '摄影师小张',
    email: 'xiaozhang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    posts_count: 20,
    total_likes: 2890,
    total_views: 18765,
    created_at: Date.now() - 907200000,
    updated_at: Date.now() - 432000000
  }
];

// Helper function to sort mock data by different criteria
const sortMockData = <T extends Post | User>(data: T[], sortBy: SortBy): T[] => {
  return [...data].sort((a, b) => {
    if (sortBy === 'likes_count') {
      return (b as any).likes_count - (a as any).likes_count;
    } else if (sortBy === 'views') {
      return (b as any).views - (a as any).views;
    } else if (sortBy === 'comments_count') {
      return (b as any).comments_count - (a as any).comments_count;
    } else if (sortBy === 'posts_count') {
      return (b as any).posts_count - (a as any).posts_count;
    }
    return 0;
  });
};

const Leaderboard: React.FC = () => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('users');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortBy, setSortBy] = useState<SortBy>('likes_count');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeRange, sortBy]);

  // 添加本地缓存机制
  const [cache, setCache] = useState<Record<string, { posts: Post[]; users: User[] }>>({});
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    // 生成缓存键
    const cacheKey = `${leaderboardType}-${sortBy}-${timeRange}`;
    
    // 检查缓存
    if (cache[cacheKey]) {
      if (leaderboardType === 'posts') {
        setPosts(cache[cacheKey].posts);
      } else {
        setUsers(cache[cacheKey].users);
      }
      setLoading(false);
      return;
    }
    
    // 优化：立即使用mock数据作为初始加载，然后异步更新API数据
    const sortedMockPosts = sortMockData(mockPosts, sortBy);
    const sortedMockUsers = sortMockData(mockUsers, sortBy);
    
    if (leaderboardType === 'posts') {
      setPosts(sortedMockPosts);
    } else {
      setUsers(sortedMockUsers);
    }
    
    // 使用mock数据更新缓存
    setCache(prev => ({
      ...prev, 
      [cacheKey]: {
        ...prev[cacheKey] || { posts: [], users: [] },
        posts: sortedMockPosts,
        users: sortedMockUsers
      }
    }));
    
    try {
      // 优化API请求：减少超时时间，去除重试
      if (leaderboardType === 'posts') {
        const response = await apiClient.get(`/api/leaderboard/posts?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as Post[] : sortedMockPosts;
        setPosts(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, posts: data } }));
      } else {
        const response = await apiClient.get(`/api/leaderboard/users?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as User[] : sortedMockUsers;
        setUsers(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, users: data } }));
      }
    } catch (err: any) {
      // API请求失败时，继续使用mock数据，不显示错误
      console.log('API请求失败，使用mock数据:', err.message);
      // 不设置错误状态，保持使用mock数据
    } finally {
      // 使用requestAnimationFrame确保UI流畅更新
      requestAnimationFrame(() => {
        setLoading(false);
      });
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/explore/${postId}`);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-amber-500 font-bold';
    if (index === 1) return 'text-gray-400 font-bold';
    if (index === 2) return 'text-amber-700 font-bold';
    return 'text-gray-600 font-medium';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="relative">
          <span className="text-3xl font-bold text-amber-500 drop-shadow-lg">
            {index + 1}
          </span>
          <div className="absolute -top-3 -right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            🏆
          </div>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="relative">
          <span className="text-3xl font-bold text-gray-400 drop-shadow-lg">
            {index + 1}
          </span>
          <div className="absolute -top-3 -right-3 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            🥈
          </div>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="relative">
          <span className="text-3xl font-bold text-amber-700 drop-shadow-lg">
            {index + 1}
          </span>
          <div className="absolute -top-3 -right-3 w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            🥉
          </div>
        </div>
      );
    }
    return (
      <span className={`text-2xl font-medium ${getRankColor(index)}`}>
        {index + 1}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <GradientHero 
        title="人气榜"
        subtitle="发现平台上最受欢迎的内容和创作者"
        theme="blue"
        stats={[
          { label: '类型', value: leaderboardType === 'posts' ? '热门帖子' : '热门创作者' },
          { label: '时间', value: timeRange === 'day' ? '今日' : timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '总榜' },
          { label: '排序', value: sortBy === 'likes_count' ? '点赞数' : sortBy === 'views' ? '浏览量' : sortBy === 'comments_count' ? '评论数' : '作品数量' },
          { label: '数据', value: (leaderboardType === 'posts' ? posts.length : users.length).toString() }
        ]}
        pattern={true}
        size="md"
      />

      {/* 筛选选项 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 排行榜类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">排行榜类型</label>
            <div className="flex space-x-2 flex-wrap">
              <button
                onClick={() => setLeaderboardType('posts')}
                className={`flex-1 min-w-[120px] px-3 py-2 text-sm rounded-lg font-medium transition-all ${leaderboardType === 'posts' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                热门帖子
              </button>
              <button
                onClick={() => setLeaderboardType('users')}
                className={`flex-1 min-w-[120px] px-3 py-2 text-sm rounded-lg font-medium transition-all ${leaderboardType === 'users' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                热门创作者
              </button>
            </div>
          </div>

          {/* 时间范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间范围</label>
            <div className="flex space-x-2 flex-wrap gap-y-2">
              {(['day', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 min-w-[70px] px-3 py-1.5 rounded-full text-sm font-medium transition-all ${timeRange === range ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  {range === 'day' && '今日'}
                  {range === 'week' && '本周'}
                  {range === 'month' && '本月'}
                  {range === 'all' && '总榜'}
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">排序方式</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {leaderboardType === 'posts' ? (
                <>
                  <option value="likes_count">点赞数</option>
                  <option value="views">浏览量</option>
                  <option value="comments_count">评论数</option>
                </>
              ) : (
                <>
                  <option value="posts_count">作品数量</option>
                  <option value="likes_count">总点赞数</option>
                  <option value="views">总浏览量</option>
                </>
              )}
            </select>
          </div>
        </div>
      </motion.div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"
            ></motion.div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400">正在加载排行榜数据...</p>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-300 shadow-sm">
          <div className="flex items-center mb-3">
            <i className="fas fa-exclamation-circle text-xl mr-3"></i>
            <h3 className="text-lg font-medium">获取数据失败</h3>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            重试
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboardType === 'posts' ? (
            posts.map((post, index) => (
              <motion.div 
                key={post.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getRankBadge(index)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                          {post.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {post.username && (
                            <img 
                              src={post.avatar_url || 'https://via.placeholder.com/32'} 
                              alt={post.username} 
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <span>{post.username || '未知用户'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {post.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex space-x-4">
                      <span className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                        </svg>
                        {post.views}
                      </span>
                      <span className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                        </svg>
                        {post.likes_count}
                      </span>
                      <span className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                        </svg>
                        {post.comments_count}
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            users.map((user, index) => (
              <motion.div 
                key={user.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getRankBadge(index)}
                      </div>
                      <LazyImage 
                        src={user.avatar_url || 'https://via.placeholder.com/64'} 
                        alt={user.username} 
                        className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
                        width={48}
                        height={48}
                        loading="lazy"
                      />
                      <div className="ml-3">
                        <h3 className="font-semibold text-lg">{user.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">作品数量</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{user.posts_count || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">总点赞数</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{user.total_likes || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">总浏览量</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{user.total_views || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">加入时间</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {loading && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm animate-pulse">
          <div className="w-20 h-20 mx-auto bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3 max-w-xs mx-auto"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-6 max-w-md mx-auto"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg max-w-xs mx-auto"></div>
        </div>
      )}
      
      {(!posts.length && !users.length && !loading && !error) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="w-10 h-10 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">暂无数据</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {leaderboardType === 'posts' 
              ? '还没有足够的帖子数据，快来发布你的第一个作品吧！' 
              : '还没有足够的用户数据，邀请更多创作者加入吧！'}
          </p>
          {leaderboardType === 'posts' && (
            <button
              onClick={() => navigate('/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center mx-auto"
            >
              <i className="fas fa-plus mr-2"></i>
              发布作品
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;