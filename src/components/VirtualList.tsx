import * as React from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns: number;
  isDark: boolean;
  height?: number;
  itemHeight?: number;
  overscan?: number;
}

// 简化泛型组件定义
export default function VirtualList<T>({
  items,
  renderItem,
  columns,
  isDark,
  height,
  itemHeight = 220,
  overscan = 2,
}: VirtualListProps<T>) {
  // 初始化默认值，避免SSR期间访问window
  const [windowWidth, setWindowWidth] = React.useState(1200);
  const [isMounted, setIsMounted] = React.useState(false);
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const effectiveHeight = height || 600;

  // 在客户端挂载后初始化windowWidth并添加resize事件监听
  React.useEffect(() => {
    // 只在浏览器环境中执行
    if (typeof window === 'undefined') return;
    
    // 初始化windowWidth
    setWindowWidth(window.innerWidth);
    setIsMounted(true);
    
    // 添加resize事件监听
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 确保服务器端和客户端渲染一致，避免hydration错误
  // 服务器端始终使用columns，客户端挂载后才使用responsiveColumns
  const responsiveColumns = React.useMemo(() => {
    // 服务器端渲染或未挂载时，始终使用原始columns值
    if (!isMounted) return columns;
    
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return Math.min(columns, 2);
    return columns;
  }, [isMounted, windowWidth, columns]);

  // 计算可见区域的项目索引
  const getVisibleItemRange = React.useMemo(() => {
    // 计算可见区域的起始和结束行索引
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endRow = Math.min(
      Math.ceil(items.length / responsiveColumns),
      Math.ceil(scrollTop / itemHeight) + Math.ceil(effectiveHeight / itemHeight) + overscan
    );

    // 计算对应的项目索引范围
    const startIndex = startRow * responsiveColumns;
    const endIndex = Math.min(items.length, endRow * responsiveColumns);

    return { startIndex, endIndex, startRow };
  }, [scrollTop, effectiveHeight, itemHeight, items.length, responsiveColumns, overscan]);

  // 计算可见区域内的项目
  const visibleItems = React.useMemo(() => {
    return items.slice(getVisibleItemRange.startIndex, getVisibleItemRange.endIndex);
  }, [items, getVisibleItemRange.startIndex, getVisibleItemRange.endIndex]);

  // 计算顶部填充高度
  const topPadding = getVisibleItemRange.startRow * itemHeight;

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // 对于手机端，不使用虚拟滚动，直接渲染所有项目
  // 这是因为手机端屏幕高度较小，虚拟滚动的优势不明显，反而容易出现计算错误
  if (isMounted && windowWidth < 640) {
    return (
      <div 
        className={`overflow-y-auto p-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        style={{ 
          height: height || 'auto',
        }}
      >
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
          }}
        >
          {items.map((item, index) => {
            return (
              <div key={index} className="h-full">
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 对于桌面端，继续使用虚拟滚动
  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto p-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      style={{ 
        height: effectiveHeight,
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      {/* 虚拟列表容器 */}
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
          minHeight: `${Math.ceil(items.length / responsiveColumns) * itemHeight}px`,
          position: 'relative',
        }}
      >
        {/* 顶部填充 */}
        <div style={{ height: topPadding }} />

        {/* 可见项目 */}
        {visibleItems.map((item, index) => {
          const actualIndex = getVisibleItemRange.startIndex + index;
          return (
            <div key={actualIndex} className="h-full" style={{ height: itemHeight - 16 }}>
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}