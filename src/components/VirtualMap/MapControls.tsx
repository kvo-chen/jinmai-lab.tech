import React from 'react';
import { useMapState, DEFAULT_CONFIG } from './useMapState';
import { MapTheme } from './types';

interface MapControlsProps {
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({ className = '' }) => {
  const {
    zoom,
    zoomIn,
    zoomOut,
    center,
    updateCenter,
    themes,
    setTheme,
    width,
    getViewport
  } = useMapState();
  
  // 从DEFAULT_CONFIG获取minZoom和maxZoom，而不是从状态中获取
  const minZoom = DEFAULT_CONFIG.minZoom;
  const maxZoom = DEFAULT_CONFIG.maxZoom;
  
  // 计算当前比例尺（像素/单位）
  const viewport = getViewport();
  const scale = Math.pow(2, zoom - 1);
  const pixelsPerUnit = scale;
  const unitsPerPixel = 1 / scale;
  
  // 计算公里/像素
  const kmPerPixel = unitsPerPixel / 100;
  
  // 处理主题切换
  const handleThemeChange = () => {
    try {
      // 获取当前主题和主题列表
      const currentTheme = useMapState.getState().theme;
      // 确保themes和currentTheme都存在
      if (!themes || !currentTheme) return;
      
      // 获取当前主题索引
      const currentIndex = themes.findIndex(t => t.name === currentTheme.name);
      // 切换到下一个主题
      const nextIndex = (currentIndex + 1) % themes.length;
      setTheme(themes[nextIndex]);
    } catch (error) {
      console.error('切换主题时出错:', error);
    }
  };
  
  // 重置地图视图
  const handleResetView = () => {
    updateCenter({ x: 500, y: 500 });
  };
  
  return (
    <div className={`absolute top-4 right-4 z-10 flex flex-col gap-2 ${className}`}>
      {/* 缩放控件 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <button
          className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
          onClick={zoomIn}
          disabled={zoom >= maxZoom}
          aria-label="放大地图"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
        <div className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-medium">
          {zoom}
        </div>
        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
        <button
          className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
          onClick={zoomOut}
          disabled={zoom <= minZoom}
          aria-label="缩小地图"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
      
      {/* 主题切换 */}
      <button
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-10 h-10 flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={handleThemeChange}
        aria-label="切换地图主题"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
      
      {/* 指南针 */}
      <button
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-10 h-10 flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={handleResetView}
        aria-label="重置地图视图"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.33 5.88 3 6.27 3 6.695V18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      </button>
      
      {/* 比例尺 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2">
        <div className="h-4 border-r border-gray-300 dark:border-gray-600 w-1"></div>
        <div className="flex items-center gap-1">
          <div className="w-12 h-1 bg-blue-500"></div>
          <div className="w-6 h-1 border border-gray-300 dark:border-gray-600 bg-transparent"></div>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {(kmPerPixel * 18).toFixed(1)} km
        </div>
      </div>
    </div>
  );
};

export default MapControls;