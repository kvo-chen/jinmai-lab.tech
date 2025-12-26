import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMapState } from './useMapState';
import { Coordinate, POI, Region, Path } from './types';

interface MapRendererProps {
  className?: string;
}

const MapRenderer: React.FC<MapRendererProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // 获取地图状态
  const {
    center,
    zoom,
    theme,
    regions,
    pois,
    paths,
    worldToScreen,
    getViewport,
    setSize,
    hoveredPOIId
  } = useMapState();
  
  // 更新地图尺寸 - 优化版本，支持高DPI和响应式布局
  const updateMapSize = useCallback(() => {
    let actualWidth = 800;
    let actualHeight = 600;
    
    // 首先检查containerRef是否存在，如果存在则使用实际尺寸
    if (containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // 获取设备像素比，支持高DPI屏幕
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // 确保尺寸不为0，避免绘制错误
      actualWidth = rect.width || 800;
      actualHeight = rect.height || 600;
      
      // 更新主Canvas尺寸，考虑设备像素比
      const canvas = canvasRef.current;
      if (canvas) {
        // 设置Canvas的实际像素尺寸，提升高DPI屏幕显示效果
        canvas.width = actualWidth * devicePixelRatio;
        canvas.height = actualHeight * devicePixelRatio;
        
        // 设置Canvas的CSS尺寸，保持正确的显示大小
        canvas.style.width = `${actualWidth}px`;
        canvas.style.height = `${actualHeight}px`;
        
        // 获取上下文并调整缩放比例
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        
        setIsReady(true);
      }
    }
    
    // 更新地图状态中的尺寸（使用CSS像素尺寸，不考虑设备像素比）
    setSize(actualWidth, actualHeight);
  }, [setSize]);
  
  // 初始化Canvas和尺寸监听
  useEffect(() => {
    // 初始更新尺寸
    updateMapSize();
    
    // 添加resize事件监听
    window.addEventListener('resize', updateMapSize);
    
    // 添加设备方向变化监听，支持移动设备横屏竖屏切换
    window.addEventListener('orientationchange', updateMapSize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', updateMapSize);
      window.removeEventListener('orientationchange', updateMapSize);
    };
  }, [updateMapSize]);
  
  // 缓存视口信息和缩放比例，减少不必要的重新计算
  const viewportInfo = useMemo(() => {
    return {
      viewport: getViewport(),
      scale: Math.pow(2, zoom - 1)
    };
  }, [center, zoom, getViewport]);
  
  // 添加防抖函数，优化渲染性能
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
  
  // 绘制网格线
  const drawGrid = (ctx: CanvasRenderingContext2D, viewport: ReturnType<typeof getViewport>, scale: number, canvasWidth: number, canvasHeight: number) => {
    try {
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      
      // 计算网格间距，根据缩放级别动态调整
      const baseGridSize = 50;
      const gridSize = baseGridSize * Math.pow(0.5, Math.floor(zoom / 2));
      const scaledGridSize = gridSize * scale;
      
      // 绘制网格背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制垂直线
      for (let x = -20; x < 21; x++) {
        const worldX = center.x + x * gridSize;
        const screenX = worldToScreen({ x: worldX, y: center.y }).x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvasHeight);
        ctx.stroke();
      }
      
      // 绘制水平线
      for (let y = -20; y < 21; y++) {
        const worldY = center.y + y * gridSize;
        const screenY = worldToScreen({ x: center.x, y: worldY }).y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvasWidth, screenY);
        ctx.stroke();
      }
    } catch (error) {
      console.error('绘制网格线时出错:', error);
    }
  };
  
  // 绘制区域
  const drawRegions = (ctx: CanvasRenderingContext2D, regions: Region[], currentZoom: number, worldToScreen: (coord: Coordinate) => Coordinate, viewport: ReturnType<typeof getViewport>) => {
    // 首先过滤出需要绘制的区域
    const visibleRegions = regions.filter(region => {
      // 只有当区域的缩放级别小于等于当前缩放级别时才考虑
      if (region.zoomLevel > currentZoom) return false;
      if (region.coordinates.length < 2) return false;
      
      // 快速检查区域是否在视口外 - 使用边界框检查
      let minRegionX = Number.MAX_VALUE;
      let minRegionY = Number.MAX_VALUE;
      let maxRegionX = Number.MIN_VALUE;
      let maxRegionY = Number.MIN_VALUE;
      
      // 计算区域边界框
      for (const coord of region.coordinates) {
        minRegionX = Math.min(minRegionX, coord.x);
        minRegionY = Math.min(minRegionY, coord.y);
        maxRegionX = Math.max(maxRegionX, coord.x);
        maxRegionY = Math.max(maxRegionY, coord.y);
      }
      
      // 检查边界框是否与视口相交
      return !(maxRegionX < viewport.x || minRegionX > viewport.x + viewport.width ||
              maxRegionY < viewport.y || minRegionY > viewport.y + viewport.height);
    });
    
    // 如果没有可见区域，直接返回
    if (visibleRegions.length === 0) return;
    
    // 绘制可见区域
    visibleRegions.forEach(region => {
      try {
        // 开始绘制区域路径
        ctx.beginPath();
        
        // 移动到第一个点
        const firstPoint = worldToScreen(region.coordinates[0]);
        // 验证坐标有效性
        if (isNaN(firstPoint.x) || isNaN(firstPoint.y)) return;
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        // 连接其他点
        let isValidPath = true;
        let minX = firstPoint.x;
        let maxX = firstPoint.x;
        let minY = firstPoint.y;
        let maxY = firstPoint.y;
        
        for (let i = 1; i < region.coordinates.length; i++) {
          const point = worldToScreen(region.coordinates[i]);
          // 验证坐标有效性
          if (isNaN(point.x) || isNaN(point.y)) {
            isValidPath = false;
            break;
          }
          
          // 更新边界
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
          
          ctx.lineTo(point.x, point.y);
        }
        
        if (!isValidPath) return;
        
        // 闭合路径
        ctx.closePath();
        
        // 填充区域（跳过渐变，使用纯色填充，提高性能）
        ctx.fillStyle = region.color;
        ctx.globalAlpha = theme.regionFillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 绘制边框 - 简化样式，提高性能
        ctx.strokeStyle = region.borderColor;
        ctx.lineWidth = region.borderWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 绘制区域名称（仅在高缩放级别）
        if (currentZoom >= 5) {
          // 计算区域中心点
          const centerX = region.coordinates.reduce((sum, coord) => sum + coord.x, 0) / region.coordinates.length;
          const centerY = region.coordinates.reduce((sum, coord) => sum + coord.y, 0) / region.coordinates.length;
          const centerScreen = worldToScreen({ x: centerX, y: centerY });
          
          // 简化文本绘制，使用矩形背景
          ctx.fillStyle = theme.backgroundColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const textWidth = ctx.measureText(region.name).width;
          const textHeight = 24;
          const textPadding = 8;
          
          // 绘制矩形背景
          ctx.fillRect(
            centerScreen.x - textWidth / 2 - textPadding,
            centerScreen.y - textHeight / 2,
            textWidth + textPadding * 2,
            textHeight
          );
          
          // 绘制区域名称
          ctx.fillStyle = theme.textColor;
          ctx.shadowBlur = 0;
          ctx.fillText(region.name, centerScreen.x, centerScreen.y);
        }
      } catch (error) {
        console.warn('绘制区域时出错:', error, '区域:', region.id);
      }
    });
  };
  
  // 绘制POI - 优化版本
  const drawPOIs = (ctx: CanvasRenderingContext2D, pois: POI[], canvasWidth: number, canvasHeight: number, worldToScreen: (coord: Coordinate) => Coordinate, viewport: ReturnType<typeof getViewport>) => {
    // 快速过滤出视口内的POI - 精确可见性剔除
    const visiblePOIs = pois.filter(poi => {
      const coord = poi.coordinate;
      // 精确计算可见范围，减少不必要的绘制
      return coord.x >= viewport.x - 100 && coord.x <= viewport.x + viewport.width + 100 &&
             coord.y >= viewport.y - 100 && coord.y <= viewport.y + viewport.height + 100;
    });
    
    // 如果没有可见POI，直接返回
    if (visiblePOIs.length === 0) return;
    
    // POI聚类配置
    const enableClustering = zoom < 7; // 在低缩放级别启用聚类
    // 动态调整聚类网格大小，根据缩放级别自动调整
    const clusterGridSize = Math.max(20, 60 - (zoom - 1) * 5); // 缩放级别越高，网格越小
    const baseIconSize = theme.poiIconSize;
    const shadowBlur = 6;
    
    // 动态调整图标大小，根据缩放级别
    const iconSize = Math.max(baseIconSize, baseIconSize * (1 + (zoom - 1) * 0.2));
    
    if (enableClustering) {
      // 基于密度的聚类算法，考虑POI的重要性
      const clusters: { [key: string]: POI[] } = {};
      
      // 将POI分配到网格单元格
      visiblePOIs.forEach(poi => {
        // 计算POI所在的网格单元格坐标
        const gridX = Math.floor(poi.coordinate.x / clusterGridSize);
        const gridY = Math.floor(poi.coordinate.y / clusterGridSize);
        const gridKey = `${gridX},${gridY}`;
        
        // 将POI添加到对应单元格
        if (!clusters[gridKey]) {
          clusters[gridKey] = [];
        }
        clusters[gridKey].push(poi);
      });
      
      // 绘制聚类标记
      Object.values(clusters).forEach(poiCluster => {
        try {
          // 计算加权聚类中心，考虑POI的重要性
          const totalImportance = poiCluster.reduce((sum, poi) => sum + (poi.importance || 1), 0);
          const centerX = poiCluster.reduce((sum, poi) => sum + poi.coordinate.x * (poi.importance || 1), 0) / totalImportance;
          const centerY = poiCluster.reduce((sum, poi) => sum + poi.coordinate.y * (poi.importance || 1), 0) / totalImportance;
          const clusterCenter = { x: centerX, y: centerY };
          
          const screenCoord = worldToScreen(clusterCenter);
          
          // 验证坐标有效性
          if (isNaN(screenCoord.x) || isNaN(screenCoord.y)) return;
          
          // 检查聚类是否在可视范围内
          if (screenCoord.x < -100 || screenCoord.x > canvasWidth + 100 || screenCoord.y < -100 || screenCoord.y > canvasHeight + 100) {
            return;
          }
          
          // 根据聚类大小调整图标大小
          const clusterSize = poiCluster.length;
          const scaledIconSize = Math.max(baseIconSize * 1.5, baseIconSize + Math.min(clusterSize * 0.8, 30));
          
          // 绘制聚类阴影效果
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          
          // 根据聚类中POI的类别选择颜色
          const categoryCounts: { [key: string]: number } = {};
          poiCluster.forEach(poi => {
            categoryCounts[poi.category] = (categoryCounts[poi.category] || 0) + 1;
          });
          const dominantCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
          
          // 根据主要类别选择聚类颜色
          const categoryColors: { [key: string]: string } = {
            food: '#ef4444',
            retail: '#3b82f6',
            craft: '#8b5cf6',
            landmark: '#f59e0b',
            culture: '#10b981',
            default: '#6b7280'
          };
          
          const clusterColor = categoryColors[dominantCategory] || categoryColors.default;
          
          // 创建聚类渐变背景
          const gradient = ctx.createRadialGradient(
            screenCoord.x, screenCoord.y, 0,
            screenCoord.x, screenCoord.y, scaledIconSize
          );
          gradient.addColorStop(0, clusterColor);
          gradient.addColorStop(1, clusterColor + '99');
          
          // 绘制聚类背景圆
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenCoord.x, screenCoord.y, scaledIconSize, 0, Math.PI * 2);
          ctx.fill();
          
          // 绘制聚类边框
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // 绘制聚类内部光晕效果
          const innerGradient = ctx.createRadialGradient(
            screenCoord.x, screenCoord.y, 0,
            screenCoord.x, screenCoord.y, scaledIconSize * 0.6
          );
          innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = innerGradient;
          ctx.beginPath();
          ctx.arc(screenCoord.x, screenCoord.y, scaledIconSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
          
          // 恢复上下文状态
          ctx.restore();
          
          // 绘制聚类数量，使用更醒目的样式
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.min(scaledIconSize * 0.6, 18)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(clusterSize.toString(), screenCoord.x, screenCoord.y);
          
          // 添加聚类类型图标（使用最多的类别）
          if (clusterSize > 1) {
            // 绘制小图标表示主要类别
            ctx.save();
            ctx.translate(screenCoord.x + scaledIconSize * 0.6, screenCoord.y - scaledIconSize * 0.6);
            ctx.scale(0.5, 0.5);
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const smallIconSize = iconSize * 0.8;
            
            // 绘制类别图标背景
            ctx.fillStyle = clusterColor;
            ctx.beginPath();
            ctx.arc(0, 0, smallIconSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            
            if (dominantCategory === 'food') {
              // 餐饮美食 - 绘制简化图标
              ctx.arc(0, 0, smallIconSize * 0.7, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = clusterColor;
              ctx.fillRect(-smallIconSize * 0.2, -smallIconSize * 0.6, smallIconSize * 0.4, smallIconSize * 1.2);
            } else if (dominantCategory === 'retail') {
              // 零售百货 - 绘制购物袋图标
              ctx.arc(0, 0, smallIconSize, 0, Math.PI, true);
              ctx.lineTo(-smallIconSize, -smallIconSize);
              ctx.lineTo(smallIconSize, -smallIconSize);
              ctx.closePath();
              ctx.fill();
            } else if (dominantCategory === 'craft') {
              // 手工艺 - 绘制画笔图标
              ctx.moveTo(-smallIconSize, -smallIconSize);
              ctx.lineTo(smallIconSize, smallIconSize);
              ctx.lineTo(smallIconSize - smallIconSize * 0.3, smallIconSize);
              ctx.lineTo(-smallIconSize + smallIconSize * 0.3, -smallIconSize);
              ctx.closePath();
              ctx.fill();
            } else if (dominantCategory === 'landmark') {
              // 地标建筑 - 绘制建筑图标
              ctx.fillRect(-smallIconSize, -smallIconSize, smallIconSize * 2, smallIconSize * 2);
              ctx.fill();
              ctx.fillStyle = clusterColor;
              ctx.fillRect(-smallIconSize * 0.5, -smallIconSize, smallIconSize, smallIconSize * 2);
            } else if (dominantCategory === 'culture') {
              // 文化艺术 - 绘制书本图标
              ctx.fillRect(-smallIconSize, -smallIconSize, smallIconSize * 2, smallIconSize * 1.8);
              ctx.fill();
              ctx.fillStyle = clusterColor;
              ctx.fillRect(-smallIconSize, -smallIconSize * 0.3, smallIconSize * 2, smallIconSize * 0.15);
            } else {
              // 默认图标 - 绘制简单的圆点
              ctx.arc(0, 0, smallIconSize * 0.5, 0, Math.PI * 2);
              ctx.fill();
            }
            
            ctx.restore();
          }
          
          // 添加聚类脉动动画效果（静态模拟）
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = clusterColor;
          ctx.beginPath();
          ctx.arc(screenCoord.x, screenCoord.y, scaledIconSize * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } catch (error) {
          console.warn('绘制聚类时出错:', error);
        }
      });
    } else {
      // 绘制单个POI标记
      visiblePOIs.forEach(poi => {
        try {
          const screenCoord = worldToScreen(poi.coordinate);
          
          // 验证坐标有效性
          if (isNaN(screenCoord.x) || isNaN(screenCoord.y)) return;
          
          // 检查POI是否在可视范围内（考虑绘制半径）
          if (screenCoord.x < -100 || screenCoord.x > canvasWidth + 100 || screenCoord.y < -100 || screenCoord.y > canvasHeight + 100) {
            return;
          }
          
          const poiColor = poi.color || '#3b82f6';
          const isHovered = poi.id === hoveredPOIId;
          const scaledIconSize = isHovered ? iconSize * 1.3 : iconSize;
          
          // 绘制POI阴影效果
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = isHovered ? 12 : 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          
          // 创建品牌专属渐变背景
          const gradient = ctx.createRadialGradient(
            screenCoord.x, screenCoord.y, 0,
            screenCoord.x, screenCoord.y, scaledIconSize
          );
          gradient.addColorStop(0, poiColor);
          gradient.addColorStop(1, poiColor + 'cc');
          
          // 绘制POI背景圆
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenCoord.x, screenCoord.y, scaledIconSize, 0, Math.PI * 2);
          ctx.fill();
          
          // 绘制POI边框 - 悬停时边框更宽
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isHovered ? 4 : 3;
          ctx.stroke();
          
          // 恢复上下文状态
          ctx.restore();
          
          // 绘制品牌专属图标
          ctx.fillStyle = '#ffffff';
          ctx.save();
          ctx.translate(screenCoord.x, screenCoord.y);
          
          // 根据POI类型绘制不同的品牌专属图标
          const innerIconSize = scaledIconSize * 0.7;
          
          // 改进的类别图标绘制
          ctx.beginPath();
          
          if (poi.category === 'food') {
            // 餐饮美食 - 绘制餐具图标
            ctx.arc(0, 0, innerIconSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = poiColor;
            ctx.fillRect(-innerIconSize * 0.2, -innerIconSize * 0.8, innerIconSize * 0.4, innerIconSize * 1.6);
            ctx.fillRect(-innerIconSize * 0.6, -innerIconSize * 0.2, innerIconSize * 1.2, innerIconSize * 0.4);
          } else if (poi.category === 'retail') {
            // 零售百货 - 绘制购物袋图标
            ctx.moveTo(-innerIconSize, -innerIconSize);
            ctx.lineTo(-innerIconSize, innerIconSize * 0.8);
            ctx.arcTo(-innerIconSize, innerIconSize, 0, innerIconSize, innerIconSize);
            ctx.arcTo(innerIconSize, innerIconSize, innerIconSize, innerIconSize * 0.8, innerIconSize);
            ctx.lineTo(innerIconSize, -innerIconSize);
            ctx.lineTo(0, -innerIconSize * 1.5);
            ctx.closePath();
            ctx.fill();
          } else if (poi.category === 'craft') {
            // 手工艺 - 绘制画笔图标
            // 画笔主体
            ctx.moveTo(-innerIconSize * 0.3, -innerIconSize);
            ctx.lineTo(innerIconSize * 0.3, -innerIconSize * 0.3);
            ctx.lineTo(innerIconSize, 0);
            ctx.lineTo(innerIconSize * 0.3, innerIconSize * 0.3);
            ctx.lineTo(-innerIconSize * 0.3, innerIconSize);
            ctx.lineTo(-innerIconSize, 0);
            ctx.closePath();
            ctx.fill();
            // 画笔笔尖
            ctx.beginPath();
            ctx.moveTo(innerIconSize, 0);
            ctx.lineTo(innerIconSize * 1.2, -innerIconSize * 0.3);
            ctx.lineTo(innerIconSize * 1.2, innerIconSize * 0.3);
            ctx.closePath();
            ctx.fill();
          } else if (poi.category === 'landmark') {
            // 地标建筑 - 绘制建筑图标
            // 建筑主体
            ctx.fillRect(-innerIconSize, -innerIconSize, innerIconSize * 2, innerIconSize * 2);
            // 屋顶
            ctx.beginPath();
            ctx.moveTo(-innerIconSize * 1.2, -innerIconSize);
            ctx.lineTo(0, -innerIconSize * 1.5);
            ctx.lineTo(innerIconSize * 1.2, -innerIconSize);
            ctx.closePath();
            ctx.fill();
            // 门
            ctx.fillRect(-innerIconSize * 0.25, innerIconSize * 0.3, innerIconSize * 0.5, innerIconSize * 0.7);
          } else if (poi.category === 'culture') {
            // 文化艺术 - 绘制书本图标
            // 书本主体
            ctx.fillRect(-innerIconSize, -innerIconSize * 0.6, innerIconSize * 2, innerIconSize * 1.2);
            // 书脊
            ctx.fillStyle = poiColor;
            ctx.fillRect(-innerIconSize * 1.1, -innerIconSize * 0.7, innerIconSize * 0.2, innerIconSize * 1.4);
            // 书页线
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-innerIconSize * 0.8, -innerIconSize * 0.2, innerIconSize * 1.6, innerIconSize * 0.1);
          } else {
            // 默认图标 - 绘制品牌徽章
            ctx.arc(0, 0, innerIconSize * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = poiColor;
            ctx.arc(0, 0, innerIconSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // 恢复上下文状态
          ctx.restore();
          
          // 悬停时显示品牌名称及简介
          if (isHovered) {
            // 添加文本背景，提高可读性
            ctx.fillStyle = theme.backgroundColor;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            const nameText = poi.name || '';
            ctx.font = 'bold 14px sans-serif';
            const nameWidth = ctx.measureText(nameText).width;
            
            // 绘制名称背景矩形
            const textPadding = 10;
            const nameHeight = 24;
            ctx.fillRect(
              screenCoord.x - nameWidth / 2 - textPadding,
              screenCoord.y + scaledIconSize + 10,
              nameWidth + textPadding * 2,
              nameHeight
            );
            
            // 绘制名称
            ctx.fillStyle = theme.textColor;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText(nameText, screenCoord.x, screenCoord.y + scaledIconSize + nameHeight / 2 + 10);
            
            // 显示品牌简介
            if (poi.description) {
              const descText = poi.description.length > 30 ? poi.description.substring(0, 30) + '...' : poi.description;
              ctx.font = '12px sans-serif';
              const descWidth = ctx.measureText(descText).width;
              const descHeight = 20;
              
              ctx.fillStyle = theme.backgroundColor;
              ctx.shadowBlur = 8;
              ctx.fillRect(
                screenCoord.x - descWidth / 2 - textPadding,
                screenCoord.y + scaledIconSize + nameHeight + 14,
                descWidth + textPadding * 2,
                descHeight
              );
              
              ctx.fillStyle = theme.textColor;
              ctx.shadowBlur = 0;
              ctx.fillText(descText, screenCoord.x, screenCoord.y + scaledIconSize + nameHeight + descHeight / 2 + 14);
            }
          } else if (zoom >= 6) {
            // 非悬停状态下，只在高缩放级别显示名称
            // 添加文本背景，提高可读性
            ctx.fillStyle = theme.backgroundColor;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            const text = poi.name || '';
            ctx.font = 'bold 13px sans-serif';
            const textWidth = ctx.measureText(text).width;
            
            // 绘制文本背景矩形
            const textPadding = 8;
            const textHeight = 22;
            ctx.fillRect(
              screenCoord.x - textWidth / 2 - textPadding,
              screenCoord.y + scaledIconSize + 8,
              textWidth + textPadding * 2,
              textHeight
            );
            
            // 绘制文本
            ctx.fillStyle = theme.textColor;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText(text, screenCoord.x, screenCoord.y + scaledIconSize + textHeight / 2 + 8);
          }
        } catch (error) {
          console.warn('绘制POI时出错:', error, 'POI:', poi.id);
        }
      });
    }
  };
  
  // 绘制路径
  const drawPaths = (ctx: CanvasRenderingContext2D, paths: Path[], worldToScreen: (coord: Coordinate) => Coordinate, viewport: ReturnType<typeof getViewport>) => {
    // 首先过滤出需要绘制的路径
    const visiblePaths = paths.filter(path => {
      if (path.points.length < 2) return false;
      
      // 快速检查路径是否在视口外 - 使用边界框检查
      let minPathX = Number.MAX_VALUE;
      let minPathY = Number.MAX_VALUE;
      let maxPathX = Number.MIN_VALUE;
      let maxPathY = Number.MIN_VALUE;
      
      // 计算路径边界框
      for (const point of path.points) {
        const coord = point.coordinate;
        minPathX = Math.min(minPathX, coord.x);
        minPathY = Math.min(minPathY, coord.y);
        maxPathX = Math.max(maxPathX, coord.x);
        maxPathY = Math.max(maxPathY, coord.y);
      }
      
      // 检查边界框是否与视口相交
      return !(maxPathX < viewport.x || minPathX > viewport.x + viewport.width ||
              maxPathY < viewport.y || minPathY > viewport.y + viewport.height);
    });
    
    // 如果没有可见路径，直接返回
    if (visiblePaths.length === 0) return;
    
    // 绘制可见路径
    visiblePaths.forEach(path => {
      try {
        ctx.beginPath();
        
        // 移动到第一个点
        const firstPoint = worldToScreen(path.points[0].coordinate);
        // 验证坐标有效性
        if (isNaN(firstPoint.x) || isNaN(firstPoint.y)) return;
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        // 连接其他点
        let isValidPath = true;
        for (let i = 1; i < path.points.length; i++) {
          const point = worldToScreen(path.points[i].coordinate);
          // 验证坐标有效性
          if (isNaN(point.x) || isNaN(point.y)) {
            isValidPath = false;
            break;
          }
          ctx.lineTo(point.x, point.y);
        }
        
        if (!isValidPath) return;
        
        // 绘制路径
        ctx.strokeStyle = path.color || '#3b82f6';
        ctx.lineWidth = path.width || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // 绘制路径点 - 仅在高缩放级别绘制
        if (zoom >= 6) {
          path.points.forEach(point => {
            try {
              if (point.isWaypoint) {
                const screenCoord = worldToScreen(point.coordinate);
                // 验证坐标有效性
                if (isNaN(screenCoord.x) || isNaN(screenCoord.y)) return;
                
                // 简化路径点绘制
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenCoord.x, screenCoord.y, (path.width || 3) + 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = path.color || '#3b82f6';
                ctx.beginPath();
                ctx.arc(screenCoord.x, screenCoord.y, (path.width || 3) + 2, 0, Math.PI * 2);
                ctx.fill();
              }
            } catch (error) {
              console.warn('绘制路径点时出错:', error);
            }
          });
        }
      } catch (error) {
        console.warn('绘制路径时出错:', error, '路径:', path.id);
      }
    });
  };
  
  // 性能监控状态
  const [performanceStats, setPerformanceStats] = useState({
    renderTime: 0,        // 渲染时间（ms）
    fps: 60,              // 帧率
    poiCount: 0,          // POI数量
    regionCount: 0,       // 区域数量
    pathCount: 0,         // 路径数量
    visiblePoiCount: 0    // 可见POI数量
  });
  
  // FPS计算
  const fpsStatsRef = useRef({
    frameCount: 0,
    lastTime: performance.now(),
    currentFps: 60
  });
  
  // 优化绘制逻辑，添加数据缓存和性能优化
  const drawMap = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // 开始渲染时间
    const startTime = performance.now();
    
    try {
      // 快速清空画布 - 使用fillRect比clearRect更高效
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 只在必要时绘制网格线（缩放级别较低时）
      if (zoom <= 6) {
        drawGrid(ctx, viewportInfo.viewport, viewportInfo.scale, canvas.width, canvas.height);
      }
      
      // 绘制区域
      drawRegions(ctx, regions, zoom, worldToScreen, viewportInfo.viewport);
      
      // 绘制路径
      drawPaths(ctx, paths, worldToScreen, viewportInfo.viewport);
      
      // 直接绘制POI到主Canvas，简化渲染流程
      drawPOIs(ctx, pois, canvas.width, canvas.height, worldToScreen, viewportInfo.viewport);
      
      // 结束渲染时间
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 更新FPS统计
      const fpsStats = fpsStatsRef.current;
      fpsStats.frameCount++;
      const now = performance.now();
      if (now - fpsStats.lastTime >= 1000) { // 每秒更新一次FPS
        fpsStats.currentFps = Math.round(fpsStats.frameCount * 1000 / (now - fpsStats.lastTime));
        fpsStats.frameCount = 0;
        fpsStats.lastTime = now;
      }
      
      // 更新性能统计
      setPerformanceStats(prev => ({
        ...prev,
        renderTime: parseFloat(renderTime.toFixed(2)),
        fps: fpsStats.currentFps,
        poiCount: pois.length,
        regionCount: regions.length,
        pathCount: paths.length,
        visiblePoiCount: pois.filter(poi => {
          const coord = poi.coordinate;
          return coord.x >= viewportInfo.viewport.x - 100 && 
                 coord.x <= viewportInfo.viewport.x + viewportInfo.viewport.width + 100 && 
                 coord.y >= viewportInfo.viewport.y - 100 && 
                 coord.y <= viewportInfo.viewport.y + viewportInfo.viewport.height + 100;
        }).length
      }));
    } catch (error) {
      console.error('地图绘制错误:', error);
    }
  }, [theme, regions, zoom, paths, pois, worldToScreen, viewportInfo, hoveredPOIId]);
  
  // 使用ref存储渲染状态，避免闭包问题
  const renderStateRef = useRef({
    animationFrameId: 0,
    lastRenderTime: 0,
    pendingRender: false,
    shouldRender: false
  });
  
  // 监听地图状态变化，标记需要重新渲染
  useEffect(() => {
    renderStateRef.current.shouldRender = true;
  }, [center, zoom, theme, regions, paths, pois, hoveredPOIId, viewportInfo]);
  
  // 添加渲染节流，减少不必要的重绘 - 改进版本
  useEffect(() => {
    if (!isReady) return;
    
    const minFrameInterval = 16; // 约60fps (1000/60)
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 优化的渲染循环
    const render = (timestamp: number) => {
      const renderState = renderStateRef.current;
      
      // 控制帧率，避免过度渲染
      if (timestamp - renderState.lastRenderTime < minFrameInterval) {
        // 如果仍然需要渲染，继续请求下一帧
        if (renderState.shouldRender) {
          renderState.animationFrameId = requestAnimationFrame(render);
        }
        return;
      }
      
      // 检查是否需要渲染
      if (renderState.shouldRender) {
        try {
          drawMap(ctx, canvas);
          renderState.lastRenderTime = timestamp;
          renderState.shouldRender = false;
        } catch (error) {
          console.error('地图渲染错误:', error);
        }
      }
      
      // 如果仍然需要渲染，继续请求下一帧
      if (renderState.shouldRender) {
        renderState.animationFrameId = requestAnimationFrame(render);
      }
    };
    
    // 初始渲染
    renderStateRef.current.animationFrameId = requestAnimationFrame(render);
    
    // 监听窗口大小变化
    const handleResize = () => {
      renderStateRef.current.shouldRender = true;
      requestAnimationFrame(render);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(renderStateRef.current.animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isReady, drawMap, center, zoom, theme, regions, paths, pois, hoveredPOIId, viewportInfo]);
  
  return (
    <div ref={containerRef} className={`${className} relative w-full h-full`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          display: 'block',
          cursor: 'grab',
          userSelect: 'none'
        }}
      />
    </div>
  );
};

export default MapRenderer;