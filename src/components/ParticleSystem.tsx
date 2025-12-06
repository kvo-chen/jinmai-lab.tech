import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleModelType } from '../lib/particleModels';

// 粒子行为模式类型
type ParticleBehavior = 'default' | 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos';

// 粒子配置类型
interface ParticleConfig {
  model: 'heart' | 'flower' | 'saturn' | 'buddha' | 'firework' | 'baozi';
  color: string;
  particleCount: number;
  scale: number;
  spread: number;
  size: number; // 粒子大小
  animationSpeed: number; // 动画速度
  gestureSensitivity: number; // 手势灵敏度
  showTrails: boolean; // 是否显示拖尾效果
  rotationSpeed: number; // 旋转速度
  colorVariation: number; // 颜色变化幅度
  emissionRate: number; // 发射速率
  behavior: ParticleBehavior; // 粒子行为模式
  morphDuration?: number; // 形状变形持续时间
  shapeIntensity?: number; // 形状强度，值越大形状越明显
}

// 粒子形状变形状态
interface MorphState {
  isMorphing: boolean;
  startModel: string;
  targetModel: string;
  startTime: number;
  duration: number;
  progress: number;
}



// 缓存项类型，包含使用频率和创建时间
interface CacheItem<T> {
  item: T;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
}

// 全局缓存管理器
class CacheManager<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxSize: number;
  private cleanupInterval: number;
  private itemDisposer: (item: T) => void;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 10, cleanupInterval: number = 60000, itemDisposer: (item: T) => void) {
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this.itemDisposer = itemDisposer;

    // 设置定期清理定时器
    this.intervalId = setInterval(() => this.cleanup(), this.cleanupInterval);
  }
  
  // 清理定时器，防止内存泄漏
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.clear();
  }

  // 获取缓存项
  get(key: string): T | undefined {
    const cacheItem = this.cache.get(key);
    if (cacheItem) {
      // 更新使用频率和最后使用时间
      cacheItem.usageCount++;
      cacheItem.lastUsed = Date.now();
      return cacheItem.item;
    }
    return undefined;
  }

  // 设置缓存项
  set(key: string, item: T): void {
    // 如果缓存已满，清理最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    // 添加新项
    this.cache.set(key, {
      item,
      usageCount: 1,
      lastUsed: Date.now(),
      createdAt: Date.now()
    });
  }

  // 清理最少使用的项
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;

    // 找到最少使用的项
    let leastUsedKey: string | null = null;
    let leastUsageCount = Infinity;
    let oldestLastUsed = Infinity;

    for (const [key, cacheItem] of this.cache.entries()) {
      if (cacheItem.usageCount < leastUsageCount ||
          (cacheItem.usageCount === leastUsageCount && cacheItem.lastUsed < oldestLastUsed)) {
        leastUsedKey = key;
        leastUsageCount = cacheItem.usageCount;
        oldestLastUsed = cacheItem.lastUsed;
      }
    }

    // 移除并释放最少使用的项
    if (leastUsedKey) {
      const cacheItem = this.cache.get(leastUsedKey);
      if (cacheItem) {
        this.itemDisposer(cacheItem.item);
        this.cache.delete(leastUsedKey);
      }
    }
  }

  // 手动清理缓存
  cleanup(): void {
    // 清理创建时间超过1分钟且使用频率低的项
    const now = Date.now();
    for (const [key, cacheItem] of this.cache.entries()) {
      if (now - cacheItem.createdAt > 60000 && cacheItem.usageCount < 3) {
        this.itemDisposer(cacheItem.item);
        this.cache.delete(key);
      }
    }
  }

  // 清理所有缓存
  clear(): void {
    for (const cacheItem of this.cache.values()) {
      this.itemDisposer(cacheItem.item);
    }
    this.cache.clear();
  }
}



// 粒子池管理
class ParticlePool {
  private pool: any[] = [];
  private maxSize: number = 1000;
  private minSize: number = 100;
  private particleFactory: (index: number) => any;
  private usageStats: {
    peakUsage: number;
    averageUsage: number;
    usageHistory: number[];
    lastAdjustment: number;
  };
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(factory: (index: number) => any, maxSize: number = 1000, minSize: number = 100) {
    this.particleFactory = factory;
    this.maxSize = maxSize;
    this.minSize = minSize;
    
    // 初始化使用统计
    this.usageStats = {
      peakUsage: 0,
      averageUsage: 0,
      usageHistory: [],
      lastAdjustment: Date.now()
    };
    
    // 设置定期调整池大小的定时器
    this.intervalId = setInterval(() => this.adjustPoolSize(), 5000); // 每5秒调整一次
  }
  
  // 销毁粒子池，清理定时器
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.pool = [];
  }
  
  // 从池中获取粒子
  getParticle(index: number): any {
    if (this.pool.length > 0) {
      const particle = this.pool.pop()!;
      // 重置粒子属性
      this.resetParticle(particle, index);
      return particle;
    } else {
      // 创建新粒子
      return this.particleFactory(index);
    }
  }
  
  // 重置粒子属性
  private resetParticle(particle: any, index: number): void {
    // 重置位置和速度
    const speedFactor = Math.random() * 0.02 + 0.005;
    const angle = (index / 100) * Math.PI * 2; // 使用固定值避免依赖外部配置
    
    // 重置基本属性 - 适配新的粒子数据结构
    particle.position = [0, 0, 0];
    particle.prevPosition = [0, 0, 0]; // 直接赋值，无需copy
    particle.rotation = [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ];
    particle.scale = Math.random() * 0.8 + 0.2;
    particle.targetScale = Math.random() * 1.5 + 0.5;
    particle.opacity = 0;
    particle.maxOpacity = Math.random() * 0.5 + 0.3;
    particle.life = 0;
    particle.speed = [0, 0, 0];
    particle.birthTime = Date.now();
    particle.index = index;
    particle.angle = angle;
    
    // 根据粒子行为重置速度 - 适配新的粒子数据结构
    const randomX = (Math.random() - 0.5) * speedFactor;
    const randomY = (Math.random() - 0.5) * speedFactor;
    const randomZ = (Math.random() - 0.5) * speedFactor;
    particle.speed = [randomX, randomY, randomZ];
    
    // 重置加速度（如果存在）
    if (particle.acceleration) {
      particle.acceleration = [
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001
      ];
    }
  }
  
  // 回收粒子到池中
  recycleParticle(particle: any): void {
    // 更新使用统计
    this.updateUsageStats();
    
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }
  
  // 更新使用统计
  private updateUsageStats(): void {
    // 更新峰值使用量
    this.usageStats.peakUsage = Math.max(this.usageStats.peakUsage, this.pool.length);
    
    // 添加当前使用量到历史记录
    this.usageStats.usageHistory.push(this.pool.length);
    
    // 只保留最近50个记录
    if (this.usageStats.usageHistory.length > 50) {
      this.usageStats.usageHistory.shift();
    }
    
    // 计算平均使用量
    const sum = this.usageStats.usageHistory.reduce((acc, val) => acc + val, 0);
    this.usageStats.averageUsage = sum / this.usageStats.usageHistory.length;
  }
  
  // 动态调整池大小
  private adjustPoolSize(): void {
    const now = Date.now();
    // 至少间隔3秒才调整一次
    if (now - this.usageStats.lastAdjustment < 3000) return;
    
    this.usageStats.lastAdjustment = now;
    
    // 基于峰值使用量和平均使用量调整池大小
    const targetSize = Math.max(
      this.minSize,
      Math.min(
        this.maxSize,
        Math.round(this.usageStats.peakUsage * 1.2) // 峰值使用量的1.2倍作为目标大小
      )
    );
    
    if (targetSize !== this.maxSize) {
      this.maxSize = targetSize;
      // 粒子池大小调整日志已移除
      
      // 如果当前池大小超过新的maxSize，清理多余的粒子
      if (this.pool.length > this.maxSize) {
        this.pool = this.pool.slice(0, this.maxSize);
      }
    }
  }
  
  // 获取当前池状态
  getPoolStatus(): { currentSize: number; maxSize: number; peakUsage: number; averageUsage: number } {
    return {
      currentSize: this.pool.length,
      maxSize: this.maxSize,
      peakUsage: this.usageStats.peakUsage,
      averageUsage: this.usageStats.averageUsage
    };
  }
}

// 实例化粒子系统组件
export const InstancedParticleSystem: React.FC<{
  config: ParticleConfig;
  gestureData?: {
    scale: number;
    spread: number;
  };
}> = ({ config, gestureData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const particlesRef = useRef<any[]>([]);
  const baseColorRef = useRef(new THREE.Color(config.color));
  const lastUpdateTimeRef = useRef(Date.now());
  const isUpdatingRef = useRef(false);
  
  // 粒子池引用
  const particlePoolRef = useRef<ParticlePool | null>(null);
  
  // 分批更新相关引用
  const batchIndexRef = useRef(0); // 当前处理的批索引
  const particlesPerBatchRef = useRef(200); // 每帧处理的粒子数量，动态调整
  const lastFpsRef = useRef(60); // 记录最近的帧率
  const fpsHistoryRef = useRef<number[]>([]); // 帧率历史记录
  
  // 动态调整批处理大小的参数
  const maxParticlesPerBatch = 300; // 最大每帧处理粒子数
  const minParticlesPerBatch = 50; // 最小每帧处理粒子数
  const targetFps = 60; // 目标帧率
  const adjustmentFactor = 0.05; // 调整因子，值越小调整越平滑
  
  // 拖尾效果相关引用
  const trailRef = useRef<{
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
    mesh: THREE.LineSegments;
    points: Float32Array;
    lastUpdateTime: number; // 最后更新时间，用于控制更新频率
  } | null>(null);
  
  // 获取相机对象，用于视锥体剔除
  const { camera } = useThree();
  // 视锥体引用，用于缓存视锥体信息
  const frustumRef = useRef(new THREE.Frustum());
  // 投影矩阵引用，用于缓存投影矩阵
  const projMatrixRef = useRef(new THREE.Matrix4());
  // 视图矩阵引用，用于缓存视图矩阵
  const viewMatrixRef = useRef(new THREE.Matrix4());
  // 复合矩阵引用，用于缓存复合矩阵
  const combinedMatrixRef = useRef(new THREE.Matrix4());
  // 相机位置和旋转缓存，用于优化视锥体更新
  const lastCameraPositionRef = useRef(0);
  // 初始化为与相机旋转相同的结构，避免类型不匹配问题
  const lastCameraRotationRef = useRef({ x: 0, y: 0, z: 0 });
  
  // 形状变形状态
  const [morphState, setMorphState] = useState<MorphState>({
    isMorphing: false,
    startModel: config.model,
    targetModel: config.model,
    startTime: Date.now(),
    duration: config.morphDuration || 2000,
    progress: 0
  });
  
  // 监听模型变化，触发变形动画
  useEffect(() => {
    if (config.model !== morphState.startModel && config.model !== morphState.targetModel) {
      setMorphState({
        isMorphing: true,
        startModel: morphState.targetModel,
        targetModel: config.model,
        startTime: Date.now(),
        duration: config.morphDuration || 2000,
        progress: 0
      });
    }
  }, [config.model]);
  
  // 更新变形进度
  useEffect(() => {
    if (!morphState.isMorphing) return;
    
    const updateMorphProgress = () => {
      const elapsed = Date.now() - morphState.startTime;
      const progress = Math.min(elapsed / morphState.duration, 1);
      
      setMorphState(prev => ({
        ...prev,
        progress,
        isMorphing: progress < 1
      }));
      
      if (progress < 1) {
        requestAnimationFrame(updateMorphProgress);
      }
    };
    
    const frameId = requestAnimationFrame(updateMorphProgress);
    return () => cancelAnimationFrame(frameId);
  }, [morphState.isMorphing, morphState.startTime, morphState.duration]);
  
  // 初始化拖尾效果 - 优化：减少拖尾点数量，提高性能
  React.useEffect(() => {
    if (config.showTrails) {
      // 创建拖尾几何体
      const geometry = new THREE.BufferGeometry();
      // 优化：每个粒子只需要2个点（前一位置和当前位置），但减少总粒子的拖尾数量
      const points = new Float32Array(config.particleCount * 2 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
      
      // 创建拖尾材质 - 优化：使用更高效的材质设置
      const material = new THREE.LineBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.2, // 降低透明度，减少视觉复杂度
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 1, // 固定线宽，减少计算
        vertexColors: false // 关闭顶点颜色，使用统一颜色
      });
      
      // 创建拖尾线段
      const mesh = new THREE.LineSegments(geometry, material);
      
      // 添加到场景
      const parent = meshRef.current?.parent;
      if (parent) {
        parent.add(mesh);
      }
      
      trailRef.current = {
        geometry,
        material,
        mesh,
        points,
        lastUpdateTime: Date.now() // 添加最后更新时间
      };
    }
    
    return () => {
      // 清理拖尾效果
      if (trailRef.current) {
        trailRef.current.geometry.dispose();
        trailRef.current.material.dispose();
        const parent = trailRef.current.mesh.parent;
        if (parent) {
          parent.remove(trailRef.current.mesh);
        }
        trailRef.current = null;
      }
    };
  }, [config.showTrails, config.particleCount, config.color]);

  // 粒子行为模式函数 - 螺旋行为
  const createSpiralParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 螺旋行为：初始位置在螺旋线上
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      Math.random() * config.spread - config.spread / 2
    );
    const speed = new THREE.Vector3(
      Math.sin(angle) * speedFactor * 0.5,
      -Math.cos(angle) * speedFactor * 0.5,
      (Math.random() - 0.5) * speedFactor
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 爆炸行为
  const createExplosionParticle = (speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 爆炸行为：初始位置集中，速度向外
    const position = new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor * 3,
      (Math.random() - 0.5) * speedFactor * 3,
      (Math.random() - 0.5) * speedFactor * 3
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 波浪行为
  const createWaveParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 波浪行为：初始位置在平面上，形成波浪
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      Math.sin(angle * 3) * radius / 2,
      (Math.random() - 0.5) * config.spread
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor,
      Math.cos(angle * 3) * speedFactor * 0.5,
      (Math.random() - 0.5) * speedFactor
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 轨道行为
  const createOrbitParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 轨道行为：围绕中心点旋转
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    const speed = new THREE.Vector3(
      Math.sin(angle) * speedFactor * 0.3,
      (Math.random() - 0.5) * speedFactor * 0.1,
      -Math.cos(angle) * speedFactor * 0.3
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 混沌行为
  const createChaosParticle = (speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 混沌行为：随机运动，无规则
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor * 2,
      (Math.random() - 0.5) * speedFactor * 2,
      (Math.random() - 0.5) * speedFactor * 2
    );
    return { position, speed };
  };



  // 粒子数据结构类型定义 - 使用类型化数组存储，提高内存效率
  interface Particle {
    // 使用数字数组代替THREE.Vector3，减少内存占用
    position: [number, number, number];
    prevPosition: [number, number, number];
    // 使用数字数组代替THREE.Euler，减少内存占用
    rotation: [number, number, number];
    scale: number;
    targetScale: number;
    opacity: number;
    maxOpacity: number;
    life: number;
    // 使用数字数组代替THREE.Vector3，减少内存占用
    speed: [number, number, number];
    // 只在默认行为中使用加速度，其他行为设为null
    acceleration: [number, number, number] | null;
    // 使用数字数组代替THREE.Color，减少内存占用
    color: [number, number, number];
    colorVariation: number;
    birthTime: number;
    // 使用数字对象代替单独的对象，减少内存占用
    rotationSpeed: { x: number; y: number; z: number };
    index: number;
    angle: number;
  }
  
  // 模型轮廓配置，定义不同模型的形状特征
  const modelContourConfig = {
    heart: {
      radiusFactor: 1.0,
      heightFactor: 1.2,
      edgeDensity: 2.0, // 增强边缘密度，使形状更明显
      centerDensity: 0.6, // 降低中心密度，突出边缘
      shapeFactor: 1.5 // 形状强度系数，值越大形状越突出
    },
    flower: {
      radiusFactor: 1.5,
      heightFactor: 1.2,
      edgeDensity: 1.8,
      centerDensity: 1.5,
      shapeFactor: 1.3
    },
    saturn: {
      radiusFactor: 2.0,
      heightFactor: 1.0,
      edgeDensity: 2.5, // 增强环形密度
      centerDensity: 0.3, // 进一步降低中心密度
      shapeFactor: 1.8
    },
    buddha: {
      radiusFactor: 1.2,
      heightFactor: 2.0,
      edgeDensity: 1.5,
      centerDensity: 1.5,
      shapeFactor: 1.4
    },
    firework: {
      radiusFactor: 3.0,
      heightFactor: 3.0,
      edgeDensity: 0.8,
      centerDensity: 2.5,
      shapeFactor: 1.2
    },
    baozi: {
      radiusFactor: 1.0,
      heightFactor: 0.8,
      edgeDensity: 2.0, // 增强包子边缘密度
      centerDensity: 1.5, // 增加中心密度，使包子更饱满
      shapeFactor: 1.6 // 高形状强度，突出包子轮廓
    },
    default: {
      radiusFactor: 1.0,
      heightFactor: 1.0,
      edgeDensity: 1.0,
      centerDensity: 1.0,
      shapeFactor: 1.0
    }
  };
  
  // 基于模型轮廓的位置生成函数
  const generatePositionByModel = (model: string, angle: number, radius: number): THREE.Vector3 => {
    const contour = modelContourConfig[model as keyof typeof modelContourConfig] || modelContourConfig.default;
    const shapeIntensity = config.shapeIntensity || 1.0;
    const finalShapeFactor = contour.shapeFactor * shapeIntensity;
    
    // 根据模型类型调整粒子分布
    switch (model) {
      case 'baozi':
        // 包子形状：底部较宽，顶部较窄，中间略鼓
        const baoziHeight = (Math.random() - 0.5) * contour.heightFactor * config.spread;
        // 使用形状因子增强包子形状特征
        const baoziRadius = radius * (1 - Math.abs(baoziHeight) / (contour.heightFactor * config.spread) * 0.3 * finalShapeFactor);
        // 增加垂直方向的弧度，使包子更圆润
        const baoziYOffset = Math.pow(Math.sin(Math.abs(baoziHeight) / (contour.heightFactor * config.spread) * Math.PI), 2) * config.spread * 0.2;
        return new THREE.Vector3(
          Math.cos(angle) * baoziRadius,
          baoziHeight + baoziYOffset,
          Math.sin(angle) * baoziRadius
        );
        
      case 'heart':
        // 心形分布：上下不对称，底部较尖
        const heartY = Math.random() * contour.heightFactor * config.spread - (contour.heightFactor * config.spread) / 2;
        // 增强心形形状，使用更明显的曲线
        const heartScale = Math.max(0.2, 1 - Math.abs(heartY) / (contour.heightFactor * config.spread) * 0.6 * finalShapeFactor);
        // 增加垂直方向的弧度，使心形更明显
        const heartYOffset = -Math.pow(Math.cos((heartY + contour.heightFactor * config.spread / 2) / (contour.heightFactor * config.spread) * Math.PI), 2) * config.spread * 0.3;
        return new THREE.Vector3(
          Math.cos(angle) * radius * heartScale,
          heartY + heartYOffset,
          Math.sin(angle) * radius * heartScale
        );
        
      case 'flower':
        // 花朵分布：多层花瓣，边缘密集
        const petalLayer = Math.floor(Math.random() * 3);
        // 增强花瓣层次感
        const flowerRadius = radius * (0.4 + petalLayer * 0.4 * finalShapeFactor);
        // 增加垂直波动，使花朵更立体
        const flowerYOffset = Math.sin(angle * 5 + petalLayer * Math.PI / 3) * 0.3 * config.spread * finalShapeFactor;
        return new THREE.Vector3(
          Math.cos(angle) * flowerRadius,
          flowerYOffset,
          Math.sin(angle) * flowerRadius
        );
        
      case 'saturn':
        // 土星分布：环形密集，中心稀疏
        let saturnRadius;
        const saturnRand = Math.random();
        // 增强环形特征，更多粒子集中在环上
        if (saturnRand > 0.2) {
          // 80% 概率在环上
          saturnRadius = radius * (1.3 + Math.sin(angle * 2) * 0.2) * finalShapeFactor;
        } else {
          // 20% 概率在中心
          saturnRadius = radius * 0.4;
        }
        return new THREE.Vector3(
          Math.cos(angle) * saturnRadius,
          (Math.random() - 0.5) * config.spread * 0.2,
          Math.sin(angle) * saturnRadius
        );
        
      case 'buddha':
        // 佛像分布：上半身较宽，下半身较窄
        const buddhaHeight = Math.random() * contour.heightFactor * config.spread - (contour.heightFactor * config.spread) * 0.2;
        // 增强佛像形状特征
        const buddhaRadius = radius * (0.7 + Math.max(0, 1 - buddhaHeight / (contour.heightFactor * config.spread)) * 0.6 * finalShapeFactor);
        // 增加前后厚度变化，使佛像更立体
        const buddhaZOffset = (Math.random() - 0.5) * config.spread * 0.2 * (1 - Math.abs(buddhaHeight) / (contour.heightFactor * config.spread));
        return new THREE.Vector3(
          Math.cos(angle) * buddhaRadius,
          buddhaHeight,
          Math.sin(angle) * buddhaRadius * 0.6 + buddhaZOffset
        );
        
      case 'firework':
        // 烟花分布：中心密集，向外扩散
        const fireworkRadius = radius * Math.pow(Math.random(), 0.3 * finalShapeFactor); // 更偏向中心分布
        // 增加垂直方向的扩散，使烟花更壮观
        const fireworkYOffset = (Math.random() - 0.5) * config.spread * 0.5;
        return new THREE.Vector3(
          Math.cos(angle) * fireworkRadius,
          fireworkYOffset,
          Math.sin(angle) * fireworkRadius
        );
        
      default:
        // 默认分布：球形，但增强形状特征
        const defaultY = (Math.random() - 0.5) * contour.heightFactor * config.spread;
        const defaultRadius = radius * (0.8 + Math.random() * 0.4 * finalShapeFactor);
        return new THREE.Vector3(
          Math.cos(angle) * defaultRadius,
          defaultY,
          Math.sin(angle) * defaultRadius
        );
    }
  };
  
  // 模型混合位置生成函数
  const generateMixedPosition = (angle: number, radius: number): THREE.Vector3 => {
    if (!morphState.isMorphing) {
      return generatePositionByModel(config.model, angle, radius);
    }
    
    // 获取起始模型和目标模型的位置
    const startPos = generatePositionByModel(morphState.startModel, angle, radius);
    const targetPos = generatePositionByModel(morphState.targetModel, angle, radius);
    
    // 使用缓动函数平滑混合
    const t = easeInOutCubic(morphState.progress);
    
    // 线性插值混合位置
    return startPos.lerp(targetPos, t);
  };
  
  // 创建单个粒子 - 使用更高效的数据结构，减少内存占用
  const createParticle = (index: number) => {
    // 随机大小，增加多样性
    const baseScale = Math.random() * 0.8 + 0.2;
    // 随机速度，使粒子运动更自然
    const speedFactor = Math.random() * 0.02 + 0.005;
    
    // 根据行为模式调整初始位置和速度
    let position: THREE.Vector3;
    let speed: THREE.Vector3;
    const angle = (index / config.particleCount) * Math.PI * 2;
    
    // 基于模型轮廓的半径生成，使粒子在模型内部更密集
    const contour = modelContourConfig[config.model as keyof typeof modelContourConfig] || modelContourConfig.default;
    const radius = Math.random() * config.spread * contour.radiusFactor / 2;
    
    switch (config.behavior) {
      case 'spiral':
        ({ position, speed } = createSpiralParticle(angle, radius, speedFactor));
        break;
      case 'explosion':
        ({ position, speed } = createExplosionParticle(speedFactor));
        break;
      case 'wave':
        ({ position, speed } = createWaveParticle(angle, radius, speedFactor));
        break;
      case 'orbit':
        ({ position, speed } = createOrbitParticle(angle, radius, speedFactor));
        break;
      case 'chaos':
        ({ position, speed } = createChaosParticle(speedFactor));
        break;
      default:
        // 使用模型混合位置生成
        position = generateMixedPosition(angle, radius);
        speed = new THREE.Vector3(
          (Math.random() - 0.5) * speedFactor,
          (Math.random() - 0.5) * speedFactor,
          (Math.random() - 0.5) * speedFactor
        );
        break;
    }
    
    // 对所有行为模式应用模型轮廓调整
    if (config.behavior !== 'default') {
      const contourPosition = generateMixedPosition(angle, radius);
      // 混合原始位置和轮廓位置，保留行为特征的同时应用模型轮廓
      position.lerp(contourPosition, 0.3);
    }
    
    // 优化：使用更高效的数据结构，减少内存占用
    const particle: Particle = {
      // 使用数字数组代替THREE.Vector3
      position: [position.x, position.y, position.z],
      prevPosition: [position.x, position.y, position.z], // 用于拖尾效果
      // 使用数字数组代替THREE.Euler
      rotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ],
      scale: baseScale,
      targetScale: Math.random() * 1.5 + 0.5,
      opacity: 0,
      maxOpacity: Math.random() * 0.5 + 0.3,
      life: 0,
      // 使用数字数组代替THREE.Vector3
      speed: [speed.x, speed.y, speed.z],
      // 只在默认行为中使用加速度，其他行为设为null
      acceleration: config.behavior === 'default' ? [
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001
      ] : null,
      // 使用数字数组代替THREE.Color
      color: [
        baseColorRef.current.r + (Math.random() - 0.5) * config.colorVariation,
        baseColorRef.current.g + (Math.random() - 0.5) * config.colorVariation,
        baseColorRef.current.b + (Math.random() - 0.5) * config.colorVariation
      ],
      colorVariation: Math.random() * 0.0005 + 0.0001,
      birthTime: Date.now(),
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02 * config.rotationSpeed,
        y: (Math.random() - 0.5) * 0.02 * config.rotationSpeed,
        z: (Math.random() - 0.5) * 0.02 * config.rotationSpeed
      },
      index,
      angle
    };
    
    return particle;
  };

  // 初始化粒子池
  useEffect(() => {
    // 初始化粒子池
    particlePoolRef.current = new ParticlePool((index: number) => createParticle(index), 1000);
    
    // 清理函数：销毁粒子池，清理定时器
    return () => {
      if (particlePoolRef.current) {
        particlePoolRef.current.destroy();
        particlePoolRef.current = null;
      }
    };
  }, [config.behavior]);

  // 初始化粒子数据 - 优化：使用粒子池，只在必要时重新生成
  useEffect(() => {
    // 更新基础颜色
    baseColorRef.current.set(config.color);
    
    // 只有粒子数量变化时才重新生成粒子数据
    if (particlesRef.current.length !== config.particleCount) {
      // 生成粒子数据，使用粒子池
      const newParticles: any[] = [];
      for (let i = 0; i < config.particleCount; i++) {
        if (particlePoolRef.current) {
          newParticles.push(particlePoolRef.current.getParticle(i));
        } else {
          newParticles.push(createParticle(i));
        }
      }
      particlesRef.current = newParticles;
    }
  }, [config.color, config.particleCount, config.spread]);

  // 获取几何体 - 为不同模型类型使用更匹配的几何体
  const geometry = React.useMemo(() => {
    let geom: THREE.BufferGeometry;
    const size = 0.1 * config.scale;
    
    // 根据模型类型选择更匹配的几何体
    switch (config.model) {
      case 'heart':
        // 心形粒子使用更圆润的几何体
        geom = new THREE.SphereGeometry(size, 12, 12);
        break;
      case 'flower':
        // 花朵粒子使用多面体
        geom = new THREE.IcosahedronGeometry(size, 1);
        break;
      case 'saturn':
        // 土星粒子使用环形几何体
        geom = new THREE.TorusGeometry(size * 1.5, size * 0.3, 12, 48);
        break;
      case 'buddha':
        // 佛像粒子使用更对称的几何体
        geom = new THREE.OctahedronGeometry(size, 1);
        break;
      case 'firework':
        // 烟花粒子使用尖锐的几何体
        geom = new THREE.TetrahedronGeometry(size, 1);
        break;
      case 'baozi':
        // 包子粒子使用椭圆体，更接近包子形状
        const baoziGeometry = new THREE.SphereGeometry(size, 12, 12);
        // 缩放球体为椭圆体，更接近包子形状
        baoziGeometry.scale(1.0, 0.8, 1.0);
        geom = baoziGeometry;
        break;
      default:
        geom = new THREE.SphereGeometry(size, 8, 8);
        break;
    }
    
    return geom;
  }, [config.model, config.scale]);

  // 为不同模型类型使用更合适的材质，增强视觉效果
  const material = React.useMemo(() => {
    // 基础材质属性
    const baseProps: any = {
      transparent: true,
      opacity: 0.9, // 增加透明度，使粒子更明亮
      blending: THREE.AdditiveBlending, // 使用加法混合，增强发光效果
      depthWrite: false // 关闭深度写入，减少渲染开销
    };
    
    switch (config.model) {
      case 'baozi':
        // 包子粒子使用柔和的发光材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.4), // 增强自发光
          shininess: 60, // 增加光泽度
          specular: new THREE.Color(config.color).multiplyScalar(0.6) // 增强高光
        });
        
      case 'flower':
        // 花朵粒子使用鲜艳的发光材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.6), // 更强的自发光
          shininess: 100, // 高光泽度
          specular: new THREE.Color(config.color).multiplyScalar(0.8)
        });
        
      case 'saturn':
        // 土星粒子使用金属发光材质
        return new THREE.MeshStandardMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.3),
          metalness: 0.8, // 增强金属质感
          roughness: 0.2, // 降低粗糙度，增加光泽
          envMapIntensity: 1.5 // 增强环境光反射
        });
        
      case 'firework':
        // 烟花粒子使用强烈的自发光材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(1.0), // 非常强的自发光
          shininess: 150, // 极高光泽度
          specular: new THREE.Color(config.color).multiplyScalar(1.2),
          opacity: 1.0 // 完全不透明，增强烟花效果
        });
        
      case 'heart':
        // 心形粒子使用浪漫的发光材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.5),
          shininess: 80,
          specular: new THREE.Color('#ffffff').multiplyScalar(0.8) // 白色高光，增强浪漫感
        });
        
      case 'buddha':
        // 佛像粒子使用神圣的发光材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.3),
          shininess: 50,
          specular: new THREE.Color('#ffffff').multiplyScalar(0.5) // 柔和的白色高光
        });
        
      default:
        // 默认材质
        return new THREE.MeshPhongMaterial({
          ...baseProps,
          color: config.color,
          emissive: new THREE.Color(config.color).multiplyScalar(0.2),
          shininess: 40
        });
    }
  }, [config.color, config.model]);
  
  // 移除不再使用的着色器uniforms更新hook

  // 动态调整批处理大小
  const adjustBatchSize = (currentFps: number) => {
    // 更新帧率历史
    fpsHistoryRef.current.push(currentFps);
    if (fpsHistoryRef.current.length > 10) {
      fpsHistoryRef.current.shift();
    }
    
    // 计算平均帧率
    const averageFps = fpsHistoryRef.current.reduce((sum, fps) => sum + fps, 0) / fpsHistoryRef.current.length;
    
    // 根据平均帧率调整批处理大小
    if (averageFps < targetFps * 0.8) {
      // 帧率低于目标的80%，减少每帧处理的粒子数
      particlesPerBatchRef.current = Math.max(
        minParticlesPerBatch,
        particlesPerBatchRef.current - Math.floor(particlesPerBatchRef.current * adjustmentFactor)
      );
    } else if (averageFps > targetFps * 0.95) {
      // 帧率接近目标，增加每帧处理的粒子数
      particlesPerBatchRef.current = Math.min(
        maxParticlesPerBatch,
        particlesPerBatchRef.current + Math.floor(particlesPerBatchRef.current * adjustmentFactor)
      );
    }
    
    lastFpsRef.current = averageFps;
  };
  
  // 优化的粒子更新函数
  const updateParticles = (currentFps: number) => {
    if (!meshRef.current || isUpdatingRef.current) return;
    
    // 动态调整批处理大小
    adjustBatchSize(currentFps);
    
    isUpdatingRef.current = true;
    
    try {
      // 开始性能监控
      const updateStartTime = performance.now();
      
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastUpdateTimeRef.current) / 1000, 0.1); // 限制最大时间步
      lastUpdateTimeRef.current = currentTime;
      
      const overallScale = gestureData?.scale || 1;
      const spreadFactor = gestureData?.spread || 5;


      
      // 平滑的整体缩放更新
      meshRef.current.scale.lerp(new THREE.Vector3(overallScale, overallScale, overallScale), 0.15);

      // 只有当相机移动或旋转时才更新视锥体
      const cameraPositionLength = camera.position.length();
      // 安全获取相机旋转值，避免直接调用length()方法
      const cameraRotation = {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      };
      
      // 使用安全的比较方式，避免直接比较对象
      const rotationChanged = 
        Math.abs(cameraRotation.x - lastCameraRotationRef.current.x) > 0.001 ||
        Math.abs(cameraRotation.y - lastCameraRotationRef.current.y) > 0.001 ||
        Math.abs(cameraRotation.z - lastCameraRotationRef.current.z) > 0.001;
      
      if (cameraPositionLength !== lastCameraPositionRef.current || rotationChanged) {
        // 更新视锥体信息，用于视锥体剔除
        camera.updateMatrixWorld();
        projMatrixRef.current.copy(camera.projectionMatrix);
        viewMatrixRef.current.copy(camera.matrixWorldInverse);
        combinedMatrixRef.current.multiplyMatrices(projMatrixRef.current, viewMatrixRef.current);
        frustumRef.current.setFromProjectionMatrix(combinedMatrixRef.current);        
        
        // 更新相机位置和旋转缓存
        lastCameraPositionRef.current = cameraPositionLength;
        lastCameraRotationRef.current = cameraRotation;
      }

      // 更新每个实例 - 分批处理优化
      const particles = particlesRef.current;
      const particleCount = particles.length;
      let visibleCount = 0;
      
      // 辅助向量，避免重复创建
      const tempVec3 = new THREE.Vector3();
      
      // 分批处理粒子更新，每帧只处理一部分粒子
      const startIndex = batchIndexRef.current;
      const endIndex = Math.min(startIndex + particlesPerBatchRef.current, particleCount);
      
      // 只更新当前批次的粒子
      for (let i = startIndex; i < endIndex; i++) {
        const particle = particles[i];
        
        // 快速视锥体剔除：使用简单的距离检查先过滤掉远处的粒子
        const distSq = particle.position[0] ** 2 + particle.position[1] ** 2 + particle.position[2] ** 2;
        if (distSq > spreadFactor * spreadFactor * 9) {
          continue;
        }
        
        // 精确视锥体剔除：只对近距离粒子进行精确检查
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (!frustumRef.current.containsPoint(tempVec3)) {
          continue; // 跳过视锥体之外的粒子
        }
        
        // 优化的生命周期管理 - 更平滑的出生、成长、衰减和死亡
        const totalLifetime = 7000; // 总生命周期
        const age = (currentTime - particle.birthTime) / totalLifetime;
        
        if (age < 0.1) {
          // 出生阶段：0-10% - 快速增长
          const birthProgress = age / 0.1;
          particle.life = easeOutElastic(birthProgress);
          particle.opacity = particle.life * particle.maxOpacity;
          // 出生时大小从0增长到目标大小
          particle.scale = particle.targetScale * particle.life;
        } else if (age < 0.7) {
          // 成长阶段：10-70% - 稳定增长
          const growthProgress = (age - 0.1) / 0.6;
          particle.life = 0.8 + 0.2 * easeOutCubic(growthProgress);
          // 平滑的呼吸效果
          particle.opacity = particle.maxOpacity * (0.85 + 0.15 * Math.sin(currentTime * 0.01 + i * 0.2));
          // 成长阶段大小缓慢变化
          particle.scale = particle.targetScale * (0.9 + 0.1 * Math.sin(currentTime * 0.005 + i * 0.1));
        } else if (age < 0.9) {
          // 成熟阶段：70-90% - 稳定状态
          particle.life = 1;
          // 稳定的透明度
          particle.opacity = particle.maxOpacity;
          // 成熟阶段大小稳定
          particle.scale = particle.targetScale;
        } else if (age < 1) {
          // 衰减阶段：90-100% - 快速衰减
          const decayProgress = 1 - (age - 0.9) / 0.1;
          particle.life = easeOutExpo(decayProgress);
          particle.opacity = particle.life * particle.maxOpacity;
          // 衰减阶段大小逐渐减小
          particle.scale = particle.targetScale * particle.life;
        } else {
          // 死亡阶段：100%+ - 准备重生
          const rebirthDelay = Math.random() * 2000;
          if (Date.now() - particle.birthTime > totalLifetime + rebirthDelay) {
            if (particlePoolRef.current) {
              // 回收旧粒子到池中
              particlePoolRef.current.recycleParticle(particle);
              // 从池中获取新粒子
              particles[i] = particlePoolRef.current.getParticle(i);
            } else {
              // 粒子池未初始化时的回退方案
              particles[i] = createParticle(i);
            }
          }
          continue;
        }
        
        // 位置和速度更新 - 根据行为模式应用不同规则
        const speedFactor = 0.02;
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        const radius = tempVec3.length();
        
        switch (config.behavior) {
          case 'spiral':
            // 螺旋行为：螺旋式运动
            particle.position[0] += Math.sin(particle.angle) * speedFactor * deltaTime * 60 * 0.5;
            particle.position[1] += -Math.cos(particle.angle) * speedFactor * deltaTime * 60 * 0.5;
            particle.position[2] += (Math.random() - 0.5) * speedFactor * deltaTime * 60 * 0.2;
            // 更新角度
            particle.angle += deltaTime * 60 * 0.01 * config.animationSpeed;
            break;
            
          case 'explosion':
            // 爆炸行为：持续向外运动，逐渐减速
            particle.speed[0] *= 0.985;
            particle.speed[1] *= 0.985;
            particle.speed[2] *= 0.985;
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            break;
            
          case 'wave':
            // 波浪行为：上下波动
            const waveOffset = Math.sin(particle.angle * 3 + currentTime * 0.01 * config.animationSpeed) * 0.5;
            particle.position[1] = waveOffset * radius;
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 向中心的弱吸引力
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const attractionX = (-tempVec3.x) * 0.0001 * deltaTime * 60;
            const attractionY = (-tempVec3.y) * 0.0001 * deltaTime * 60;
            const attractionZ = (-tempVec3.z) * 0.0001 * deltaTime * 60;
            particle.position[0] += attractionX;
            particle.position[1] += attractionY;
            particle.position[2] += attractionZ;
            break;
            
          case 'orbit':
            // 轨道行为：围绕中心旋转
            particle.angle += deltaTime * 60 * 0.005 * config.animationSpeed;
            const orbitRadius = radius;
            particle.position[0] = Math.cos(particle.angle) * orbitRadius;
            particle.position[2] = Math.sin(particle.angle) * orbitRadius;
            // 轻微的上下浮动
            particle.position[1] = Math.sin(currentTime * 0.005 + particle.index) * 0.5;
            break;
            
          case 'chaos':
            // 混沌行为：随机运动，无规则
            // 随机改变速度方向和大小
            particle.speed[0] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            particle.speed[1] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            particle.speed[2] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            
            // 限制最大速度
            tempVec3.set(particle.speed[0], particle.speed[1], particle.speed[2]);
            const maxSpeed = 0.1 * config.animationSpeed;
            if (tempVec3.length() > maxSpeed) {
              tempVec3.normalize().multiplyScalar(maxSpeed);
              particle.speed[0] = tempVec3.x;
              particle.speed[1] = tempVec3.y;
              particle.speed[2] = tempVec3.z;
            }
            
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 弱中心吸引力，防止粒子完全飞散
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const chaosAttractionX = (-tempVec3.x) * 0.0001 * deltaTime * 60;
            const chaosAttractionY = (-tempVec3.y) * 0.0001 * deltaTime * 60;
            const chaosAttractionZ = (-tempVec3.z) * 0.0001 * deltaTime * 60;
            particle.position[0] += chaosAttractionX;
            particle.position[1] += chaosAttractionY;
            particle.position[2] += chaosAttractionZ;
            break;
            
          default:
            // 默认行为：自然漂移
            if (particle.acceleration) {
              // 更新速度
              particle.speed[0] += particle.acceleration[0] * deltaTime * 60;
              particle.speed[1] += particle.acceleration[1] * deltaTime * 60;
              particle.speed[2] += particle.acceleration[2] * deltaTime * 60;
            }
            // 阻尼效果
            particle.speed[0] *= 0.995;
            particle.speed[1] *= 0.995;
            particle.speed[2] *= 0.995;
            
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 向中心的吸引力，使粒子更集中
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const centerAttractionX = (-tempVec3.x) * 0.0003 * deltaTime * 60;
            const centerAttractionY = (-tempVec3.y) * 0.0003 * deltaTime * 60;
            const centerAttractionZ = (-tempVec3.z) * 0.0003 * deltaTime * 60;
            particle.position[0] += centerAttractionX;
            particle.position[1] += centerAttractionY;
            particle.position[2] += centerAttractionZ;
            break;
        }
        
        // 基于模型轮廓的凝聚力 - 所有行为模式都应用
        const contour = modelContourConfig[config.model as keyof typeof modelContourConfig] || modelContourConfig.default;
        
        // 计算粒子应该在的理想轮廓位置
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        
        switch (config.model) {
          case 'baozi':
            // 包子形状凝聚力：保持底部宽、顶部窄的形状
            const baoziHeight = particle.position[1];
            const idealBaoziRadius = spreadFactor * (1 - Math.abs(baoziHeight) / (contour.heightFactor * spreadFactor) * 0.3);
            const currentBaoziRadius = Math.sqrt(particle.position[0] ** 2 + particle.position[2] ** 2);
            
            if (currentBaoziRadius > idealBaoziRadius * 1.1) {
              // 超出理想半径，施加向心拉力
              const pullStrength = 0.0005 * deltaTime * 60;
              particle.position[0] *= (1 - pullStrength);
              particle.position[2] *= (1 - pullStrength);
            }
            break;
            
          case 'heart':
            // 心形凝聚力：保持上下不对称的形状
            const heartY = particle.position[1];
            
            if (Math.abs(heartY) > contour.heightFactor * spreadFactor * 0.4) {
              // 心形顶部和底部，施加更强的向心拉力
              const pullStrength = 0.0007 * deltaTime * 60;
              particle.position[0] *= (1 - pullStrength);
              particle.position[2] *= (1 - pullStrength);
            }
            break;
            
          case 'saturn':
            // 土星形状凝聚力：保持环形结构
            const saturnRadius = Math.sqrt(particle.position[0] ** 2 + particle.position[2] ** 2);
            const idealRingRadius = spreadFactor * 1.2;
            
            if (saturnRadius < idealRingRadius * 0.7 && Math.random() > 0.3) {
              // 30%概率让中心粒子向外移动，保持环形稀疏
              const pushStrength = 0.0003 * deltaTime * 60;
              particle.position[0] *= (1 + pushStrength);
              particle.position[2] *= (1 + pushStrength);
            } else if (saturnRadius > idealRingRadius * 1.3) {
              // 超出环形，拉回
              const pullStrength = 0.0006 * deltaTime * 60;
              particle.position[0] *= (1 - pullStrength);
              particle.position[2] *= (1 - pullStrength);
            }
            break;
        }
        
        // 通用凝聚力：保持在模型轮廓范围内
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        const currentDistance = tempVec3.length();
        const maxAllowedDistance = spreadFactor * contour.radiusFactor;
        
        if (currentDistance > maxAllowedDistance) {
          // 超出最大距离，平滑拉回
          const pullRatio = maxAllowedDistance / currentDistance;
          particle.position[0] = particle.position[0] * 0.95 + tempVec3.x * pullRatio * 0.05;
          particle.position[1] = particle.position[1] * 0.95 + tempVec3.y * pullRatio * 0.05;
          particle.position[2] = particle.position[2] * 0.95 + tempVec3.z * pullRatio * 0.05;
          
          // 速度反转，防止持续飞出
          particle.speed[0] *= -0.3;
          particle.speed[1] *= -0.3;
          particle.speed[2] *= -0.3;
        }
        
        // 垂直方向约束，保持模型高度
        if (Math.abs(particle.position[1]) > contour.heightFactor * spreadFactor * 0.5) {
          const pullStrength = 0.0008 * deltaTime * 60;
          particle.position[1] *= (1 - pullStrength);
          particle.speed[1] *= -0.2;
        }
        
        // 保存之前的位置用于拖尾效果 - 适配新的数据结构
        particle.prevPosition[0] = particle.position[0];
        particle.prevPosition[1] = particle.position[1];
        particle.prevPosition[2] = particle.position[2];
        
        // 旋转动画 - 适配rotationSpeed为普通对象的变化
        particle.rotation[0] += particle.rotationSpeed.x * deltaTime * 60 * config.rotationSpeed;
        particle.rotation[1] += particle.rotationSpeed.y * deltaTime * 60 * config.rotationSpeed;
        particle.rotation[2] += particle.rotationSpeed.z * deltaTime * 60 * config.rotationSpeed;
        
        // 缩放动画
        const scaleVariation = Math.sin(currentTime * 0.01 + i * 0.4) * 0.4;
        const baseScale = particle.targetScale * (0.7 + 0.3 * particle.life);
        particle.scale = baseScale + scaleVariation;
        
        // 边界检查 - 增强版，考虑模型轮廓
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (tempVec3.length() > spreadFactor * contour.radiusFactor * 1.5) {
          // 计算目标位置，考虑模型轮廓
          tempVec3.normalize().multiplyScalar(spreadFactor * contour.radiusFactor * 1.3);
          // 平滑过渡
          particle.position[0] = particle.position[0] * 0.9 + tempVec3.x * 0.1;
          particle.position[1] = particle.position[1] * 0.9 + tempVec3.y * 0.1;
          particle.position[2] = particle.position[2] * 0.9 + tempVec3.z * 0.1;
          // 速度反转
          particle.speed[0] *= -0.4;
          particle.speed[1] *= -0.4;
          particle.speed[2] *= -0.4;
        }
        
        // 可见性检查：只更新在视锥体内部或附近的粒子
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (tempVec3.length() < spreadFactor * 3) {
          // 更新实例矩阵 - 适配新的数据结构
          dummyRef.current.position.set(particle.position[0], particle.position[1], particle.position[2]);
          dummyRef.current.rotation.set(particle.rotation[0], particle.rotation[1], particle.rotation[2]);
          dummyRef.current.scale.setScalar(particle.scale);
          dummyRef.current.updateMatrix();
          meshRef.current.setMatrixAt(i, dummyRef.current.matrix);
          visibleCount++;
        }
      }
      
      // 更新拖尾效果 - 优化：降低更新频率，只更新部分粒子的拖尾
      if (config.showTrails && trailRef.current && currentTime - trailRef.current.lastUpdateTime > 50) { // 每50ms更新一次拖尾
        const { points, geometry } = trailRef.current;
        let trailsUpdated = false;
        
        // 优化：只更新当前批次粒子的拖尾，减少计算量
        for (let i = startIndex; i < endIndex; i += 2) { // 只更新奇数索引的粒子拖尾，减少一半计算量
          const particle = particles[i];
          // 只更新可见粒子的拖尾（距离中心较近的粒子）
          tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
          if (tempVec3.length() < spreadFactor * 3) {
            const offset = i * 2 * 3;
            
            // 设置前一位置
            points[offset] = particle.prevPosition[0];
            points[offset + 1] = particle.prevPosition[1];
            points[offset + 2] = particle.prevPosition[2];
            
            // 设置当前位置
            points[offset + 3] = particle.position[0];
            points[offset + 4] = particle.position[1];
            points[offset + 5] = particle.position[2];
            
            trailsUpdated = true;
          }
        }
        
        // 只在有更新时才标记需要更新
        if (trailsUpdated) {
          geometry.attributes.position.needsUpdate = true;
          trailRef.current.lastUpdateTime = currentTime; // 更新最后更新时间
        }
      }
      
      // 更新批次索引，循环处理所有粒子
      batchIndexRef.current = endIndex >= particleCount ? 0 : endIndex;
      
      // 只有当有可见粒子更新时，才更新实例矩阵
      if (visibleCount > 0) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      
      // 结束性能监控，记录粒子更新时间
      const updateEndTime = performance.now();
      const updateDuration = updateEndTime - updateStartTime;
    } catch (error) {
      console.error('Error updating particles:', error);
    } finally {
      // 确保标志被重置为false，无论是否发生错误
      isUpdatingRef.current = false;
    }
  };

  // 帧跳过相关引用
  const frameSkipRef = useRef(0);
  const skipThreshold = 30; // 当FPS低于此值时开始跳帧
  
  // 根据手势数据更新粒子 - 修复帧率计算和性能监控
  useFrame((state) => {
    // 计算当前帧率
    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;
    
    // 帧跳过机制：当FPS低于阈值时，跳过部分帧的更新
    if (fps < skipThreshold) {
      frameSkipRef.current++;
      // 根据FPS动态调整跳帧间隔，FPS越低跳帧越多
      const skipInterval = Math.max(1, Math.round((skipThreshold - fps) / 5));
      if (frameSkipRef.current % skipInterval === 0) {
        updateParticles(fps);
        frameSkipRef.current = 0;
      }
    } else {
      // FPS正常，更新所有粒子
      updateParticles(fps);
      frameSkipRef.current = 0;
    }
    
    // 更新最后更新时间
    lastUpdateTimeRef.current = now;
  });

  // 缓动函数 - 缓出弹性
  const easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  };

  // 缓动函数 - 缓出指数
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  // 缓动函数 - 缓出立方
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };


  // 缓动函数 - 缓入缓出
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.particleCount]}
    />
  );
};

// 主粒子系统容器组件
const ParticleSystemContainer: React.FC<{
  model?: ParticleModelType;
  color?: string;
  behavior?: ParticleBehavior;
  particleCount?: number;
  particleSize?: number;
  animationSpeed?: number;
  rotationSpeed?: number;
  colorVariation?: number;
  showTrails?: boolean;
  shapeIntensity?: number;
}> = ({ 
  model = 'heart',
  color = '#ff6b6b',
  behavior = 'default',
  particleCount = 300, // 增加默认粒子数量，使形状更清晰
  particleSize = 1.0, // 调整粒子大小
  animationSpeed = 1.0,
  rotationSpeed = 0.8, // 降低旋转速度
  colorVariation = 0.3, // 减少颜色变化
  showTrails = true, // 默认开启拖尾效果
  shapeIntensity = 1.2 // 形状强度默认值
}) => {
  // 平滑的手势数据，添加缓动效果
  const [smoothedGestureData] = useState({ scale: 1, spread: 5 });
  
  // 粒子配置状态
  const [localParticleCount, setLocalParticleCount] = useState(particleCount); // 增加默认粒子数量，提升视觉效果
  const [localParticleSize, setLocalParticleSize] = useState(particleSize); // 调整默认粒子大小
  const [localAnimationSpeed, setLocalAnimationSpeed] = useState(animationSpeed);
  const [localShowTrails, setLocalShowTrails] = useState(showTrails); // 拖尾效果
  const [localRotationSpeed, setLocalRotationSpeed] = useState(rotationSpeed); // 旋转速度
  const [localColorVariation, setLocalColorVariation] = useState(colorVariation); // 颜色变化幅度
  const [localShapeIntensity, setLocalShapeIntensity] = useState(shapeIntensity); // 形状强度
  const [emissionRate] = useState(1.0); // 发射速率
  const [currentBehavior, setCurrentBehavior] = useState<ParticleBehavior>(behavior); // 粒子行为模式，使用传入的prop作为初始值
  
  // 当props变化时更新本地状态
  useEffect(() => {
    setLocalParticleCount(particleCount);
  }, [particleCount]);

  useEffect(() => {
    setLocalParticleSize(particleSize);
  }, [particleSize]);

  useEffect(() => {
    setLocalAnimationSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    setLocalRotationSpeed(rotationSpeed);
  }, [rotationSpeed]);

  useEffect(() => {
    setLocalColorVariation(colorVariation);
  }, [colorVariation]);

  useEffect(() => {
    setLocalShowTrails(showTrails);
  }, [showTrails]);

  useEffect(() => {
    setLocalShapeIntensity(shapeIntensity);
  }, [shapeIntensity]);

  useEffect(() => {
    setCurrentBehavior(behavior);
  }, [behavior]);
  
  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureSmoothingFactor = 0.15; // 平滑因子，值越小越平滑

  // 粒子系统配置
  const particleConfig: ParticleConfig = {
    model,
    color,
    particleCount: localParticleCount,
    scale: localParticleSize,
    spread: 5,
    size: localParticleSize,
    animationSpeed: localAnimationSpeed,
    gestureSensitivity: 1.0, // 默认手势灵敏度
    showTrails: localShowTrails,
    rotationSpeed: localRotationSpeed,
    colorVariation: localColorVariation,
    emissionRate: emissionRate,
    behavior: currentBehavior,
    shapeIntensity: localShapeIntensity
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* 主Canvas区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas
          shadows={false} // 禁用阴影，减少计算开销
          className="w-full h-full"
          camera={{
            position: [0, 0, 10],
            fov: 75
          }}
          gl={{
            antialias: false, // 禁用抗锯齿，提高性能
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false // 禁用缓冲区保存，减少内存占用
          }}
        >
          {/* 简化的光照设置，减少计算开销 */}
          <ambientLight intensity={0.6} color="#ffffff" />
          {/* 移除阴影投射，使用单一高效的定向光 */}
          <directionalLight
            position={[5, 5, 3]}
            intensity={0.8}
            color="#ffffff"
          />
          {/* 粒子系统 */}
          <InstancedParticleSystem
            config={particleConfig}
            gestureData={smoothedGestureData}
          />
          {/* 相机控制 - 优化设置以提高性能 */}
          <OrbitControls
            enableDamping={true}
            dampingFactor={0.1} // 增加阻尼因子，减少计算开销
            enableZoom={true}
            enablePan={false} // 禁用平移，减少操作复杂性
            enableRotate={true}
            rotateSpeed={0.8} // 适当降低旋转速度
            zoomSpeed={0.5} // 适当降低缩放速度
            minDistance={5} // 设置最小距离，防止太近导致性能问题
            maxDistance={20} // 设置最大距离，防止太远影响视觉效果
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
        </Canvas>
      </div>
    </div>
  );
};

// 导出InstancedParticleSystem组件，用于直接在现有Canvas中使用

// 导出默认的容器组件
export default ParticleSystemContainer;