import React, { useState } from 'react';
import { useMapState } from './useMapState';
import { Coordinate, POI } from './types';

interface MapControllerProps {
  children?: React.ReactNode;
  onPOIClick?: (poiId: string) => void;
  onMapClick?: (coordinate: Coordinate) => void;
}

const MapController: React.FC<MapControllerProps> = ({ 
  children, 
  onPOIClick, 
  onMapClick 
}) => {
  // 获取地图状态
  const {
    isDragging,
    startDrag,
    drag,
    endDrag,
    zoomIn,
    zoomOut,
    setZoom,
    screenToWorld,
    worldToScreen,
    pois,
    setHoveredPOI
  } = useMapState();
  
  // 触摸事件状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  
  // 处理鼠标按下事件（开始拖拽）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只处理左键拖拽
    if (e.button !== 0) return;
    
    const coordinate = {
      x: e.clientX,
      y: e.clientY
    };
    
    startDrag(coordinate);
  };
  
  // 检查是否点击或悬停了POI - 优化版本
  const checkPOIInteraction = (screenCoord: Coordinate) => {
    try {
      // 动态计算交互区域半径，根据缩放级别调整
      const baseRadius = 25;
      
      // 获取地图状态，添加空值检查
      const mapState = useMapState.getState();
      const currentZoom = mapState.zoom;
      if (currentZoom === undefined) return null;
      
      const interactionRadius = Math.min(40, baseRadius + (currentZoom - 1) * 2);
      
      // 预计算交互区域的平方，避免重复计算平方根
      const interactionRadiusSquared = interactionRadius * interactionRadius;
      
      // 只检查视口内的POI，减少计算量
      const viewport = mapState.getViewport();
      if (!viewport) return null;
      
      // 快速过滤出视口附近的POI
      const visiblePOIs = pois.filter(poi => {
        const coord = poi.coordinate;
        return coord.x >= viewport.x - interactionRadius && 
               coord.x <= viewport.x + viewport.width + interactionRadius && 
               coord.y >= viewport.y - interactionRadius && 
               coord.y <= viewport.y + viewport.height + interactionRadius;
      });
      
      // 遍历可见POI，检查是否在交互区域内
      for (const poi of visiblePOIs) {
        // 使用从useMapState获取的worldToScreen方法转换POI坐标
        const poiScreenCoord = worldToScreen(poi.coordinate);
        
        // 使用平方距离比较，避免昂贵的sqrt运算
        const dx = screenCoord.x - poiScreenCoord.x;
        const dy = screenCoord.y - poiScreenCoord.y;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= interactionRadiusSquared) {
          return poi;
        }
      }
    } catch (error) {
      console.error('检查POI交互时出错:', error);
    }
    
    return null;
  };
  
  // 添加防抖函数，优化悬停检查频率
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // 防抖处理悬停检查，减少不必要的计算
  const debouncedHoverCheck = React.useCallback(
    debounce((screenCoord: Coordinate) => {
      // 检查是否悬停在POI上
      const hoveredPOI = checkPOIInteraction(screenCoord);
      if (hoveredPOI) {
        setHoveredPOI(hoveredPOI.id);
      } else {
        setHoveredPOI(null);
      }
    }, 30), // 30ms延迟，减少计算频率
    [checkPOIInteraction, setHoveredPOI]
  );
  
  // 处理鼠标移动事件（拖拽中）
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // 处理拖拽事件
    const coordinate = {
      x: e.clientX,
      y: e.clientY
    };
    
    drag(coordinate);
    
    // 处理悬停事件 - 使用防抖优化
    try {
      // 获取鼠标相对于Canvas元素的坐标
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      const screenCoord = {
        x: canvasX,
        y: canvasY
      };
      
      // 使用防抖函数处理悬停检查
      debouncedHoverCheck(screenCoord);
    } catch (error) {
      console.error('处理鼠标悬停事件时出错:', error);
    }
  };
  
  // 处理鼠标释放事件（结束拖拽）
  const handleMouseUp = () => {
    endDrag();
  };
  
  // 处理鼠标离开事件（结束拖拽并清除悬停状态）
  const handleMouseLeave = () => {
    endDrag();
    setHoveredPOI(null);
  };
  
  // 处理鼠标滚轮事件（平滑缩放）
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // 根据滚轮速度调整缩放步长，实现平滑缩放
    const scaleFactor = 0.15;
    // 计算缩放方向和强度
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
    
    // 获取当前缩放级别，添加空值检查
    const currentZoom = useMapState.getState().zoom;
    if (currentZoom === undefined) return;
    
    // 计算新的缩放级别，添加平滑过渡效果
    const newZoom = currentZoom + delta;
    
    // 使用setZoom实现平滑缩放
    setZoom(newZoom as any);
  };
  
  // 处理地图点击事件
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      // 获取点击事件的目标元素
      const target = e.currentTarget;
      // 获取Canvas元素相对于浏览器窗口的位置
      const rect = target.getBoundingClientRect();
      // 计算点击位置相对于Canvas元素的坐标
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      const screenCoord = {
        x: canvasX,
        y: canvasY
      };
      
      const worldCoord = screenToWorld(screenCoord);
      
      // 检查是否点击了POI
      const clickedPOI = checkPOIInteraction(screenCoord);
      if (clickedPOI && onPOIClick) {
        console.log('点击了POI:', clickedPOI.id, clickedPOI.name);
        onPOIClick(clickedPOI.id);
        return;
      }
      
      // 否则触发地图点击事件
      if (onMapClick) {
        onMapClick(worldCoord);
      }
    } catch (error) {
      console.error('处理地图点击事件时出错:', error);
    }
  };
  

  
  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 单点触摸（开始拖拽）
      const touch = e.touches[0];
      const coordinate = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      setTouchStart(coordinate);
      startDrag(coordinate);
    } else if (e.touches.length === 2) {
      // 双指触摸（开始缩放）
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setLastTouchDistance(distance);
    }
  };
  
  // 处理触摸移动事件
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 单点触摸（拖拽中）
      if (!touchStart) return;
      
      const touch = e.touches[0];
      const coordinate = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      drag(coordinate);
      setTouchStart(coordinate);
    } else if (e.touches.length === 2) {
      // 双指触摸（缩放中）
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastTouchDistance) {
        const scaleFactor = currentDistance / lastTouchDistance;
        
        // 获取当前缩放级别
        const currentZoom = useMapState.getState().zoom;
        
        // 计算新的缩放级别，使用平滑缩放
        const zoomDelta = (scaleFactor - 1) * 0.5;
        const newZoom = currentZoom + zoomDelta;
        
        // 使用setZoom实现平滑缩放
        setZoom(newZoom as any);
      }
      
      setLastTouchDistance(currentDistance);
    }
  };
  
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    setTouchStart(null);
    setLastTouchDistance(null);
    endDrag();
  };
  
  // 处理触摸取消事件
  const handleTouchCancel = () => {
    setTouchStart(null);
    setLastTouchDistance(null);
    endDrag();
  };
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', // 禁用默认触摸行为
        background: 'transparent'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};

export default MapController;