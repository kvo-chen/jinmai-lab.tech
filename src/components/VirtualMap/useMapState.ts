import { create } from 'zustand/react';
import { Coordinate, ZoomLevel, MapState, MapConfig, MapTheme, Region, POI, Path } from './types';

// 默认地图主题
export const DEFAULT_THEMES: MapTheme[] = [
  {
    name: '默认主题',
    backgroundColor: '#f8fafc',
    gridColor: '#e2e8f0',
    regionFillOpacity: 0.3,
    poiIconSize: 14,
    pathColor: '#3b82f6',
    textColor: '#1e293b'
  },
  {
    name: '深色主题',
    backgroundColor: '#0f172a',
    gridColor: '#334155',
    regionFillOpacity: 0.4,
    poiIconSize: 14,
    pathColor: '#60a5fa',
    textColor: '#f1f5f9'
  },
  {
    name: '高对比度主题',
    backgroundColor: '#ffffff',
    gridColor: '#d1d5db',
    regionFillOpacity: 0.5,
    poiIconSize: 16,
    pathColor: '#ef4444',
    textColor: '#000000'
  }
];

// 默认地图配置
export const DEFAULT_CONFIG: MapConfig = {
  initialCenter: { x: 500, y: 500 },
  initialZoom: 4 as ZoomLevel, // 降低初始缩放级别，确保所有POI点都在初始视图内
  minZoom: 3 as ZoomLevel,      // 提高最小缩放级别，防止用户缩太小看不到POI
  maxZoom: 10 as ZoomLevel,
  tileSize: 256,
  themes: DEFAULT_THEMES
};

// 创建地图状态store
export const useMapState = create<MapState & {
  // 配置方法
  setConfig: (config: Partial<MapConfig>) => void;
  setSize: (width: number, height: number) => void;
  
  // 数据初始化方法
  setInitialData: (data: { regions: Region[]; pois: POI[]; paths: Path[] }) => void;
  
  // 交互方法
  setCenter: (center: Coordinate) => void;
  setZoom: (zoom: ZoomLevel) => void;
  updateZoom: (zoom: ZoomLevel) => void;
  updateCenter: (center: Coordinate) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  startDrag: (coordinate: Coordinate) => void;
  drag: (coordinate: Coordinate) => void;
  endDrag: () => void;
  
  // 数据管理方法
  addRegion: (region: Region) => void;
  removeRegion: (regionId: string) => void;
  addPOI: (poi: POI) => void;
  removePOI: (poiId: string) => void;
  addPath: (path: Path) => void;
  removePath: (pathId: string) => void;
  clearPaths: () => void;
  
  // 主题管理
  setTheme: (theme: MapTheme) => void;
  updateTheme: (theme: MapTheme) => void;
  
  // 悬停状态管理
  setHoveredPOI: (poiId: string | null) => void;
  
  // 坐标转换
  screenToWorld: (screenCoord: Coordinate) => Coordinate;
  worldToScreen: (worldCoord: Coordinate) => Coordinate;
  
  // 视图计算
  getViewport: () => { x: number; y: number; width: number; height: number };
  
  // 主题列表
  themes: MapTheme[];
}>(
  (set, get) => ({
    // 初始状态
    center: DEFAULT_CONFIG.initialCenter,
    zoom: DEFAULT_CONFIG.initialZoom,
    targetZoom: DEFAULT_CONFIG.initialZoom, // 目标缩放级别，用于平滑过渡
    targetCenter: DEFAULT_CONFIG.initialCenter, // 目标中心点，用于平滑过渡
    theme: DEFAULT_CONFIG.themes[0],
    themes: DEFAULT_CONFIG.themes,
    regions: [],
    pois: [],
    paths: [],
    isDragging: false,
    dragStart: null,
    lastDragPosition: null,
    dragVelocity: { x: 0, y: 0 },
    width: 0,
    height: 0,
    hoveredPOIId: null,
    
    // 配置方法
    setConfig: (config) => {
      set((state) => {
        // 只在实际值发生变化时才更新状态，避免无限循环
        const newState: Partial<MapState> = {};
        
        if (config.initialCenter) {
          // 比较坐标值，而不是对象引用
          if (config.initialCenter.x !== state.center.x || config.initialCenter.y !== state.center.y) {
            newState.center = config.initialCenter;
          }
        }
        
        if (config.initialZoom !== undefined) {
          // 比较缩放级别值
          if (config.initialZoom !== state.zoom) {
            newState.zoom = config.initialZoom;
          }
        }
        
        // 只有当有实际变化时才返回新状态
        return Object.keys(newState).length > 0 ? newState : state;
      });
    },
    
    // 设置组件尺寸
    setSize: (width, height) => {
      set({ width, height });
    },
    
    // 数据初始化方法
    setInitialData: (data) => {
      // 数据验证和清理
      const validatedRegions = (data.regions || []).filter(region => {
        // 验证区域数据有效性
        return region && region.id && region.coordinates && Array.isArray(region.coordinates) && region.coordinates.length > 0;
      });
      
      const validatedPOIs = (data.pois || []).filter(poi => {
        // 验证POI数据有效性
        return poi && poi.id && poi.coordinate && 
               typeof poi.coordinate.x === 'number' && !isNaN(poi.coordinate.x) &&
               typeof poi.coordinate.y === 'number' && !isNaN(poi.coordinate.y);
      });
      
      const validatedPaths = (data.paths || []).filter(path => {
        // 验证路径数据有效性
        return path && path.id && path.points && Array.isArray(path.points) && path.points.length > 0;
      });
      
      console.log('setInitialData: 处理后的数据', {
        regionsCount: validatedRegions.length,
        poisCount: validatedPOIs.length,
        pathsCount: validatedPaths.length,
        rawPoisCount: (data.pois || []).length
      });
      
      set({
        regions: validatedRegions,
        pois: validatedPOIs,
        paths: validatedPaths
      });
    },
    
    // 缓动函数：easeOutCubic - 开始快，结束慢，更自然的视觉效果
    easeOutCubic: (t: number) => {
      return 1 - Math.pow(1 - t, 3);
    },
    
    // 交互方法
    setCenter: (center) => {
      set({ targetCenter: center });
      
      // 记录初始位置和时间
      const startTime = performance.now();
      const initialCenter = get().center;
      const distance = Math.sqrt(
        Math.pow(center.x - initialCenter.x, 2) + 
        Math.pow(center.y - initialCenter.y, 2)
      );
      
      // 基于距离计算动画持续时间（100-500ms）
      const duration = Math.min(500, Math.max(100, distance * 0.5));
      
      // 平滑过渡动画
      const animateTransition = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeOutCubic缓动函数
        const easedProgress = get().easeOutCubic(progress);
        
        const dx = center.x - initialCenter.x;
        const dy = center.y - initialCenter.y;
        
        // 计算新位置
        const newCenter = {
          x: initialCenter.x + dx * easedProgress,
          y: initialCenter.y + dy * easedProgress
        };
        
        set({ center: newCenter });
        
        // 继续动画直到完成
        if (progress < 1) {
          requestAnimationFrame(animateTransition);
        }
      };
      
      animateTransition();
    },
    updateCenter: (center) => {
      set({ center, targetCenter: center });
    },
    
    setZoom: (zoom) => {
      const clampedZoom = Math.max(DEFAULT_CONFIG.minZoom, Math.min(DEFAULT_CONFIG.maxZoom, zoom));
      set({ targetZoom: clampedZoom as ZoomLevel });
      
      // 记录初始缩放和时间
      const startTime = performance.now();
      const initialZoom = get().zoom;
      const zoomDiff = Math.abs(clampedZoom - initialZoom);
      
      // 基于缩放差值计算动画持续时间（100-400ms）
      const duration = Math.min(400, Math.max(100, zoomDiff * 80));
      
      // 平滑过渡动画
      const animateTransition = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeOutCubic缓动函数
        const easedProgress = get().easeOutCubic(progress);
        
        const zoomRange = clampedZoom - initialZoom;
        
        // 计算新缩放级别
        const newZoom = initialZoom + zoomRange * easedProgress;
        
        set({ zoom: newZoom as ZoomLevel });
        
        // 继续动画直到完成
        if (progress < 1) {
          requestAnimationFrame(animateTransition);
        }
      };
      
      animateTransition();
    },
    updateZoom: (zoom) => {
      const clampedZoom = Math.max(DEFAULT_CONFIG.minZoom, Math.min(DEFAULT_CONFIG.maxZoom, zoom));
      set({ zoom: clampedZoom as ZoomLevel, targetZoom: clampedZoom as ZoomLevel });
    },
    
    zoomIn: () => {
      get().setZoom((get().targetZoom + 1) as ZoomLevel);
    },
    
    zoomOut: () => {
      get().setZoom((get().targetZoom - 1) as ZoomLevel);
    },
    
    startDrag: (coordinate) => {
      set({ isDragging: true, dragStart: coordinate, lastDragPosition: coordinate, dragVelocity: { x: 0, y: 0 } });
    },
    
    drag: (coordinate) => {
      const state = get();
      if (state.isDragging && state.dragStart) {
        // 降低拖动敏感度，让拖动更缓慢
        const dragSensitivity = 0.5; // 拖动敏感度系数，越小越慢
        const deltaX = (coordinate.x - state.dragStart.x) * dragSensitivity;
        const deltaY = (coordinate.y - state.dragStart.y) * dragSensitivity;
        
        // 增加位置变化阈值，减少状态更新频率，提高流畅度
        if (Math.abs(deltaX) < 1 || Math.abs(deltaY) < 1) {
          // 位置变化太小，不更新状态，减少重绘
          return;
        }
        
        const newCenter = {
          x: state.center.x - deltaX,
          y: state.center.y - deltaY
        };
        
        // 简化状态更新，只更新必要的状态值
        set({
          center: newCenter,
          targetCenter: newCenter,
          dragStart: coordinate,
          lastDragPosition: coordinate
        });
      }
    },
    
    endDrag: () => {
      // 简化惯性动画，减少计算量和状态更新频率
      // 直接结束拖拽，不添加惯性效果，提高流畅度
      set({ 
        isDragging: false, 
        dragStart: null, 
        dragVelocity: { x: 0, y: 0 } 
      });
    },
    
    // 数据管理方法
    addRegion: (region) => {
      // 验证区域数据有效性
      if (!region || !region.id || !region.coordinates || !Array.isArray(region.coordinates)) {
        console.warn('无效的区域数据:', region);
        return;
      }
      set((state) => ({
        regions: [...state.regions, region]
      }));
    },
    
    removeRegion: (regionId) => {
      set((state) => ({
        regions: state.regions.filter(region => region.id !== regionId)
      }));
    },
    
    clearRegions: () => {
      set({ regions: [] });
    },
    
    addPOI: (poi) => {
      // 验证POI数据有效性
      if (!poi || !poi.id || !poi.coordinate) {
        console.warn('无效的POI数据:', poi);
        return;
      }
      set((state) => ({
        pois: [...state.pois, poi]
      }));
    },
    
    removePOI: (poiId) => {
      set((state) => ({
        pois: state.pois.filter(poi => poi.id !== poiId)
      }));
    },
    
    clearPOIs: () => {
      set({ pois: [] });
    },
    
    addPath: (path) => {
      // 验证路径数据有效性
      if (!path || !path.id || !path.points || !Array.isArray(path.points)) {
        console.warn('无效的路径数据:', path);
        return;
      }
      set((state) => ({
        paths: [...state.paths, path]
      }));
    },
    
    removePath: (pathId) => {
      set((state) => ({
        paths: state.paths.filter(path => path.id !== pathId)
      }));
    },
    
    clearPaths: () => {
      set({ paths: [] });
    },
    
    // 主题管理
    setTheme: (theme) => set({ theme }),
    updateTheme: (theme) => set({ theme }),
    
    // 悬停状态管理
    setHoveredPOI: (poiId: string | null) => set({ hoveredPOIId: poiId }),
    
    // 坐标转换 - 添加缓存机制，提高性能
    screenToWorld: (screenCoord) => {
      const state = get();
      const scale = Math.pow(2, state.zoom - 1);
      
      // 使用组件实际尺寸进行坐标计算
      return {
        x: state.center.x + (screenCoord.x - state.width / 2) / scale,
        y: state.center.y + (screenCoord.y - state.height / 2) / scale
      };
    },
    
    worldToScreen: (worldCoord) => {
      const state = get();
      const scale = Math.pow(2, state.zoom - 1);
      
      // 使用组件实际尺寸进行坐标计算
      return {
        x: state.width / 2 + (worldCoord.x - state.center.x) * scale,
        y: state.height / 2 + (worldCoord.y - state.center.y) * scale
      };
    },
    
    // 视图计算
    getViewport: () => {
      const state = get();
      const scale = Math.pow(2, state.zoom - 1);
      const width = state.width / scale;
      const height = state.height / scale;
      
      return {
        x: state.center.x - width / 2,
        y: state.center.y - height / 2,
        width,
        height
      };
    }
  })
);