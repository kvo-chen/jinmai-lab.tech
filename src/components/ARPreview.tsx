/**
 * ARPreview 组件 - 增强现实预览功能组件
 * 
 * 提供AR功能的预览界面，支持移动端和桌面端适配，
 * 显示设备AR支持情况，并提供友好的用户体验。
 * 
 * @component
 * @example
 * ```tsx
 * <ARPreview 
 *   config={{ type: '3d', modelUrl: 'https://example.com/model.glb' }}
 *   onARModeChange={(isARMode) => console.log('AR Mode:', isARMode)}
 * />
 * ```
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

/**
 * AR预览配置类型
 * 
 * @interface
 * @property {string} [modelUrl] - 3D模型URL
 * @property {string} [imageUrl] - 2D图像URL
 * @property {number} [scale] - 缩放比例
 * @property {Object} [rotation] - 旋转角度
 * @property {number} rotation.x - X轴旋转角度
 * @property {number} rotation.y - Y轴旋转角度
 * @property {number} rotation.z - Z轴旋转角度
 * @property {Object} [position] - 位置坐标
 * @property {number} position.x - X轴位置
 * @property {number} position.y - Y轴位置
 * @property {number} position.z - Z轴位置
 * @property {'3d' | '2d'} type - 内容类型
 * @property {boolean} [animations] - 是否启用动画
 * @property {boolean} [shadows] - 是否启用阴影
 * @property {string} [background] - 背景颜色
 * @property {Object} [lighting] - 光照设置
 * @property {number} [lighting.ambientIntensity] - 环境光强度
 * @property {number} [lighting.directionalIntensity] - 方向光强度
 * @property {Object} [lighting.directionalPosition] - 方向光位置
 * @property {number} lighting.directionalPosition.x - 方向光X轴位置
 * @property {number} lighting.directionalPosition.y - 方向光Y轴位置
 * @property {number} lighting.directionalPosition.z - 方向光Z轴位置
 * @property {Object} [scene] - 场景设置
 * @property {string} [scene.backgroundColor] - 场景背景颜色
 * @property {boolean} [scene.gridHelper] - 是否显示网格辅助线
 * @property {boolean} [scene.axesHelper] - 是否显示坐标轴辅助线
 * @property {boolean} [scene.fog] - 是否启用雾化效果
 */
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
  shadows?: boolean;
  background?: string;
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
    directionalPosition?: { x: number; y: number; z: number };
  };
  scene?: {
    backgroundColor?: string;
    gridHelper?: boolean;
    axesHelper?: boolean;
    fog?: boolean;
  };
}

/**
 * 粒子效果配置类型
 * 
 * @interface
 * @property {boolean} enabled - 是否启用粒子效果
 * @property {'fire' | 'smoke' | 'snow' | 'rain' | 'sparkle'} type - 粒子效果类型
 * @property {number} intensity - 粒子强度
 * @property {string} color - 粒子颜色
 * @property {number} size - 粒子大小
 */
export interface ParticleEffectConfig {
  enabled: boolean;
  type: 'fire' | 'smoke' | 'snow' | 'rain' | 'sparkle';
  intensity: number;
  color: string;
  size: number;
}

/**
 * 设备性能类型
 * 
 * @interface
 * @property {number} fps - 帧率
 * @property {number} memory - 内存使用量
 * @property {'mobile' | 'desktop' | 'tablet'} deviceType - 设备类型
 * @property {string} browser - 浏览器名称
 * @property {boolean} isWebXRCompatible - 是否支持WebXR
 */
export interface DevicePerformance {
  fps: number;
  memory: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  isWebXRCompatible: boolean;
}

/**
 * 渲染设置类型
 * 
 * @interface
 * @property {boolean} shadows - 是否启用阴影
 * @property {boolean} antialias - 是否启用抗锯齿
 * @property {number} pixelRatio - 像素比
 * @property {any} toneMapping - 色调映射
 * @property {number} toneMappingExposure - 色调映射曝光度
 */
export interface RenderSettings {
  shadows: boolean;
  antialias: boolean;
  pixelRatio: number;
  toneMapping: any;
  toneMappingExposure: number;
}

/**
 * AR预览组件属性
 * 
 * @interface
 * @property {ARPreviewConfig} config - AR预览配置
 * @property {number} [scale=1] - 缩放比例
 * @property {Object} [rotation={x: 0, y: 0, z: 0}] - 旋转角度
 * @property {number} rotation.x - X轴旋转角度
 * @property {number} rotation.y - Y轴旋转角度
 * @property {number} rotation.z - Z轴旋转角度
 * @property {Object} [position={x: 0, y: 0, z: 0}] - 位置坐标
 * @property {number} position.x - X轴位置
 * @property {number} position.y - Y轴位置
 * @property {number} position.z - Z轴位置
 * @property {ParticleEffectConfig} [particleEffect] - 粒子效果配置
 * @property {RenderSettings} [renderSettings] - 渲染设置
 * @property {DevicePerformance} [devicePerformance] - 设备性能信息
 * @property {(isARMode: boolean) => void} [onARModeChange] - AR模式切换回调
 */
interface ARPreviewProps {
  config: ARPreviewConfig;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  particleEffect?: ParticleEffectConfig;
  renderSettings?: RenderSettings;
  devicePerformance?: DevicePerformance;
  onARModeChange?: (isARMode: boolean) => void;
}

/**
 * AR预览组件 - 增强型，提供更好的用户体验
 * 
 * @component
 * @param {ARPreviewProps} props - 组件属性
 * @returns {React.ReactElement} AR预览组件
 * 
 * @description
 * 该组件提供AR预览功能，支持移动端和桌面端适配，显示设备AR支持情况，并提供友好的用户体验。
 * 当AR功能不可用时，显示提示信息和动画效果，增强用户体验。
 * 
 * @example
 * ```tsx
 * <ARPreview 
 *   config={{ type: '3d', modelUrl: 'https://example.com/model.glb' }}
 *   onARModeChange={(isARMode) => console.log('AR Mode:', isARMode)}
 * />
 * ```
 */
const ARPreview: React.FC<ARPreviewProps> = ({ 
  config, 
  scale = 1, 
  rotation = { x: 0, y: 0, z: 0 }, 
  position = { x: 0, y: 0, z: 0 }, 
  particleEffect = { enabled: false, type: 'sparkle', intensity: 0.5, color: '#ffffff', size: 1 },
  renderSettings: customRenderSettings,
  devicePerformance = { fps: 60, memory: 0, deviceType: 'desktop', browser: 'unknown', isWebXRCompatible: false },
  onARModeChange
}) => {
  const { isDark } = useTheme();
  const [isARMode, setIsARMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 确保只在客户端访问window.devicePixelRatio
  const getDefaultRenderSettings = () => {
    if (typeof window === 'undefined') {
      return { shadows: false, antialias: true, pixelRatio: 1, toneMapping: 0, toneMappingExposure: 1.0 };
    }
    return { shadows: false, antialias: true, pixelRatio: window.devicePixelRatio, toneMapping: 0, toneMappingExposure: 1.0 };
  };
  
  // 合并默认渲染设置和自定义渲染设置
  const effectiveRenderSettings = {
    ...getDefaultRenderSettings(),
    ...customRenderSettings
  };
  
  // 处理AR模式切换
  const handleARModeToggle = () => {
    const newARMode = !isARMode;
    setIsARMode(newARMode);
    onARModeChange?.(newARMode);
  };
  
  // 增强型实现，提供更好的用户体验
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 设备信息条 */}
      <div className={`px-4 py-2 text-xs font-medium ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <i className={`fas fa-mobile-alt ${isMobile ? 'text-green-500' : 'text-gray-500'}`}></i>
            <span>{isMobile ? '移动端' : '桌面端'}设备</span>
          </span>
          <span className="flex items-center gap-1">
            <i className={`fas fa-vr-cardboard ${devicePerformance.isWebXRCompatible ? 'text-blue-500' : 'text-gray-500'}`}></i>
            <span>{devicePerformance.isWebXRCompatible ? '支持AR' : '不支持AR'}</span>
          </span>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] p-4 text-center">
        {/* AR图标动画 */}
        <motion.div 
          className="mb-4 text-6xl text-gray-400"
          animate={{
            scale: [1, 1.1, 1],
            rotateY: [0, 360],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <i className="fas fa-vr-cardboard"></i>
        </motion.div>
        
        {/* 标题和描述 */}
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AR预览功能
        </h3>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-sm`}>
          体验增强现实技术，将虚拟内容与现实世界融合，创造沉浸式交互体验
        </p>
        
        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-xs">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-2xl mb-1 text-blue-500">
              <i className="fas fa-camera"></i>
            </div>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>实时预览</p>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-2xl mb-1 text-purple-500">
              <i className="fas fa-palette"></i>
            </div>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>创意编辑</p>
          </div>
        </div>
        
        {/* 提示信息 */}
        <div className={`p-3 rounded-lg mb-4 text-sm w-full max-w-xs ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
          <i className="fas fa-info-circle mr-1"></i>
          AR预览功能正在开发中，敬请期待
        </div>
        
        {/* 操作按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleARModeToggle}
          className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg hover:shadow-xl`}
        >
          <i className={`fas ${isARMode ? 'fa-times' : 'fa-play'}`}></i>
          <span>{isARMode ? '退出AR模式' : '进入AR模式'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ARPreview;