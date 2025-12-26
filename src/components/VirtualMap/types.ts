// 虚拟地图类型定义

// 坐标类型
export interface Coordinate {
  x: number;
  y: number;
}

// 缩放级别
export type ZoomLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// 区域类型
export interface Region {
  id: string;
  name: string;
  coordinates: Coordinate[];
  color: string;
  borderColor: string;
  borderWidth: number;
  zoomLevel: ZoomLevel;
}

// POI类型
export interface POI {
  id: string;
  name: string;
  coordinate: Coordinate;
  category: string;
  icon?: string;
  description?: string;
  color: string;
  importance?: number;
}

// 路径点类型
export interface PathPoint {
  coordinate: Coordinate;
  isWaypoint?: boolean;
}

// 路径类型
export interface Path {
  id: string;
  points: PathPoint[];
  color: string;
  width: number;
}

// 地图样式主题
export interface MapTheme {
  name: string;
  backgroundColor: string;
  gridColor: string;
  regionFillOpacity: number;
  poiIconSize: number;
  pathColor: string;
  textColor: string;
}

// 地图状态
export interface MapState {
  center: Coordinate;
  zoom: ZoomLevel;
  targetCenter: Coordinate; // 目标中心点，用于平滑过渡
  targetZoom: ZoomLevel; // 目标缩放级别，用于平滑过渡
  theme: MapTheme;
  regions: Region[];
  pois: POI[];
  paths: Path[];
  isDragging: boolean;
  dragStart: Coordinate | null;
  lastDragPosition: Coordinate | null;
  dragVelocity: { x: number; y: number };
  width: number;
  height: number;
  hoveredPOIId: string | null;
  easeOutCubic: (t: number) => number; // 缓动函数
}

// 地图配置
export interface MapConfig {
  initialCenter: Coordinate;
  initialZoom: ZoomLevel;
  minZoom: ZoomLevel;
  maxZoom: ZoomLevel;
  tileSize: number;
  themes: MapTheme[];
}