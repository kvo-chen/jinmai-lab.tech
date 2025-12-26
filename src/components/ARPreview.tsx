import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, ARButton, createXRStore } from '@react-three/xr';


import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import LazyImage from './LazyImage';
import { processImageUrl } from '../utils/imageUrlUtils';

// 创建XRStore实例
const xrStore = createXRStore();

// 动态导入3D模型加载器的工具函数
const loadModelLoader = async (type: 'gltf' | 'fbx' | 'obj' | 'collada') => {
  switch (type) {
    case 'gltf':
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      return new GLTFLoader();
    case 'fbx':
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
      return new FBXLoader();
    case 'obj':
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
      return new OBJLoader();
    case 'collada':
      const { ColladaLoader } = await import('three/examples/jsm/loaders/ColladaLoader.js');
      return new ColladaLoader();
    default:
      throw new Error(`Unsupported model type: ${type}`);
  }
};

// 导入作品类型
import type { Work } from '@/mock/works';

// AR预览配置类型
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

// 粒子效果配置类型
interface ParticleEffectConfig {
  enabled: boolean;
  type: 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos';
  particleCount: number;
  particleSize: number;
  animationSpeed: number;
  color: string;
  showTrails: boolean;
  rotationSpeed: number;
}

// 点击互动配置类型
interface ClickInteractionConfig {
  enabled: boolean;
  effectType: 'explosion' | 'colorChange' | 'sizeChange' | 'particleSpawn' | 'trail';
  intensity: number;
  radius: number;
  duration: number;
}

// 渲染设置类型定义
interface RenderSettings {
  pixelRatio: number;
  antialias: boolean;
  shadowMapEnabled: boolean;
  showAdvancedEffects: boolean;
  particleCount: number;
  advancedLighting: boolean;
}

// 设备性能检测结果缓存，避免重复计算
let devicePerformanceCache: ReturnType<typeof getDevicePerformance> | null = null;
const cacheExpiryTime = 10 * 60 * 1000; // 缓存10分钟，延长缓存时间减少重复计算
let cacheTimestamp = 0;

// 设备性能检测工具 - 增强版，支持设备类型和AR能力检测
const getDevicePerformance = () => {
  // 检查缓存是否有效
  const now = Date.now();
  if (devicePerformanceCache && (now - cacheTimestamp) < cacheExpiryTime) {
    return devicePerformanceCache;
  }
  
  // 检测设备性能的多种指标
  let isLowEndDevice = false;
  let isMediumEndDevice = false;
  let isHighEndDevice = false;
  
  // 1. CPU核心数检测
  const cpuCores = navigator.hardwareConcurrency || 4;
  
  // 2. 设备内存检测
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // 3. 增强的设备类型检测
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const deviceType = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  
  // 4. 增强的浏览器性能检测
  const browserInfo = {
    name: 'unknown',
    version: '0',
    isChrome: /Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent),
    isEdge: /Edg\//i.test(userAgent),
    isSafari: /Safari/i.test(userAgent) && !/Chrome\//i.test(userAgent),
    isFirefox: /Firefox\//i.test(userAgent),
    isOpera: /Opera|OPR\//i.test(userAgent),
    isIE: /MSIE|Trident/i.test(userAgent),
    versionNumber: parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || 
                     userAgent.match(/Edg\/(\d+)/)?.[1] || 
                     userAgent.match(/Firefox\/(\d+)/)?.[1] || 
                     userAgent.match(/Version\/(\d+)/)?.[1] || '0')
  };
  
  // 检测低性能浏览器 - 优化版本，支持更新的浏览器版本
  const isLowPerformanceBrowser = browserInfo.isIE || 
                                   browserInfo.isOpera && browserInfo.versionNumber < 80 ||
                                   browserInfo.isChrome && browserInfo.versionNumber < 90 ||
                                   browserInfo.isEdge && browserInfo.versionNumber < 90 ||
                                   browserInfo.isFirefox && browserInfo.versionNumber < 85;
  
  // 5. 更全面的GPU性能检测
  let gpuPerformanceScore = 0;
  let webGLVersion = 0;
  let hasWebGL = false;
  let gpuVendor = 'unknown';
  let gpuRenderer = 'unknown';
  let maxTextureSize = 2048;
  let maxVertexAttribs = 8;
  let shaderPrecision = 0;
  let gpuMemoryMB = 0;
  
  // 6. WebGL特性检测（更全面的GPU性能检测）
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl) {
      hasWebGL = true;
      webGLVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;
      
      // 检测GPU信息
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
      }
      
      // 检测GPU扩展支持
      const extensions = gl.getSupportedExtensions() || [];
      
      // 基础扩展支持（每个基础扩展+1分）
      const basicExtensions = ['WEBGL_compressed_textures', 'OES_texture_float', 'OES_standard_derivatives', 'OES_vertex_array_object'];
      basicExtensions.forEach(ext => {
        if (extensions.includes(ext)) {
          gpuPerformanceScore += 1;
        }
      });
      
      // 高级扩展支持（每个高级扩展+2分）
      const advancedExtensions = ['EXT_shader_texture_lod', 'WEBGL_draw_buffers', 'WEBGL_color_buffer_float', 
                                 'WEBGL_depth_texture', 'WEBGL_multisampled_render_to_texture', 
                                 'EXT_color_buffer_float', 'WEBGL_color_buffer_half_float'];
      advancedExtensions.forEach(ext => {
        if (extensions.includes(ext)) {
          gpuPerformanceScore += 2;
        }
      });
      
      // 检测GPU最大纹理尺寸
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      if (maxTextureSize >= 32768) {
        gpuPerformanceScore += 5;
      } else if (maxTextureSize >= 16384) {
        gpuPerformanceScore += 4;
      } else if (maxTextureSize >= 8192) {
        gpuPerformanceScore += 3;
      } else if (maxTextureSize >= 4096) {
        gpuPerformanceScore += 2;
      } else if (maxTextureSize >= 2048) {
        gpuPerformanceScore += 1;
      }
      
      // 检测最大顶点属性数量
      maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number;
      if (maxVertexAttribs >= 32) {
        gpuPerformanceScore += 3;
      } else if (maxVertexAttribs >= 16) {
        gpuPerformanceScore += 2;
      } else if (maxVertexAttribs >= 8) {
        gpuPerformanceScore += 1;
      }
      
      // 检测着色器精度
      const shaderPrecisionFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      shaderPrecision = shaderPrecisionFormat.precision;
      if (shaderPrecision >= 23) {
        gpuPerformanceScore += 2;
      } else if (shaderPrecision >= 16) {
        gpuPerformanceScore += 1;
      }
      
      // 检测最大统一变量数量
      const maxUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
      if (maxUniforms >= 1024) {
        gpuPerformanceScore += 2;
      } else if (maxUniforms >= 512) {
        gpuPerformanceScore += 1;
      }
      
      // 估算GPU内存（MB）
      gpuMemoryMB = Math.min(4096, Math.max(256, Math.pow(2, Math.floor(Math.log2(maxTextureSize * maxTextureSize * 4 / (1024 * 1024))))));
    }
  } catch (e) {
    // WebGL检测失败，继续执行
    hasWebGL = false;
  }
  
  // 7. WebXR支持检测 - 增强版
  let isWebXRSupported = 'xr' in navigator;
  let isARWebXRSupported = false;
  let webXRFeatures: string[] = [];
  let supportedARSessionModes: string[] = [];
  
  // 8. ARCore/ARKit支持检测 - 增强版
  let hasARCore = false;
  let hasARKit = false;
  let arPlatform = '';
  
  // 检测ARCore（Android）
  if (isMobile && /Android/i.test(userAgent)) {
    hasARCore = isWebXRSupported && 
               (navigator.userAgent.includes('ARCore') || 
                /Google Play Services for AR/i.test(userAgent) ||
                navigator.userAgent.includes('ARCore/'));
    if (hasARCore) {
      arPlatform = 'arcore';
    }
  }
  
  // 检测ARKit（iOS）
  if (isMobile && /iPhone|iPad/i.test(userAgent)) {
    hasARKit = isWebXRSupported && 
              navigator.vendor.includes('Apple');
    if (hasARKit) {
      arPlatform = 'arkit';
    }
  }
  
  // 9. 设备性能API检测
  const hasPerformanceAPI = 'performance' in window && 'getEntriesByType' in window.performance;
  const hasPerformanceMemory = hasPerformanceAPI && typeof (window.performance as any).memory !== 'undefined';
  const memoryInfo = hasPerformanceMemory ? (window.performance as any).memory : null;
  
  // 10. 检测设备刷新率
  const maxRefreshRate = (window.screen as any).refreshRate || 60;
  
  // 11. 检测屏幕分辨率
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const screenArea = screenWidth * screenHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // 综合AR支持检测
  const isARSupported = isWebXRSupported && (hasARCore || hasARKit || isMobile);
  
  // 异步检测AR WebXR支持，不影响同步返回结果
  if (isWebXRSupported) {
    try {
      (navigator.xr as any).isSessionSupported('immersive-ar')
        .then((supported: boolean) => {
          // 更新缓存中的值，下次调用时生效
          if (devicePerformanceCache) {
            devicePerformanceCache.isARWebXRSupported = supported;
          }
        })
        .catch(() => {
          // 忽略错误
        });
    } catch (error) {
      // 忽略错误
    }
  }
  
  // 12. 检测设备电池状态，低电量设备可能性能受限
  let batteryLevel = 1;
  let batteryCharging = true;
  try {
    if ('battery' in navigator || 'getBattery' in navigator) {
      const batteryPromise = ('getBattery' in navigator) ? (navigator as any).getBattery() : Promise.resolve((navigator as any).battery);
      batteryPromise.then((battery: any) => {
        batteryLevel = battery.level;
        batteryCharging = battery.charging;
      }).catch(() => {
        // 忽略电池检测错误
      });
    }
  } catch (e) {
    // 忽略电池检测错误
  }
  
  // 13. 检测设备CPU性能（使用Performance API）
  let cpuPerformanceScore = 0;
  if (hasPerformanceAPI) {
    try {
      // 使用navigation timing API获取页面加载性能
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        if (navEntry.loadEventEnd > 0) {
          // 页面加载时间越短，CPU性能越好
          const loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
          if (loadTime < 1000) {
            cpuPerformanceScore += 3;
          } else if (loadTime < 2000) {
            cpuPerformanceScore += 2;
          } else if (loadTime < 3000) {
            cpuPerformanceScore += 1;
          }
        }
      }
    } catch (e) {
      // 忽略性能API错误
    }
  }
  
  // 综合性能评估 - 增强版算法
  // 计算综合性能得分
  let totalScore = 0;
  
  // CPU核心数得分（1-8分）
  totalScore += Math.min(8, cpuCores);
  
  // CPU性能得分（0-3分）
  totalScore += cpuPerformanceScore;
  
  // 内存得分（1-16分）
  totalScore += Math.min(16, deviceMemory * 2);
  
  // GPU性能得分（0-40分，增加权重）
  totalScore += Math.min(40, gpuPerformanceScore * 1.2);
  
  // WebGL版本得分（1-2分）
  totalScore += webGLVersion;
  
  // WebXR支持得分（0-5分）
  if (isWebXRSupported) {
    totalScore += 2;
    // 异步检测AR WebXR支持，但不影响同步返回结果
    if ('xr' in navigator) {
      (navigator.xr as any).isSessionSupported('immersive-ar').then((supported: boolean) => {
        // 更新缓存中的值，下次调用时生效
        if (devicePerformanceCache) {
          devicePerformanceCache.isARWebXRSupported = supported;
        }
      }).catch(() => {
        // 忽略错误
      });
    }
  }
  
  // AR平台得分（0-3分）
  if (hasARCore || hasARKit) {
    totalScore += 3;
  }
  
  // 设备类型调整（不同设备类型有不同的性能基准）
  if (isDesktop) {
    totalScore += 8; // 提高桌面设备性能基准
  } else if (isTablet) {
    totalScore += 4; // 提高平板设备性能基准
  } else {
    totalScore += 0; // 移动设备保持原有基准
  }
  
  // 浏览器性能扣分（低性能浏览器-3分）
  if (isLowPerformanceBrowser) {
    totalScore -= 3;
  }
  
  // 设备刷新率加分（高刷新率设备+2分）
  if (maxRefreshRate >= 144) {
    totalScore += 3;
  } else if (maxRefreshRate >= 120) {
    totalScore += 2;
  } else if (maxRefreshRate >= 90) {
    totalScore += 1;
  }
  
  // WebGL支持加分（支持WebGL+3分）
  if (hasWebGL) {
    totalScore += 3;
  } else {
    // 不支持WebGL，直接判定为低性能设备
    isLowEndDevice = true;
  }
  
  // 屏幕尺寸和像素密度加分
  const effectiveResolution = screenArea * devicePixelRatio;
  if (effectiveResolution > 2560 * 1440 * 2) {
    totalScore += 3;
  } else if (effectiveResolution > 1920 * 1080 * 2) {
    totalScore += 2;
  } else if (effectiveResolution > 1366 * 768 * 1.5) {
    totalScore += 1;
  }
  
  // 电池状态加分（电量充足且充电中设备+2分）
  if (batteryLevel > 0.75) {
    totalScore += 1;
    if (batteryCharging) {
      totalScore += 1;
    }
  }
  
  // 内存使用率加分（如果支持Performance Memory API）
  if (memoryInfo && memoryInfo.usedJSHeapSize && memoryInfo.totalJSHeapSize) {
    const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
    if (memoryUsageRatio < 0.5) {
      totalScore += 1;
    }
  }
  
  // 针对AR设备的特殊优化：移动设备根据实际性能调整，不再默认降低
  if (!isDesktop && isARSupported) {
    // 仅在实际性能较低时降低得分
    if (totalScore < 25) {
      totalScore -= 2; // 适度降低性能得分，确保稳定的AR体验
    }
  }
  
  // 根据综合得分判断设备性能 - 优化得分区间
  if (!isLowEndDevice) {
    if (totalScore < 22) {
      isLowEndDevice = true;
      isMediumEndDevice = false;
      isHighEndDevice = false;
    } else if (totalScore < 38) {
      isLowEndDevice = false;
      isMediumEndDevice = true;
      isHighEndDevice = false;
    } else {
      isLowEndDevice = false;
      isMediumEndDevice = false;
      isHighEndDevice = true;
    }
  }
  
  // 特殊处理：桌面设备最低性能级别为中等
  if (isDesktop && isLowEndDevice) {
    isLowEndDevice = false;
    isMediumEndDevice = true;
    isHighEndDevice = false;
  }
  
  // 构建结果对象
  const result = {
    isLowEndDevice,
    isMediumEndDevice,
    isHighEndDevice,
    performanceLevel: isLowEndDevice ? 'low' : isMediumEndDevice ? 'medium' : 'high',
    cpuCores,
    deviceMemory,
    webGLVersion,
    gpuPerformanceScore,
    gpuVendor,
    gpuRenderer,
    maxTextureSize,
    maxVertexAttribs,
    shaderPrecision,
    gpuMemoryMB,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    isARSupported,
    isWebXRSupported,
    isARWebXRSupported,
    webXRFeatures,
    hasARCore,
    hasARKit,
    arPlatform,
    supportedARSessionModes,
    isLowPerformanceBrowser,
    hasWebGL,
    maxRefreshRate,
    hasPerformanceAPI,
    hasPerformanceMemory,
    memoryInfo,
    screenWidth,
    screenHeight,
    screenArea,
    devicePixelRatio,
    browserInfo,
    batteryLevel,
    batteryCharging,
    cpuPerformanceScore
  };
  
  // 更新缓存
  devicePerformanceCache = result;
  cacheTimestamp = now;
  
  return result;
};

// AR模式下的模型放置组件 - 增强版，支持真实平面检测
const ARModelPlacer: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  texture: THREE.Texture | null;
  model: THREE.Group | null;
  isPlaced: boolean;
  onPlace: () => void;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  isARMode: boolean;
}> = ({ config, scale, rotation, position, texture, model, isPlaced, onPlace, onPositionChange, isARMode }) => {
  // 使用WebXR hit-test API实现真实平面检测
  const { scene, gl, camera } = useThree();
  const xr = gl.xr;
  
  // 平面检测状态
  const [hitResults, setHitResults] = useState<THREE.Matrix4[]>([]);
  const [hitPose, setHitPose] = useState<THREE.Matrix4 | null>(null);
  const [isPlaneDetected, setIsPlaneDetected] = useState(false);
  
  // 动画状态
  const animationRef = useRef<{
    pulseProgress: number;
    pulseDirection: number;
  }>({
    pulseProgress: 0,
    pulseDirection: 1
  });
  
  // 动画更新 - 进一步优化：模型放置后完全停止动画
  useEffect(() => {
    // 只有在AR模式且模型未放置时才运行动画，模型放置后停止动画以节省性能
    if (!isARMode || isPlaced) return;
    
    let animationId: number;
    let lastUpdateTime = 0;
    const updateInterval = 100; // 进一步降低更新频率到约10fps，减少性能消耗
    
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= updateInterval) {
        // 简化动画计算，减少三角函数使用
        animationRef.current.pulseProgress += animationRef.current.pulseDirection * 0.02;
        if (animationRef.current.pulseProgress > 1 || animationRef.current.pulseProgress < 0) {
          animationRef.current.pulseDirection *= -1;
        }
        lastUpdateTime = timestamp;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isARMode, isPlaced]);
  
  // WebXR hit-test配置
  useEffect(() => {
    if (!isARMode || !xr) return;
    
    let hitTestSource: any = null;
    let hitTestSourceRequested = false;
    let session: any = null;
    let isCleanedUp = false;
    
    // 日志记录函数
    const logSessionEvent = (eventName: string, details?: any) => {
      console.log(`[AR Session] ${eventName}`, details || '');
    };
    
    // 错误处理函数
    const handleSessionError = (error: any, context: string) => {
      console.error(`[AR Session] Error in ${context}:`, error);
      
      // 向用户显示友好的错误提示
      toast.error(`AR会话错误: ${context}`, {
        description: error.message || '请检查设备AR功能是否正常',
        duration: 5000
      });
      
      // 可以在这里添加错误上报逻辑
      // 例如：errorReportingService.report(error, { context, sessionId: session?.id });
    };
    
    // 请求hit-test源
    const requestHitTestSource = async (session: any) => {
      if (isCleanedUp) return;
      
      try {
        if (session.isImmersive && session.visibilityState === 'visible') {
          logSessionEvent('Requesting hit test source');
          
          const viewerSpace = await session.requestReferenceSpace('viewer');
          const source = await session.requestHitTestSource({
            space: viewerSpace,
            offsetRay: new XRRay(new DOMPoint(0, 0, 0), new DOMPoint(0, 0, -1))
          });
          
          if (isCleanedUp) {
            source.cancel();
            return;
          }
          
          hitTestSource = source;
          hitTestSourceRequested = true;
          logSessionEvent('Hit test source acquired successfully');
        }
      } catch (error) {
        handleSessionError(error, 'requestHitTestSource');
        hitTestSourceRequested = false;
      }
    };
    
    // 处理XR会话事件
    const handleSessionStart = (event: any) => {
      if (isCleanedUp) return;
      
      session = event.session;
      logSessionEvent('Session started', { sessionId: session.id, mode: session.mode });
      
      // 请求hit-test源
      requestHitTestSource(session);
      
      // 添加会话事件监听器
      session.addEventListener('end', handleSessionEnd);
      session.addEventListener('visibilitychange', handleSessionVisibilityChange);
      session.addEventListener('inputsourceschange', handleInputsChange);
      session.addEventListener('select', handleSelect);
    };
    
    const handleSessionEnd = () => {
      logSessionEvent('Session ended', { sessionId: session?.id });
      
      // 清理hit-test源
      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
      }
      hitTestSourceRequested = false;
      
      // 清理会话引用
      if (session) {
        session.removeEventListener('end', handleSessionEnd);
        session.removeEventListener('visibilitychange', handleSessionVisibilityChange);
        session.removeEventListener('inputsourceschange', handleInputsChange);
        session.removeEventListener('select', handleSelect);
        session = null;
      }
      
      // 重置状态
      setIsPlaneDetected(false);
      setHitResults([]);
      setHitPose(null);
    };
    
    // 处理会话可见性变化
    const handleSessionVisibilityChange = () => {
      if (!session || isCleanedUp) return;
      
      logSessionEvent('Session visibility changed', { visibility: session.visibilityState });
      
      if (session.visibilityState === 'visible') {
        // 会话变为可见，请求hit-test源
        if (!hitTestSourceRequested) {
          requestHitTestSource(session);
        }
      } else if (session.visibilityState === 'hidden') {
        // 会话变为隐藏，清理hit-test源以节省资源
        if (hitTestSource) {
          hitTestSource.cancel();
          hitTestSource = null;
          hitTestSourceRequested = false;
          logSessionEvent('Hit test source canceled due to hidden visibility');
        }
      }
    };
    
    // 处理输入源变化
    const handleInputsChange = (event: any) => {
      logSessionEvent('Input sources changed', { added: event.added.length, removed: event.removed.length });
    };
    
    // 处理选择事件（如点击、触摸）
    const handleSelect = (event: any) => {
      logSessionEvent('Select event received', { inputSource: event.inputSource });
    };
    
    // 处理frame事件，获取hit-test结果
    const handleFrame = (event: any) => {
      if (!hitTestSource || isCleanedUp) return;
      
      const frame = event.frame;
      const session = frame.session;
      
      session.requestReferenceSpace('local')
        .then((referenceSpace: any) => {
          if (isCleanedUp) return;
          
          // 安全获取hit-test结果
          let hitTestResults;
          try {
            hitTestResults = frame.getHitTestResults(hitTestSource);
          } catch (error) {
            handleSessionError(error, 'frame.getHitTestResults');
            return;
          }
          
          if (hitTestResults.length > 0) {
            setIsPlaneDetected(true);
            
            // 处理所有hit-test结果
            const results: THREE.Matrix4[] = [];
            for (const result of hitTestResults) {
              try {
                const pose = result.getPose(referenceSpace);
                if (pose) {
                  const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
                  results.push(matrix);
                }
              } catch (error) {
                handleSessionError(error, 'result.getPose');
                continue;
              }
            }
            
            setHitResults(results);
            
            // 使用第一个hit-test结果作为放置位置
            if (results.length > 0 && !isPlaced) {
              setHitPose(results[0]);
              
              // 提取位置信息
              try {
                const position = new THREE.Vector3();
                results[0].decompose(position, new THREE.Quaternion(), new THREE.Vector3());
                onPositionChange({
                  x: position.x,
                  y: position.y,
                  z: position.z
                });
              } catch (error) {
                handleSessionError(error, 'matrix.decompose');
              }
            }
          } else {
            setIsPlaneDetected(false);
            setHitResults([]);
            setHitPose(null);
          }
        })
        .catch((error: any) => {
          handleSessionError(error, 'handleFrame');
        });
    };
    
    // 添加事件监听器
    xr.addEventListener('sessionstart', handleSessionStart);
    (xr as any).addEventListener('frame', handleFrame);
    xr.addEventListener('sessionend', handleSessionEnd);
    
    logSessionEvent('Event listeners added');
    
    return () => {
      logSessionEvent('Cleaning up WebXR hit-test resources');
      isCleanedUp = true;
      
      // 移除事件监听器
      xr.removeEventListener('sessionstart', handleSessionStart);
      (xr as any).removeEventListener('frame', handleFrame);
      xr.removeEventListener('sessionend', handleSessionEnd);
      
      // 清理hit-test源
      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
      }
      
      // 清理会话引用
      if (session) {
        session.removeEventListener('end', handleSessionEnd);
        session.removeEventListener('visibilitychange', handleSessionVisibilityChange);
        session.removeEventListener('inputsourceschange', handleInputsChange);
        session.removeEventListener('select', handleSelect);
        session = null;
      }
      
      hitTestSourceRequested = false;
      
      // 重置状态
      setIsPlaneDetected(false);
      setHitResults([]);
      setHitPose(null);
      
      logSessionEvent('Cleanup completed');
    };
  }, [isARMode, xr, isPlaced, onPositionChange]);
  
  // 处理模型放置
  const handlePlaceModel = useCallback(() => {
    onPlace();
  }, [onPlace]);
  
  // 添加点击事件监听器
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas || !isARMode) return;
    
    const handleClick = () => {
      if (!isPlaced && hitPose) {
        handlePlaceModel();
      }
    };
    
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [isPlaced, handlePlaceModel, isARMode, gl, hitPose]);
  
  return (
    <>
      {/* 平面检测可视化 - 仅在检测到平面时显示 */}
      {isPlaneDetected && hitResults.length > 0 && !isPlaced && (
        <>
          {/* 显示部分检测到的平面点，减少渲染数量 */}
          {hitResults.slice(0, Math.min(hitResults.length, 5)).map((result, index) => {
            const position = new THREE.Vector3();
            result.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
            
            return (
              <mesh key={index} position={[position.x, position.y - 0.001, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.08, 8]} />
                <meshBasicMaterial 
                  color="#4f46e5" 
                  transparent 
                  opacity={0.25}
                />
              </mesh>
            );
          })}
          
          {/* 如果有有效的hitPose，显示模型预览和放置指示器 */}
          {hitPose && (
            <>
              {/* 放置点粒子效果 - 简化版本 */}
              <group position={[0, 0, 0]} matrix={hitPose}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const angle = (i / 4) * Math.PI * 2;
                  const radius = 0.25 + 0.05 * Math.sin(animationRef.current.pulseProgress * Math.PI);
                  const x = Math.cos(angle) * radius;
                  const z = Math.sin(angle) * radius;
                  return (
                    <mesh key={i} position={[x, 0, z]}>
                      <sphereGeometry args={[0.015, 6, 6]} />
                      <meshBasicMaterial 
                        color="#4f46e5" 
                        transparent 
                        opacity={0.7 + 0.1 * Math.sin(animationRef.current.pulseProgress * Math.PI + angle)} 
                      />
                    </mesh>
                  );
                })}
              </group>
              
              {/* 2D图像预览 */}
              {texture && (
                <mesh 
                  matrix={hitPose} 
                  scale={[scale * 3, scale * 3, 0.01]} 
                  rotation={[rotation.x, rotation.y, rotation.z]}>
                  <planeGeometry args={[1, 1]} />
                  <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
                  {/* 添加简单的发光边框 */}
                  <mesh 
                    scale={[1.05, 1.05, 1]} 
                    position={[0, 0, -0.01]} 
                  >
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial 
                      color="#4f46e5" 
                      transparent 
                      opacity={0.4} 
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </mesh>
              )}
              
              {/* 3D模型预览 */}
              {config.type === '3d' && model && (
                <primitive 
                  object={model} 
                  matrix={hitPose} 
                  scale={scale} 
                  rotation={[rotation.x, rotation.y, rotation.z]} 
                />
              )}
              
              {/* 放置指示器 - 简化版本 */}
              <group matrix={hitPose}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <sphereGeometry args={[0.03, 6, 6]} />
                  <meshBasicMaterial 
                    color="#4f46e5" 
                    transparent 
                    opacity={0.8 + 0.1 * Math.sin(animationRef.current.pulseProgress * Math.PI * 2)} 
                  />
                </mesh>
              </group>
            </>
          )}
        </>
      )}
      
      {/* 如果未检测到平面，显示引导提示和基本场景 */}
      {isARMode && !isPlaneDetected && !isPlaced && (
        <>
          {/* 添加基本的平面网格，确保场景有可见元素 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial 
              color="#e2e8f0" 
              transparent 
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* 添加简单的网格线，增强空间感 */}
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={24}
                array={new Float32Array([
                  -2.5, 0, -2.5,
                  2.5, 0, -2.5,
                  -2.5, 0, -1.25,
                  2.5, 0, -1.25,
                  -2.5, 0, 0,
                  2.5, 0, 0,
                  -2.5, 0, 1.25,
                  2.5, 0, 1.25,
                  -2.5, 0, 2.5,
                  2.5, 0, 2.5,
                  -2.5, 0, -2.5,
                  -2.5, 0, 2.5,
                  -1.25, 0, -2.5,
                  -1.25, 0, 2.5,
                  0, 0, -2.5,
                  0, 0, 2.5,
                  1.25, 0, -2.5,
                  1.25, 0, 2.5,
                  2.5, 0, -2.5,
                  2.5, 0, 2.5
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#cbd5e1" transparent opacity={0.5} />
          </lineSegments>
          
          {/* 引导提示 */}
          <group position={[0, 0, -2]}>
            {/* 背景平面 */}
            <mesh>
              <planeGeometry args={[2, 0.5]} />
              <meshBasicMaterial 
                color="#4f46e5" 
                transparent 
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* 简单的文本提示 - 使用CanvasTexture创建文本 */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[2, 0.5]} />
              <meshBasicMaterial 
                map={(() => {
                  // 创建一个Canvas来绘制文本
                  const canvas = document.createElement('canvas');
                  canvas.width = 512;
                  canvas.height = 128;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return null;
                  
                  // 设置文本样式
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 48px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  // 绘制文本
                  ctx.fillText('请将设备对准平面以放置模型', canvas.width / 2, canvas.height / 2);
                  
                  // 创建纹理
                  const texture = new THREE.CanvasTexture(canvas);
                  texture.needsUpdate = true;
                  return texture;
                })()}
                transparent
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </>
      )}
      
      {/* 如果模型已放置，显示固定模型 */}
      {isPlaced && (
        <>
          {/* 添加基本的平面网格，确保模型放置后场景有稳定的背景 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position.x, position.y - 0.02, position.z]}>
            <planeGeometry args={[3, 3]} />
            <meshBasicMaterial 
              color="#e2e8f0" 
              transparent 
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* 2D图像 */}
          {config.imageUrl && texture && (
            <mesh 
              scale={[scale * 3, scale * 3, 0.01]} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              position={[position.x, position.y, position.z]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
            </mesh>
          )}
          
          {/* 3D模型 */}
          {config.type === '3d' && model && (
            <primitive 
              object={model} 
              scale={scale} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              position={[position.x, position.y, position.z]} 
            />
          )}
          
          {/* 放置成功指示器 - 简化版本，移除动画效果以减少性能消耗 */}
          <group position={[position.x, position.y - 0.01, position.z]}>
            {/* 中心指示器 - 简化，移除呼吸动画 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshBasicMaterial 
                color="#10b981" 
                transparent 
                opacity={0.9} 
              />
            </mesh>
            
            {/* 环形指示器 - 简化版本 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry 
                args={[0.08, 0.12, 8]} 
              />
              <meshBasicMaterial 
                color="#10b981" 
                transparent 
                opacity={0.4} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </>
      )}
    </>
  );
};

// Canvas内部的3D场景组件，所有R3F钩子必须放在这里
const CanvasContent: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  isARMode: boolean;
  particleEffect: ParticleEffectConfig;
  texture: THREE.Texture | null;
  textureError: boolean;
  model: THREE.Group | null;
  modelLoading: boolean;
  modelError: boolean;
  cameraView: 'perspective' | 'top' | 'front' | 'side';
  isPlaced: boolean;
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  renderSettings?: RenderSettings;
  devicePerformance?: ReturnType<typeof getDevicePerformance>;
}> = ({ config, scale, rotation, position, isARMode, particleEffect, texture, textureError, model, modelLoading, modelError, cameraView, isPlaced, onPositionChange, renderSettings, devicePerformance }) => {
  // 访问相机
  const { camera, gl, scene } = useThree();
  
  // 默认渲染设置
  const defaultRenderSettings: RenderSettings = {
    pixelRatio: 1.0,
    antialias: true, // 保持与Canvas配置一致，默认启用抗锯齿
    shadowMapEnabled: false,
    showAdvancedEffects: false,
    particleCount: 50,
    advancedLighting: false
  };
  
  // 默认设备性能
  const defaultDevicePerformance = {
    isDesktop: false,
    isMobile: true,
    isHighEndDevice: false,
    isMediumEndDevice: false,
    isLowEndDevice: true
  };
  
  // 使用提供的设置或默认值
  const settings = renderSettings || defaultRenderSettings;
  const deviceInfo = devicePerformance || defaultDevicePerformance;
  
  // 根据cameraView切换相机位置 - 基于设备性能调整，添加平滑过渡
  useEffect(() => {
    if (camera) {
      // 桌面设备使用更远的视角，增强3D效果
      const distance = deviceInfo.isDesktop ? 10 : 8;
      
      // 非AR模式下设置相机位置，添加平滑过渡
      if (!isARMode) {
        // 目标位置
        let targetPosition = new THREE.Vector3();
        
        switch (cameraView) {
          case 'perspective':
            targetPosition.set(distance, distance, distance);
            break;
          case 'top':
            targetPosition.set(0, distance, 0);
            break;
          case 'front':
            targetPosition.set(0, 0, distance);
            break;
          case 'side':
            targetPosition.set(distance, 0, 0);
            break;
        }
        
        // 平滑过渡效果
        const startPosition = camera.position.clone();
        const duration = 500; // 过渡时间（毫秒）
        const startTime = Date.now();
        
        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // 使用缓动函数实现平滑过渡
          const easedProgress = 1 - Math.pow(1 - progress, 3); // 缓出效果
          
          // 线性插值计算当前位置
          camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
          
          // 确保相机始终看向原点
          camera.lookAt(0, 0, 0);
          
          // 更新投影矩阵
          camera.updateProjectionMatrix();
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    }
  }, [camera, cameraView, isARMode, deviceInfo.isDesktop]);
  
  // AR模式下的相机抖动补偿
  useEffect(() => {
    if (!camera || !isARMode) return;
    
    // 保存原始投影矩阵
    const originalProjectionMatrix = camera.projectionMatrix.clone();
    
    // 相机位置平滑化参数
    const smoothingFactor = 0.1;
    const previousPosition = new THREE.Vector3();
    const smoothedPosition = camera.position.clone();
    
    // 相机旋转平滑化参数
    const rotationSmoothingFactor = 0.15;
    const previousRotation = new THREE.Euler();
    const smoothedRotation = camera.rotation.clone();
    
    // 防抖函数
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
    
    // 相机更新事件处理函数
    const handleCameraUpdate = debounce(() => {
      // 平滑处理相机位置
      smoothedPosition.lerp(camera.position, smoothingFactor);
      previousPosition.copy(camera.position);
      
      // 平滑处理相机旋转
      (smoothedRotation as any).lerp(camera.rotation, rotationSmoothingFactor);
      previousRotation.copy(camera.rotation);
      
      // 应用平滑后的位置和旋转
      camera.position.copy(smoothedPosition);
      camera.rotation.copy(smoothedRotation);
      
      // 更新投影矩阵
      camera.updateProjectionMatrix();
    }, 16); // 约60fps
    
    // 监听相机更新事件
    (camera as any).addEventListener('update', handleCameraUpdate);
    
    return () => {
      // 移除事件监听器
      (camera as any).removeEventListener('update', handleCameraUpdate);
      
      // 恢复原始投影矩阵
      camera.projectionMatrix.copy(originalProjectionMatrix);
    };
  }, [camera, isARMode]);
  
  // 性能优化：根据设备性能动态调整渲染设置
  useEffect(() => {
    if (gl) {
      // 根据设备性能动态调整渲染设置
      const isHighEndDevice = deviceInfo.isHighEndDevice;
      const isMediumEndDevice = deviceInfo.isMediumEndDevice;
      
      // 阴影映射设置
      gl.shadowMap.enabled = settings.shadowMapEnabled && !isARMode && (isHighEndDevice || isMediumEndDevice);
      gl.shadowMap.type = isARMode ? THREE.BasicShadowMap : 
                        isHighEndDevice ? THREE.PCFSoftShadowMap : 
                        THREE.PCFShadowMap;
      
      // 调整曝光 - 根据设备性能和AR模式调整
      gl.toneMappingExposure = isARMode ? 1.2 : 1.0;
      
      // Three.js会自动管理渲染状态，不需要手动调用WebGL函数
      // 移除了所有无效的直接WebGL调用，保留Three.js原生支持的属性设置
      
      
      // 优化渲染管线 - 移除无效的WebGL直接调用
      // Three.js会自动管理这些状态，不需要手动调用WebGL函数
      
    }
  }, [gl, isARMode, settings, deviceInfo.isHighEndDevice, deviceInfo.isMediumEndDevice, isPlaced]);
  
  // 优化场景设置 - 基于设备性能的动态设置，提升渲染质量
  useEffect(() => {
    if (scene) {
      if (isARMode) {
        // AR模式下简化设置，确保背景透明
        scene.fog = null;
        scene.background = null; // 设置背景为透明，显示真实环境
      } else {
        // 非AR模式下根据设备性能调整
        const isHighEndDevice = deviceInfo.isHighEndDevice;
        const isMediumEndDevice = deviceInfo.isMediumEndDevice;
        
        // 设置背景颜色
        const bgColor = new THREE.Color(config.backgroundColor || '#1a1a2e');
        scene.background = bgColor;
        
        // 根据设备性能调整雾效
        if (isHighEndDevice) {
          // 高端设备使用更丰富的雾效
          scene.fog = new THREE.FogExp2(bgColor, 0.02); // 指数雾，增强3D深度感
        } else if (isMediumEndDevice) {
          // 中端设备使用线性雾
          scene.fog = new THREE.Fog(bgColor, 10, 60);
        } else {
          // 低端设备禁用雾效，提升性能
          scene.fog = null;
        }
        
        // 根据设备性能调整环境光强度
        const ambientLight = scene.children.find(child => child instanceof THREE.AmbientLight) as unknown as THREE.AmbientLight;
        if (ambientLight) {
          ambientLight.intensity = isHighEndDevice ? 1.2 : isMediumEndDevice ? 1.0 : 0.8;
        }
        
        // 根据设备性能调整方向光强度和阴影
        scene.children.forEach(child => {
          if (child instanceof THREE.DirectionalLight) {
            const dirLight = child as THREE.DirectionalLight;
            dirLight.intensity = isHighEndDevice ? 1.5 : isMediumEndDevice ? 1.0 : 0.8;
            
            // 仅在高端设备上启用阴影
            dirLight.castShadow = isHighEndDevice;
            if (isHighEndDevice) {
              // 优化阴影质量
              dirLight.shadow.mapSize.width = 2048;
              dirLight.shadow.mapSize.height = 2048;
              dirLight.shadow.camera.near = 0.5;
              dirLight.shadow.camera.far = 50;
              dirLight.shadow.bias = -0.0001;
            }
          }
        });
      }
    }
  }, [scene, isARMode, config.backgroundColor, deviceInfo.isHighEndDevice, deviceInfo.isMediumEndDevice]);
  
  // 确保AR模式下渲染缓冲区稳定
  useEffect(() => {
    if (gl && isARMode) {
      // 确保AR模式下渲染缓冲区配置正确
      // 设置渲染器属性
      gl.setClearColor(0x000000, 0);
    }
  }, [gl, isARMode]);
  
  return (
    <>
      {/* 优化光照效果，确保性能和视觉效果平衡 */}
      <>
        {/* 环境光，确保整个场景明亮 */}
        <ambientLight 
          intensity={1.0} // 降低环境光强度，减少计算
          color="#ffffff"
        />
        {/* 主方向光，增强模型的立体感 */}
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={1.0} // 降低方向光强度
          color="#ffffff"
          castShadow={false} // 禁用阴影，提升性能
        />
        {/* 辅助方向光，确保模型各个面都有光照 */}
        <directionalLight 
          position={[-10, 5, -10]} 
          intensity={0.5} // 降低侧方向光强度
          color="#ffffff"
          castShadow={false} // 禁用阴影，提升性能
        />
      </>
      
      {/* 轨道控制器 - 根据设备性能调整 */}
      {!isARMode && (
        <OrbitControls 
          enableDamping={false} // 禁用阻尼，减少计算
          dampingFactor={0.1}
          enableZoom={true} 
          zoomSpeed={0.5}
          enablePan={false} // 禁用平移，减少计算
          minDistance={deviceInfo.isDesktop ? 5 : 3}
          maxDistance={deviceInfo.isDesktop ? 30 : 20}
          minPolarAngle= {Math.PI / 6}
          maxPolarAngle= {Math.PI - Math.PI / 6}
          target={[0, 0, 0]}
          enableRotate={true}
          rotateSpeed={0.5}
        />
      )}
      
      {/* 3D预览场景 - 增强视觉效果 */}
      {!isARMode && (
        <>
          {/* 添加背景球体，增强3D空间感 */}
          <mesh position={[0, 0, 0]} scale={50} rotation={[0, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
              color="#f8fafc" 
              side={THREE.BackSide} 
              transparent 
              opacity={1.0}
            />
          </mesh>
          {/* 地面网格 - 增强视觉效果 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial 
              color="#e2e8f0" 
              roughness={0.8}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 添加更完整的网格线 */}
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={12}
                array={new Float32Array([
                  -10, 0, -10,
                  10, 0, -10,
                  -5, 0, -10,
                  5, 0, -10,
                  -10, 0, -5,
                  10, 0, -5,
                  -10, 0, 5,
                  10, 0, 5,
                  -10, 0, 10,
                  10, 0, 10,
                  -10, 0, -10,
                  -10, 0, 10,
                  -5, 0, -10,
                  -5, 0, 10,
                  5, 0, -10,
                  5, 0, 10,
                  10, 0, -10,
                  10, 0, 10
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#cbd5e1" />
          </lineSegments>
        </>
      )}
      
      {/* AR模式和非AR模式的渲染逻辑分离 */}
      {isARMode ? (
        /* AR模式 - 真实平面检测和3D渲染 */
        <ARModelPlacer
          config={config}
          scale={scale}
          rotation={rotation}
          position={position}
          texture={texture}
          model={model}
          isPlaced={isPlaced}
          onPlace={() => toast.success('模型已放置')}
          onPositionChange={onPositionChange || (() => {})}
          isARMode={isARMode}
        />
      ) : (
        /* 非AR模式 - 正常3D渲染 */
        <>
          {/* 默认3D对象 - 当没有图像或模型资源时显示 */}
          {!((config.type === '2d' && config.imageUrl) || (config.type === '3d' && config.modelUrl)) && (
            <mesh
              scale={[10, 10, 0.1]}
              rotation={[0, 0, 0]}
              position={[0, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial 
                color="#4f46e5" 
                transparent 
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          
          {/* 渲染2D图像为3D平面 - 只在2D模式下显示 */}
          {config.type === '2d' && config.imageUrl && texture && !textureError && (
            <group>
              {/* 2D图像主体 */}
              <mesh
                scale={[scale * 3, scale * 3, 0.01]}
                rotation={[rotation.x, rotation.y, rotation.z]}
                position={[position.x, position.y, position.z]}
                castShadow={deviceInfo.isDesktop && settings.shadowMapEnabled} // 仅桌面设备启用阴影投射
              >
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial 
                  map={texture} 
                  transparent 
                  side={THREE.DoubleSide}
                  roughness={0.5}
                  metalness={0.1}
                />
              </mesh>
              
              {/* 图像下方添加阴影平面，增强3D感 */}
              {deviceInfo.isDesktop && (
                <mesh
                  scale={[scale * 3.2, scale * 3.2, 0.001]}
                  rotation={[rotation.x - Math.PI / 2, rotation.y, rotation.z]}
                  position={[position.x, position.y - 0.5, position.z]}
                >
                  <planeGeometry args={[1, 1]} />
                  <meshStandardMaterial 
                    color="#000000" 
                    transparent 
                    opacity={0.3}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
              
              {/* 图像周围的环境光源，增强3D感 */}
              {deviceInfo.isDesktop && (
                <>
                  <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" distance={10} />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" distance={10} />
                </>
              )}
            </group>
          )}
          
          {/* 图像加载错误时的回退显示 - 只在2D模式下显示 */}
          {config.type === '2d' && config.imageUrl && textureError && (
            <mesh
              scale={[scale * 1, scale * 1, 0.01]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              position={[position.x, position.y, position.z]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial 
                color="#ff6b6b" 
                transparent 
                side={THREE.DoubleSide}
                opacity={0.5}
              />
            </mesh>
          )}
          
          {/* 3D模型渲染 */}
          {config.type === '3d' && config.modelUrl && (
            <>
              {/* 模型加载中指示器 */}
              {modelLoading && (
                <mesh
                  scale={scale}
                  rotation={[rotation.x, rotation.y, rotation.z]}
                  position={[position.x, position.y, position.z]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#6b7280" transparent opacity={0.7} />
                </mesh>
              )}
              
              {/* 模型加载错误指示器 */}
              {modelError && (
                <mesh
                  scale={scale}
                  rotation={[rotation.x, rotation.y, rotation.z]}
                  position={[position.x, position.y, position.z]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#ef4444" transparent opacity={0.7} />
                </mesh>
              )}
              
              {/* 模型加载成功时显示 */}
              {model && !modelLoading && !modelError && (
                <group>
                  {/* 模型主体 */}
                  <primitive
                    object={model}
                    scale={scale}
                    rotation={[rotation.x, rotation.y, rotation.z]}
                    position={[position.x, position.y, position.z]}
                    castShadow={deviceInfo.isDesktop && settings.shadowMapEnabled}
                    receiveShadow={deviceInfo.isDesktop && settings.shadowMapEnabled}
                  />
                  
                  {/* 桌面设备添加模型周围的环境光源，增强3D效果 */}
                  {deviceInfo.isDesktop && (
                    <>
                      <pointLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" distance={15} />
                      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#ffffff" distance={15} />
                      <pointLight position={[5, -5, 5]} intensity={0.2} color="#ffffff" distance={15} />
                      <pointLight position={[-5, 5, -5]} intensity={0.2} color="#ffffff" distance={15} />
                    </>
                  )}
                </group>
              )}
            </>
          )}