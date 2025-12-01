import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import analyticsService from '@/services/analyticsService';
import { CreatorAnalytics } from '@/services/analyticsService';

const AnalyticsDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '180d'>('180d');
  const [activeTab, setActiveTab] = useState<'overview' | 'works' | 'engagement' | 'growth'>('overview');

  // 颜色配置
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    // 加载数据分析
    const loadAnalytics = () => {
      setIsLoading(true);
      try {
        const data = analyticsService.getCreatorAnalytics();
        setAnalytics(data);
      } catch (error) {
        toast.error('加载数据分析失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
    // 每30秒自动刷新一次
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // 导出CSV
  const handleExportCSV = () => {
    if (!analytics) return;
    
    try {
      const csvContent = analyticsService.exportAnalyticsToCSV(analytics);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `创作者数据分析报告_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('数据分析报告已导出');
    } catch (error) {
      toast.error('导出失败');
    }
  };

  // 格式化百分比
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // 格式化数字
  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // 骨架屏组件
  const Skeleton = () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-full" />
  );

  if (isLoading || !analytics) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">创作者数据分析</h1>
          <Skeleton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <Skeleton />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <Skeleton />
            </div>
          ))}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <Skeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">创作者数据分析</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            实时监控您的作品表现和用户互动情况
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${timeRange === '7d' ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setTimeRange('7d')}
            >
              7天
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${timeRange === '30d' ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setTimeRange('30d')}
            >
              30天
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${timeRange === '90d' ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setTimeRange('90d')}
            >
              90天
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${timeRange === '180d' ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setTimeRange('180d')}
            >
              180天
            </button>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <i className="fas fa-download"></i>
            导出报告
          </button>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {[
          { id: 'overview', name: '概览' },
          { id: 'works', name: '作品分析' },
          { id: 'engagement', name: '互动分析' },
          { id: 'growth', name: '增长分析' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`py-3 px-5 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 概览面板 */}
      {activeTab === 'overview' && (
        <>
          {/* 核心指标卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {[
              { title: '总作品数', value: analytics.totalWorks, icon: 'fas fa-palette', color: 'bg-red-500' },
              { title: '总点赞数', value: analytics.totalLikes, icon: 'fas fa-heart', color: 'bg-pink-500' },
              { title: '总浏览量', value: analytics.totalViews, icon: 'fas fa-eye', color: 'bg-blue-500' },
              { title: '总互动量', value: analytics.totalLikes + analytics.totalComments + analytics.totalShares, icon: 'fas fa-comments', color: 'bg-green-500' }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{item.value.toLocaleString()}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${item.color} text-white`}>
                    <i className={item.icon}></i>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 作品类型分布 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 lg:col-span-1"
            >
              <h3 className="text-lg font-semibold mb-4">作品类型分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.worksByType).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(analytics.worksByType).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, '作品数']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 月度作品增长 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 lg:col-span-2"
            >
              <h3 className="text-lg font-semibold mb-4">月度作品增长</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.worksByMonth}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                    <YAxis stroke={isDark ? '#888' : '#666'} />
                    <Tooltip formatter={(value) => [value, '作品数']} />
                    <Area type="monotone" dataKey="count" stroke="#FF6B6B" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* 月度互动趋势 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">月度互动趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                  <YAxis stroke={isDark ? '#888' : '#666'} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="#FF6B6B" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="views" stroke="#4ECDC4" strokeWidth={2} />
                  <Line type="monotone" dataKey="shares" stroke="#45B7D1" strokeWidth={2} />
                  <Line type="monotone" dataKey="comments" stroke="#96CEB4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 热门作品 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4"
          >
            <h3 className="text-lg font-semibold mb-4">热门作品 Top 5</h3>
            <div className="space-y-4">
              {analytics.topWorks.map((work, index) => (
                <div key={work.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate">{work.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {work.type} · {work.views} 浏览 · {work.likes} 点赞
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-sm">{work.engagement} 互动</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      互动率 {((work.engagement / work.views) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* 作品分析面板 */}
      {activeTab === 'works' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 作品类型分布 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">作品类型分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics.worksByType).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis dataKey="name" stroke={isDark ? '#888' : '#666'} />
                    <YAxis stroke={isDark ? '#888' : '#666'} />
                    <Tooltip formatter={(value) => [value, '作品数']} />
                    <Bar dataKey="value" fill="#FF6B6B">
                      {Object.entries(analytics.worksByType).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 月度作品统计 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">月度作品统计</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.worksByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                    <YAxis stroke={isDark ? '#888' : '#666'} />
                    <Tooltip formatter={(value) => [value, '作品数']} />
                    <Bar dataKey="count" fill="#4ECDC4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 作品表现详情 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">作品表现详情</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">作品标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">点赞</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">浏览</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">分享</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">评论</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">互动率</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.topWorks.map((work) => (
                    <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{work.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{work.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{work.likes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{work.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{work.shares}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{work.comments}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {((work.engagement / work.views) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 互动分析面板 */}
      {activeTab === 'engagement' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 互动类型分布 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">互动类型分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '点赞', value: analytics.totalLikes },
                        { name: '分享', value: analytics.totalShares },
                        { name: '评论', value: analytics.totalComments }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[...Array(3)].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, '次数']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 平均互动数据 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">平均互动数据</h3>
              <div className="space-y-4">
                {[
                  { title: '平均每作品点赞', value: analytics.avgLikesPerWork, icon: 'fas fa-heart', color: '#FF6B6B' },
                  { title: '平均每作品浏览', value: analytics.avgViewsPerWork, icon: 'fas fa-eye', color: '#4ECDC4' },
                  { title: '平均每作品分享', value: analytics.avgSharesPerWork, icon: 'fas fa-share', color: '#45B7D1' },
                  { title: '平均每作品评论', value: analytics.avgCommentsPerWork, icon: 'fas fa-comment', color: '#96CEB4' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${item.color} text-white`}>
                        <i className={item.icon}></i>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.title}</span>
                    </div>
                    <span className="font-semibold text-sm">{item.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 互动率统计 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">互动率统计</h3>
              <div className="space-y-4">
                {analytics.topWorks.slice(0, 5).map((work, index) => {
                  const engagementRate = work.views > 0 ? ((work.likes + work.comments + work.shares) / work.views) * 100 : 0;
                  return (
                    <div key={work.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{work.title}</span>
                        <span className="text-xs font-semibold">{engagementRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full" style={{ width: `${engagementRate}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 月度互动趋势 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">月度互动趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyEngagement}>
                  <defs>
                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                  <YAxis stroke={isDark ? '#888' : '#666'} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="likes" stroke="#FF6B6B" fillOpacity={1} fill="url(#colorLikes)" />
                  <Area type="monotone" dataKey="views" stroke="#4ECDC4" fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="shares" stroke="#45B7D1" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="comments" stroke="#96CEB4" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* 增长分析面板 */}
      {activeTab === 'growth' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 增长率卡片 */}
            {[
              { title: '作品增长率', value: analytics.growthRate.works, icon: 'fas fa-chart-line', color: '#FF6B6B' },
              { title: '点赞增长率', value: analytics.growthRate.likes, icon: 'fas fa-heart', color: '#4ECDC4' },
              { title: '浏览增长率', value: analytics.growthRate.views, icon: 'fas fa-eye', color: '#45B7D1' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${item.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.value >= 0 ? '+' : ''}{item.value.toFixed(1)}%
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${item.color} text-white`}>
                    <i className={item.icon}></i>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(item.value), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 增长趋势图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 作品增长趋势 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">作品增长趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.worksByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                    <YAxis stroke={isDark ? '#888' : '#666'} />
                    <Tooltip formatter={(value) => [value, '作品数']} />
                    <Line type="monotone" dataKey="count" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 互动增长趋势 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">互动增长趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyEngagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis dataKey="month" stroke={isDark ? '#888' : '#666'} />
                    <YAxis stroke={isDark ? '#888' : '#666'} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="likes" fill="#FF6B6B" />
                    <Bar dataKey="comments" fill="#4ECDC4" />
                    <Bar dataKey="shares" fill="#45B7D1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
