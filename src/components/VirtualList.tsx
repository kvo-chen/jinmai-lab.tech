import * as React from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  isDark: boolean;
  height?: number | string;
  itemHeight?: number;
  overscan?: number;
}

// 优化的列表组件，直接渲染所有项目，保持响应式布局和流畅滚动
export default function VirtualList<T>({
  items,
  renderItem,
  columns = 3,
  isDark,
}: VirtualListProps<T>) {
  // 使用状态跟踪响应式列数
  const [columnCount, setColumnCount] = React.useState(columns);
  
  // 响应式列数处理
  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      let newColumns = columns;
      if (window.innerWidth < 640) {
        newColumns = 1;
      } else if (window.innerWidth < 768) {
        newColumns = 2;
      } else if (window.innerWidth < 1024) {
        newColumns = 3;
      } else if (window.innerWidth < 1280) {
        newColumns = 4;
      } else {
        newColumns = Math.min(columns, 5);
      }
      
      setColumnCount(newColumns);
    };

    // 初始设置
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  return (
    <div 
      className={`${isDark ? 'bg-gray-900' : 'bg-white'}`}
      style={{
        // 优化滚动性能
        scrollbarWidth: 'thin',
        scrollbarColor: isDark ? '#4a5568 #1f2937' : '#d1d5db #f3f4f6',
        WebkitOverflowScrolling: 'touch', // 启用原生触摸滚动优化
        scrollBehavior: 'smooth', // 平滑滚动
        overflow: 'visible', // 允许内容自然流动
      }}
    >
      {/* 直接渲染所有项目，保持响应式布局 */}
      <div 
        className="grid gap-4 p-2"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
      
      {/* 自定义滚动条样式 */}
      <style>{`
        /* 滚动条样式 */
        body::-webkit-scrollbar {
          width: 8px;
        }
        body::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border-radius: 4px;
        }
        body::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4a5568' : '#d1d5db'};
          border-radius: 4px;
        }
        body::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#718096' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
}