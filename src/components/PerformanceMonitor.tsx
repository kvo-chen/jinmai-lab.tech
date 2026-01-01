import { useState, useEffect, useRef } from 'react';

// 添加LayoutShift类型定义
interface LayoutShift {
  value: number;
  hadRecentInput: boolean;
}
import imageService from '../services/imageService';
import errorService from '../services/errorService';

// 性能监控组件 - 显示图片加载和页面性能统计信息
// 仅在开发环境中显示
const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState(imageService.getPerformanceStats());
  const [cacheStats, setCacheStats] = useState(imageService.getCacheStats());
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'performance' | 'errors'>('image');
  const [pageStats, setPageStats] = useState({
    loadTime: 0,
    apiTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    memoryUsage: 0,
    fps: 0
  });
  const [errorStats, setErrorStats] = useState(errorService.getErrorStats(5));
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // 计算FPS
  useEffect(() => {
    const calculateFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      requestAnimationFrame(calculateFPS);
    };
    
    const fpsId = requestAnimationFrame(calculateFPS);
    
    return () => cancelAnimationFrame(fpsId);
  }, []);

  // 核心Web Vitals监控
  const [webVitals, setWebVitals] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    inp: 0
  });

  // 监听核心Web Vitals
  useEffect(() => {
    // 监听FCP (First Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        setWebVitals(prev => ({ ...prev, fcp: Math.round(entries[0].startTime) }));
      }
    }).observe({ entryTypes: ['paint'] });

    // 监听LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        setWebVitals(prev => ({ ...prev, lcp: Math.round(entries[0].startTime) }));
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // 监听FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const firstInputEntry = entries[0] as PerformanceEventTiming;
        setWebVitals(prev => ({ ...prev, fid: Math.round(firstInputEntry.processingStart - firstInputEntry.startTime) }));
      }
    }).observe({ type: 'first-input', buffered: true });

    // 监听CLS (Cumulative Layout Shift)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      let cls = 0;
      entries.forEach(entry => {
        // 使用更安全的类型检查和转换
        if ('hadRecentInput' in entry && 'value' in entry) {
          const layoutEntry = entry as unknown as LayoutShift;
          if (!layoutEntry.hadRecentInput) {
            cls += layoutEntry.value;
          }
        }
      });
      setWebVitals(prev => ({ ...prev, cls: parseFloat(cls.toFixed(3)) }));
    }).observe({ entryTypes: ['layout-shift'] });

    // 监听TTFB (Time to First Byte)
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming;
      setWebVitals(prev => ({ ...prev, ttfb: Math.round(navigationEntry.responseStart) }));
    }
  }, []);

  // 定期更新统计信息
  useEffect(() => {
    const updateStats = () => {
      // 更新图片统计
      setStats(imageService.getPerformanceStats());
      setCacheStats(imageService.getCacheStats());
      
      // 更新错误统计
      setErrorStats(errorService.getErrorStats(5));
      
      // 计算页面性能指标
        const performanceEntries = performance.getEntriesByType('navigation');
        if (performanceEntries.length > 0) {
          const navigationEntry = performanceEntries[0] as PerformanceNavigationTiming;
          setPageStats(prev => ({
            ...prev,
            loadTime: Math.round((navigationEntry.loadEventEnd || 0) - (navigationEntry.startTime || 0)),
            apiTime: 0,
            domContentLoaded: Math.round((navigationEntry.domContentLoadedEventEnd || 0) - (navigationEntry.startTime || 0)),
            firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0),
            fps: fpsRef.current,
            memoryUsage: typeof performance !== 'undefined' && 'memory' in performance 
              ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
              : 0
          }));
        }
    };
    
    const interval = setInterval(updateStats, 5000); // 每5秒更新一次
    updateStats(); // 立即更新一次

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
        title="查看性能统计"
      >
        <i className="fas fa-chart-line"></i>
      </button>

      {/* 统计信息面板 */}
      {isVisible && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 max-w-md">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">性能监控</h3>
          
          {/* 标签页切换 */}
          <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'image' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              图片性能
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'performance' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              页面性能
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'errors' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              错误统计
            </button>
          </div>
          
          {/* 图片性能统计 */}
          {activeTab === 'image' && (
            <div>
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
          
          {/* 页面性能统计 */}
          {activeTab === 'performance' && (
            <div>
              {/* 核心Web Vitals */}
              <h4 className="font-medium mb-3 text-gray-800 dark:text-white">核心Web Vitals</h4>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">FCP (首次内容绘制) (ms)</p>
                  <p className={`text-xl font-bold ${webVitals.fcp > 1800 ? 'text-red-600' : webVitals.fcp > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {webVitals.fcp || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">LCP (最大内容绘制) (ms)</p>
                  <p className={`text-xl font-bold ${webVitals.lcp > 2500 ? 'text-red-600' : webVitals.lcp > 1250 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {webVitals.lcp || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">FID (首次输入延迟) (ms)</p>
                  <p className={`text-xl font-bold ${webVitals.fid > 300 ? 'text-red-600' : webVitals.fid > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {webVitals.fid || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">CLS (累积布局偏移)</p>
                  <p className={`text-xl font-bold ${webVitals.cls > 0.25 ? 'text-red-600' : webVitals.cls > 0.1 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {webVitals.cls || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">TTFB (首字节时间) (ms)</p>
                  <p className={`text-xl font-bold ${webVitals.ttfb > 600 ? 'text-red-600' : webVitals.ttfb > 300 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {webVitals.ttfb || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">当前FPS</p>
                  <p className={`text-xl font-bold ${pageStats.fps > 50 ? 'text-green-600' : pageStats.fps > 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {pageStats.fps}
                  </p>
                </div>
              </div>

              {/* 传统性能指标 */}
              <h4 className="font-medium mb-3 text-gray-800 dark:text-white">传统性能指标</h4>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">页面加载时间 (ms)</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{pageStats.loadTime}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">DOM加载时间 (ms)</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{pageStats.domContentLoaded}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">首次绘制 (ms)</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{pageStats.firstPaint}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">内存使用 (MB)</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{pageStats.memoryUsage}</p>
                </div>
              </div>
              
              {/* 性能优化建议 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mt-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">优化建议</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  {webVitals.fcp > 1800 && <li>• FCP时间过长，建议优化关键资源加载</li>}
                  {webVitals.lcp > 2500 && <li>• LCP时间过长，优化最大内容元素</li>}
                  {webVitals.fid > 300 && <li>• FID过大，优化JavaScript执行时间</li>}
                  {webVitals.cls > 0.25 && <li>• CLS过大，确保页面布局稳定</li>}
                  {webVitals.ttfb > 600 && <li>• TTFB过大，优化服务器响应时间</li>}
                  {pageStats.loadTime > 2000 && <li>• 页面加载时间过长，优化资源加载顺序</li>}
                  {pageStats.memoryUsage > 500 && <li>• 内存使用过高，检查是否有内存泄漏</li>}
                  {pageStats.fps < 30 && <li>• FPS较低，检查动画和渲染性能</li>}
                </ul>
              </div>
            </div>
          )}
          
          {/* 错误统计 */}
          {activeTab === 'errors' && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">总错误数</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{errorStats.total}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">未解决预警</p>
                  <p className={`text-xl font-bold ${errorStats.alertStats.unresolved > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                    {errorStats.alertStats.unresolved}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">严重错误</p>
                  <p className={`text-xl font-bold ${errorStats.criticalErrors.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                    {errorStats.criticalErrors.length}
                  </p>
                </div>
              </div>
              
              {/* 最近错误列表 */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-white">最近错误</h4>
                {errorStats.recent.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {errorStats.recent.map((error, index) => (
                      <div key={error.errorId} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {error.errorType}: {error.message}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {new Date(error.timestamp).toLocaleTimeString()}
                          {error.location && <span className="ml-2">• {error.location}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无错误记录</p>
                )}
              </div>
              
              {/* 错误类型统计 */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-white">错误类型分布</h4>
                <div className="space-y-1">
                  {Object.entries(errorStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">{type}</span>
                      <span className="font-medium text-gray-800 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => errorService.clearErrors()}
                  className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="清除所有错误记录"
                >
                  清除错误
                </button>
                <button
                  onClick={() => errorService.clearAlerts()}
                  className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="清除所有预警"
                >
                  清除预警
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;