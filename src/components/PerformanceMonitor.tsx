import { useState, useEffect } from 'react';
import imageService from '../services/imageService';

// 性能监控组件 - 显示图片加载统计信息
// 仅在开发环境中显示
const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState(imageService.getPerformanceStats());
  const [cacheStats, setCacheStats] = useState(imageService.getCacheStats());
  const [isVisible, setIsVisible] = useState(false);

  // 定期更新统计信息
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(imageService.getPerformanceStats());
      setCacheStats(imageService.getCacheStats());
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 仅在开发环境中显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        title="查看图片性能统计"
      >
        <i className="fas fa-chart-line"></i>
      </button>

      {/* 统计信息面板 */}
      {isVisible && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 max-w-xs">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">图片性能统计</h3>
          
          {/* 核心指标 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">总请求数</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.totalRequests}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">缓存命中率</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{cacheStats.hitRate}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">加载成功率</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{cacheStats.successRate}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">缓存大小</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{cacheStats.size}/{cacheStats.maxSize}</p>
            </div>
          </div>

          {/* 详细统计 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">成功加载</span>
              <span className="font-medium text-green-600 dark:text-green-400">{stats.loadSuccess}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">加载失败</span>
              <span className="font-medium text-red-600 dark:text-red-400">{stats.loadFailed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">缓存命中</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{stats.cacheHits}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => imageService.resetStats()}
              className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="重置统计信息"
            >
              重置统计
            </button>
            <button
              onClick={() => imageService.clearCache()}
              className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="清除图片缓存"
            >
              清除缓存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;