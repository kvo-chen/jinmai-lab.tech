import React, { useState, useEffect } from 'react';
import VirtualMap from '../components/VirtualMap/VirtualMap';
import { Region, POI, Path, Coordinate } from '../components/VirtualMap/types';
import { findPath, simplifyPath, smoothPath } from '../components/VirtualMap/utils/pathfinding';

const VirtualMapDemo: React.FC = () => {
  // 生成虚拟地理区域
  const generateRegions = (): Region[] => {
    return [
      {
        id: 'region-1',
        name: '虚拟区域1',
        coordinates: [
          { x: 300, y: 300 },
          { x: 700, y: 300 },
          { x: 700, y: 700 },
          { x: 300, y: 700 }
        ],
        color: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 2,
        zoomLevel: 1
      },
      {
        id: 'region-2',
        name: '虚拟区域2',
        coordinates: [
          { x: 700, y: 300 },
          { x: 1100, y: 300 },
          { x: 1100, y: 700 },
          { x: 700, y: 700 }
        ],
        color: '#10b981',
        borderColor: '#059669',
        borderWidth: 2,
        zoomLevel: 1
      },
      {
        id: 'region-3',
        name: '虚拟区域3',
        coordinates: [
          { x: 300, y: 700 },
          { x: 700, y: 700 },
          { x: 700, y: 1100 },
          { x: 300, y: 1100 }
        ],
        color: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 2,
        zoomLevel: 1
      },
      {
        id: 'region-4',
        name: '虚拟区域4',
        coordinates: [
          { x: 700, y: 700 },
          { x: 1100, y: 700 },
          { x: 1100, y: 1100 },
          { x: 700, y: 1100 }
        ],
        color: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 2,
        zoomLevel: 1
      }
    ];
  };
  
  // 生成1000个虚拟POI
  const generatePOIs = (count: number = 1000): POI[] => {
    const categories = ['景点', '餐厅', '酒店', '购物中心', '博物馆', '公园', '交通枢纽', '医院'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#65a30d'];
    
    const pois: POI[] = [];
    
    for (let i = 0; i < count; i++) {
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const category = categories[categoryIndex];
      const color = colors[categoryIndex];
      
      pois.push({
        id: `poi-${i}`,
        name: `${category}-${i}`,
        coordinate: {
          x: 200 + Math.random() * 1000,
          y: 200 + Math.random() * 1000
        },
        category,
        description: `${category}描述 ${i}`,
        color
      });
    }
    
    return pois;
  };
  
  // 生成随机路径
  const generateRandomPath = (): Path => {
    const start: Coordinate = {
      x: 300 + Math.random() * 800,
      y: 300 + Math.random() * 800
    };
    
    const end: Coordinate = {
      x: 300 + Math.random() * 800,
      y: 300 + Math.random() * 800
    };
    
    let pathPoints = findPath(start, end, 20);
    pathPoints = simplifyPath(pathPoints);
    pathPoints = smoothPath(pathPoints);
    
    return {
      id: `path-${Date.now()}`,
      points: pathPoints.map((point, index) => ({
        coordinate: point,
        isWaypoint: index === 0 || index === pathPoints.length - 1
      })),
      color: '#3b82f6',
      width: 3
    };
  };
  
  const [regions] = useState<Region[]>(generateRegions());
  const [pois] = useState<POI[]>(generatePOIs(1000));
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  
  // 处理POI点击事件
  const handlePOIClick = (poiId: string) => {
    const poi = pois.find(p => p.id === poiId);
    if (poi) {
      setSelectedPOI(poi);
    }
  };
  
  // 处理地图点击事件
  const handleMapClick = (coordinate: Coordinate) => {
    setSelectedPOI(null);
    
    // 生成新路径
    const newPath = generateRandomPath();
    setPaths([...paths, newPath]);
  };
  
  // 清除所有路径
  const handleClearPaths = () => {
    setPaths([]);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面标题 */}
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">虚拟地图系统演示</h1>
          <p className="text-gray-600 mt-1">
            展示高级虚拟地图系统的核心功能，包括地图缩放、平移、POI标记和路径规划
          </p>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="container mx-auto p-4">
        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">控制面板</h2>
              <p className="text-sm text-gray-600">
                点击地图生成随机路径，点击POI查看详情
              </p>
            </div>
            
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
              onClick={handleClearPaths}
            >
              清除所有路径
            </button>
            
            <div className="bg-gray-100 px-4 py-2 rounded-md">
              <span className="text-sm font-medium text-gray-700">
                POI数量: {pois.length}
              </span>
            </div>
            
            <div className="bg-gray-100 px-4 py-2 rounded-md">
              <span className="text-sm font-medium text-gray-700">
                路径数量: {paths.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* 地图容器 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="h-[80vh] relative">
            <VirtualMap
              initialRegions={regions}
              initialPOIs={pois}
              initialPaths={paths}
              onPOIClick={handlePOIClick}
              onMapClick={handleMapClick}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>
        
        {/* POI详情面板 */}
        {selectedPOI && (
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">POI详情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1"><strong>ID:</strong> {selectedPOI.id}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>名称:</strong> {selectedPOI.name}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>分类:</strong> {selectedPOI.category}</p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>坐标:</strong> ({selectedPOI.coordinate.x.toFixed(2)}, {selectedPOI.coordinate.y.toFixed(2)})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>描述:</strong> {selectedPOI.description}
                </p>
              </div>
            </div>
            <button
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
              onClick={() => setSelectedPOI(null)}
            >
              关闭详情
            </button>
          </div>
        )}
        
        {/* 系统信息 */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">系统信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">核心功能</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 地图缩放与平移</li>
                <li>• 虚拟地理区域划分</li>
                <li>• POI标记系统</li>
                <li>• 路径规划可视化</li>
                <li>• 可自定义地图主题</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">技术实现</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Canvas地图渲染引擎</li>
                <li>• A*路径规划算法</li>
                <li>• 视口裁剪优化</li>
                <li>• 分层渲染技术</li>
                <li>• 支持1000+ POI渲染</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">交互说明</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 鼠标拖拽：平移地图</li>
                <li>• 鼠标滚轮：缩放地图</li>
                <li>• 点击POI：查看详情</li>
                <li>• 点击地图：生成路径</li>
                <li>• 切换主题：更改地图样式</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white shadow-md p-4 mt-8">
        <div className="container mx-auto text-center text-sm text-gray-600">
          <p>虚拟地图系统演示 © {new Date().getFullYear()}</p>
          <p className="mt-1">作为高德地图API的替代方案，提供高性能的虚拟地图体验</p>
        </div>
      </footer>
    </div>
  );
};

export default VirtualMapDemo;