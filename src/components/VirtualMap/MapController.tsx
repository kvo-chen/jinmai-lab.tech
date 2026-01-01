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
  
  // 鼠标事件状态
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);
  const [isClick, setIsClick] = useState<boolean>(false);
  
  // 处理鼠标按下事件（开始拖拽）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只处理左键拖拽
    if (e.button !== 0) return;
    
    const coordinate = {
      x: e.clientX,
      y: e.clientY
    };
    
    // 记录鼠标按下位置，用于判断是点击还是拖拽
    setMouseStart(coordinate);
    setIsClick(true);
    
    startDrag(coordinate);
  };
  
  // 检查是否点击或悬停了POI - 优化版本
  const checkPOIInteraction = React.useCallback((screenCoord: Coordinate) => {
    try {
      // 动态计算交互区域半径，根据缩放级别调整
      const baseRadius = 25;
      
      // 获取地图状态，添加空值检查
      const mapState = useMapState.getState();
      const currentZoom = mapState.zoom;
      if (currentZoom === undefined) return null;
      
      // 直接从mapState获取最新的pois数据，而不是依赖外部传入的pois
      const pois = mapState.pois;
      
      const interactionRadius = Math.min(40, baseRadius + (currentZoom - 1) * 2);
      
      // 预计算交互区域的平方，避免重复计算平方根
      const interactionRadiusSquared = interactionRadius * interactionRadius;
      
      // 快速过滤出视口附近的POI，减少计算量
      for (const poi of pois) {
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
  }, [worldToScreen]);
  
  // 添加防抖函数，优化悬停检查频率
  const debounce = React.useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);
  
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
    
    // 检查是否是点击还是拖拽
    if (mouseStart) {
      const dx = e.clientX - mouseStart.x;
      const dy = e.clientY - mouseStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果拖拽距离超过3px，就不是点击事件
      if (distance > 3) {
        setIsClick(false);
      }
    }
    
    // 只有在非拖拽状态下才处理悬停事件
    if (!isDragging) {
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
    // 重置点击状态
    setIsClick(false);
    setMouseStart(null);
  };
  
  // 处理鼠标滚轮事件（平滑缩放）
  const handleWheel = (e: React.WheelEvent) => {
    // 阻止默认页面滚动行为
    e.preventDefault();
    // 阻止事件冒泡到父元素
    e.stopPropagation();
    
    // 获取当前缩放级别，添加空值检查
    const currentZoom = useMapState.getState().zoom;
    if (currentZoom === undefined) return;
    
    // 根据滚轮速度和当前缩放级别动态调整缩放步长
    // 缩放级别越高，步长越小，实现更精确的缩放
    const baseScaleFactor = 0.15;
    const scaleFactor = baseScaleFactor * (1 - (currentZoom - 1) * 0.05);
    
    // 计算缩放方向和强度
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
    
    // 计算新的缩放级别
    let newZoom: number = currentZoom + delta;
    
    // 限制缩放范围，避免超出边界
    newZoom = Math.max(3, Math.min(10, newZoom)); // 使用固定值代替不存在的mapState属性
    
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
      
      // 直接从mapState获取最新的POI数据和方法
      const mapState = useMapState.getState();
      
      // 使用点击元素的实际尺寸，而不是依赖state.width和state.height
      const actualWidth = rect.width;
      const actualHeight = rect.height;
      
      // 直接在点击事件中检查是否点击了POI，确保使用最新的POI数据
      let clickedPOI: POI | null = null;
      
      // 增加交互半径，确保更容易点击到POI
      const interactionRadius = 40; // 固定的大半径，确保点击到POI
      const interactionRadiusSquared = interactionRadius * interactionRadius;
      
      console.log('检测点击:', screenCoord, '交互半径:', interactionRadius, 'POI数量:', mapState.pois.length);
      
      for (const poi of mapState.pois) {
        // 使用mapState中的worldToScreen方法计算POI的屏幕坐标
        const poiScreenCoord = mapState.worldToScreen(poi.coordinate);
        
        const dx = screenCoord.x - poiScreenCoord.x;
        const dy = screenCoord.y - poiScreenCoord.y;
        const distanceSquared = dx * dx + dy * dy;
        
        console.log('POI:', poi.id, poi.name, '坐标:', poiScreenCoord, '距离:', Math.sqrt(distanceSquared));
        
        if (distanceSquared <= interactionRadiusSquared) {
          clickedPOI = poi;
          break;
        }
      }
      
      if (clickedPOI && onPOIClick) {
        console.log('点击了POI:', clickedPOI.id, clickedPOI.name);
        onPOIClick(clickedPOI.id);
        // 重置状态
        setIsClick(false);
        setMouseStart(null);
        return;
      }
      
      // 否则触发地图点击事件
      if (onMapClick) {
        const worldCoord = mapState.screenToWorld(screenCoord);
        onMapClick(worldCoord);
      }
      
      // 重置状态
      setIsClick(false);
      setMouseStart(null);
    } catch (error) {
      console.error('处理地图点击事件时出错:', error);
      // 重置状态
      setIsClick(false);
      setMouseStart(null);
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