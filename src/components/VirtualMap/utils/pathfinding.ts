import { Coordinate, POI } from '../types';

// 节点类型定义
interface Node {
  coordinate: Coordinate;
  g: number; // 从起点到当前节点的实际成本
  h: number; // 从当前节点到终点的估计成本
  f: number; // f = g + h
  parent?: Node;
}

// 计算两个点之间的欧几里得距离
const calculateDistance = (a: Coordinate, b: Coordinate): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// 生成邻居节点
const generateNeighbors = (current: Node, gridSize: number = 10): Node[] => {
  const neighbors: Node[] = [];
  const directions = [
    { x: 0, y: -gridSize }, // 上
    { x: gridSize, y: 0 },  // 右
    { x: 0, y: gridSize },  // 下
    { x: -gridSize, y: 0 }, // 左
    { x: gridSize, y: -gridSize },  // 右上
    { x: gridSize, y: gridSize },   // 右下
    { x: -gridSize, y: gridSize },  // 左下
    { x: -gridSize, y: -gridSize }  // 左上
  ];
  
  for (const dir of directions) {
    const neighborCoord: Coordinate = {
      x: current.coordinate.x + dir.x,
      y: current.coordinate.y + dir.y
    };
    
    neighbors.push({
      coordinate: neighborCoord,
      g: 0,
      h: 0,
      f: 0
    });
  }
  
  return neighbors;
};

// A* 路径查找算法
export const findPath = (start: Coordinate, end: Coordinate, gridSize: number = 10): Coordinate[] => {
  // 开放列表（待探索的节点）
  const openList: Node[] = [];
  
  // 关闭列表（已探索的节点）
  const closedList: Set<string> = new Set();
  
  // 创建起点节点
  const startNode: Node = {
    coordinate: start,
    g: 0,
    h: calculateDistance(start, end),
    f: calculateDistance(start, end)
  };
  
  openList.push(startNode);
  
  // 最大迭代次数，防止无限循环
  const maxIterations = 1000;
  let iterations = 0;
  
  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // 找到f值最小的节点
    let currentIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    const currentNode = openList[currentIndex];
    
    // 如果到达终点，回溯路径
    if (calculateDistance(currentNode.coordinate, end) < gridSize) {
      const path: Coordinate[] = [];
      let current: Node | undefined = currentNode;
      
      while (current) {
        path.push(current.coordinate);
        current = current.parent;
      }
      
      return path.reverse();
    }
    
    // 从开放列表中移除当前节点，添加到关闭列表
    openList.splice(currentIndex, 1);
    closedList.add(`${currentNode.coordinate.x},${currentNode.coordinate.y}`);
    
    // 生成邻居节点
    const neighbors = generateNeighbors(currentNode, gridSize);
    
    for (const neighbor of neighbors) {
      // 检查邻居是否在关闭列表中
      const neighborKey = `${neighbor.coordinate.x},${neighbor.coordinate.y}`;
      if (closedList.has(neighborKey)) {
        continue;
      }
      
      // 计算从起点到邻居的成本
      const tentativeG = currentNode.g + calculateDistance(currentNode.coordinate, neighbor.coordinate);
      
      // 检查邻居是否在开放列表中
      const neighborInOpenList = openList.find(n => n.coordinate.x === neighbor.coordinate.x && n.coordinate.y === neighbor.coordinate.y);
      
      if (!neighborInOpenList || tentativeG < neighborInOpenList.g) {
        // 更新邻居节点的成本和父节点
        neighbor.g = tentativeG;
        neighbor.h = calculateDistance(neighbor.coordinate, end);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = currentNode;
        
        // 如果邻居不在开放列表中，添加进去
        if (!neighborInOpenList) {
          openList.push(neighbor);
        }
      }
    }
  }
  
  // 如果没有找到路径，返回空数组
  return [];
};

// 根据POI生成路径
export const generatePathFromPOIs = (startPOI: POI, endPOI: POI, gridSize: number = 10): Coordinate[] => {
  return findPath(startPOI.coordinate, endPOI.coordinate, gridSize);
};

// 简化路径（移除不必要的点）
export const simplifyPath = (path: Coordinate[], tolerance: number = 5): Coordinate[] => {
  if (path.length <= 2) return path;
  
  const simplified: Coordinate[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const current = path[i];
    const next = path[i + 1];
    
    // 计算三点之间的夹角
    const angle = calculateAngle(prev, current, next);
    
    // 如果夹角小于阈值，保留当前点
    if (Math.abs(angle) > tolerance) {
      simplified.push(current);
    }
  }
  
  simplified.push(path[path.length - 1]);
  return simplified;
};

// 计算三点之间的夹角
const calculateAngle = (a: Coordinate, b: Coordinate, c: Coordinate): number => {
  const ab = {
    x: b.x - a.x,
    y: b.y - a.y
  };
  
  const bc = {
    x: c.x - b.x,
    y: c.y - b.y
  };
  
  // 计算向量的点积
  const dotProduct = ab.x * bc.x + ab.y * bc.y;
  
  // 计算向量的模长
  const abLen = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const bcLen = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  
  // 计算夹角（弧度）
  let angle = Math.acos(dotProduct / (abLen * bcLen));
  
  // 转换为角度
  angle = (angle * 180) / Math.PI;
  
  return angle;
};

// 生成平滑路径
export const smoothPath = (path: Coordinate[], smoothness: number = 0.5): Coordinate[] => {
  if (path.length <= 2) return path;
  
  const smoothed: Coordinate[] = [...path];
  
  // 迭代平滑路径
  for (let i = 0; i < 5; i++) {
    const tempPath: Coordinate[] = [...smoothed];
    
    for (let j = 1; j < smoothed.length - 1; j++) {
      tempPath[j].x = smoothed[j].x + smoothness * (smoothed[j - 1].x + smoothed[j + 1].x - 2 * smoothed[j].x);
      tempPath[j].y = smoothed[j].y + smoothness * (smoothed[j - 1].y + smoothed[j + 1].y - 2 * smoothed[j].y);
    }
    
    smoothed.splice(0, smoothed.length, ...tempPath);
  }
  
  return smoothed;
};