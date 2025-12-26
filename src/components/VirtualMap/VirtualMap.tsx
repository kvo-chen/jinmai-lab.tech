import React, { useRef, useEffect } from 'react';
import MapRenderer from './MapRenderer';
import MapController from './MapController';
import MapControls from './MapControls';
import { useMapState, DEFAULT_CONFIG } from './useMapState';
import { MapConfig, POI, Region, Path, Coordinate } from './types';

interface VirtualMapProps {
  width?: number;
  height?: number;
  config?: Partial<MapConfig>;
  initialRegions?: Region[];
  initialPOIs?: POI[];
  initialPaths?: Path[];
  onPOIClick?: (poiId: string) => void;
  onMapClick?: (coordinate: Coordinate) => void;
  className?: string;
  style?: React.CSSProperties;
}

const VirtualMap: React.FC<VirtualMapProps> = ({
  width,
  height,
  config = {},
  initialRegions = [],
  initialPOIs = [],
  initialPaths = [],
  onPOIClick,
  onMapClick,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 获取地图状态和方法
  const {
    setSize,
    setInitialData,
    updateZoom,
    updateCenter,
    updateTheme
  } = useMapState();
  
  // 初始化地图数据
  useEffect(() => {
    try {
      console.log('VirtualMap: 初始化地图数据', {
        regionsCount: initialRegions.length,
        poisCount: initialPOIs.length,
        pathsCount: initialPaths.length
      });
      // 设置初始数据
      setInitialData({
        regions: initialRegions,
        pois: initialPOIs,
        paths: initialPaths
      });
    } catch (error) {
      console.error('初始化地图数据时出错:', error);
    }
  }, [initialRegions, initialPOIs, initialPaths, setInitialData]);
  
  // 获取容器尺寸
  const updateContainerSize = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // 确保尺寸不为0，避免绘制错误
    const newWidth = rect.width || 800;
    const newHeight = rect.height || 600;
    
    // 更新地图状态中的尺寸
    setSize(newWidth, newHeight);
  };
  
  // 初始化尺寸和事件监听
  useEffect(() => {
    // 初始更新尺寸
    updateContainerSize();
    
    // 添加resize事件监听
    window.addEventListener('resize', updateContainerSize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', updateContainerSize);
    };
  }, [setSize]);

  // 当width或height属性变化时更新尺寸
  useEffect(() => {
    updateContainerSize();
  }, [width, height, setSize]);
  
  // 处理POI点击事件
  const handlePOIClickInternal = (poiId: string) => {
    if (onPOIClick) {
      onPOIClick(poiId);
    }
  };
  
  // 处理地图点击事件
  const handleMapClickInternal = (coordinate: Coordinate) => {
    if (onMapClick) {
      onMapClick(coordinate);
    }
  };
  
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className} overflow-hidden`} style={style}>
      {/* 地图控制器 */}
      <MapController
        onPOIClick={handlePOIClickInternal}
        onMapClick={handleMapClickInternal}
      >
        {/* 地图渲染器 */}
        <MapRenderer className="w-full h-full" />
      </MapController>
      
      {/* 地图控件 */}
      <MapControls />
    </div>
  );
};

export default VirtualMap;