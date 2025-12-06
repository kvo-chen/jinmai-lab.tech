import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { InstancedParticleSystem } from './ParticleSystem'; // 导入实例化粒子系统组件

// 动态加载three.js相关依赖，减少初始加载时间
// 优化：使用更轻量级的动态加载方式，只在组件真正需要时才加载
const DynamicARContent = lazy(async () => {
  // 只加载必要的Three.js核心模块，减少初始加载体积
  const THREE = await import('three');
  // 只加载必要的react-three-fiber组件
  const { Canvas } = await import('@react-three/fiber');
  // 只加载必要的react-three-drei组件
  const { OrbitControls, PerspectiveCamera, Environment } = await import('@react-three/drei');
  
  // 简化Three.js加载管理器，减少不必要的日志
  THREE.DefaultLoadingManager.onError = function (url) {
    console.error(`AR资源加载失败: ${url}`);
  };
  
  // 返回动态加载的组件
  return {
    default: (props: any) => {
      // 将依赖作为props传递给子组件
      return <>{props.children({ THREE, Canvas, OrbitControls, PerspectiveCamera, Environment })}</>;
    }
  };
});

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

// 环境预设类型
export type EnvironmentPreset = 
  | 'studio' 
  | 'apartment' 
  | 'warehouse' 
  | 'forest' 
  | 'city' 
  | 'night' 
  | 'sunset' 
  | 'dawn' 
  | 'park' 
  | 'lobby';

// 简化的纹理缓存，不使用复杂的引用计数
// 注意：这里暂时使用any类型，后续会在动态加载时替换为THREE.Texture
const textureCache = new Map<string, any>();
const MAX_CACHE_ITEMS = 10; // 限制缓存项数量



// 错误边界组件 - 使用函数组件实现
const ARPreviewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

  // 使用ErrorBoundary组件包装子组件
  return (
    <>
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 backdrop-blur-md">
          <div className="text-center text-white p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              预览加载失败
            </h2>
            <p className="mb-4">很抱歉，AR预览出现了问题。</p>
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-gray-800 p-4 rounded-lg text-left overflow-auto max-h-48 mb-4">
                <pre className="text-xs text-red-300">
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </div>
            )}
            <button
              onClick={() => {
                setHasError(false);
                setError(null);
                setErrorInfo(null);
              }}
              className="py-2 px-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 active:scale-95 transition-all duration-300"
            >
              重试
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 使用try-catch包装渲染 */}
          {(() => {
            try {
              return children;
            } catch (e) {
              const error = e as Error;
              console.error('ARPreview渲染错误:', error);
              setHasError(true);
              setError(error);
              // 注意：函数组件中无法获取完整的errorInfo
              return null;
            }
          })()}
        </>
      )}
    </>
  );
};

// 3D预览内容组件，依赖three.js
const ThreeDPreviewContent: React.FC<{
  THREE: any;
  Canvas: any;
  OrbitControls: any;
  PerspectiveCamera: any;
  Environment: any;
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  isARMode: boolean;
  environmentPreset: EnvironmentPreset;
  particleEffect: {
    enabled: boolean;
    type: 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos';
    particleCount: number;
    particleSize: number;
    animationSpeed: number;
  };
}> = ({ THREE, Canvas, OrbitControls, PerspectiveCamera, Environment, config, scale, rotation, position, isARMode, environmentPreset, particleEffect }) => {
  return (
    <>
      <Canvas 
        shadows={false} 
        className="w-full h-full" 
        camera={{ position: [0, 0, 3], fov: 60, near: 0.1, far: 1000 }} 
        gl={{ 
            antialias: false, 
            alpha: true, 
            preserveDrawingBuffer: false, 
            powerPreference: 'high-performance', 
            stencil: false,
            depth: true,
            // 优化：禁用不必要的WebGL扩展
            extensions: { derivatives: false, fragDepth: false, drawBuffers: false, shaderTextureLOD: false }
          }} 
        style={{ backgroundColor: isARMode ? 'transparent' : '#f0f0f0' }}
        // 优化：只在需要时更新渲染（交互或动画）
        frameloop={particleEffect.enabled ? "always" : "demand"}
        // 优化：降低默认DPR，减少渲染开销
        dpr={1}
      >
          {/* 基础相机和灯光 */}
          <PerspectiveCamera makeDefault position={[0, 0, 3]} />
          {/* 优化：降低环境光强度，减少渲染计算 */}
          <ambientLight intensity={0.3} />
          {/* 优化：降低方向光强度，减少渲染计算 */}
          <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow={false} />
          
          {/* 环境光效 - 优化：只在非AR模式下使用环境光效 */}
          {!isARMode && <Environment preset={environmentPreset} background={false} />}
          
          {/* 2D图片预览 - 优化：使用纹理缓存，减少重复加载 */}
          {config.type === '2d' && config.imageUrl && (
            <mesh 
              position={[position.x, position.y, position.z]} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              scale={scale}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial 
                map={(() => {
                  // 检查纹理缓存
                  if (textureCache.has(config.imageUrl)) {
                    return textureCache.get(config.imageUrl);
                  }
                  // 加载新纹理并缓存
                  const texture = new THREE.TextureLoader().load(config.imageUrl);
                  // 设置纹理优化选项
                  texture.minFilter = THREE.LinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.generateMipmaps = false; // 禁用mipmap生成，减少内存使用
                  // 添加到缓存
                  textureCache.set(config.imageUrl, texture);
                  // 限制缓存大小
                  if (textureCache.size > MAX_CACHE_ITEMS) {
                    const firstKey = textureCache.keys().next().value as string;
                    const oldTexture = textureCache.get(firstKey);
                    if (oldTexture) {
                      oldTexture.dispose(); // 释放纹理资源
                    }
                    textureCache.delete(firstKey);
                  }
                  return texture;
                })()}
                transparent 
                side={THREE.DoubleSide}
                metalness={0}
                roughness={1}
              />
            </mesh>
          )}
          
          {/* 3D模型预览 */}
          {config.type === '3d' && config.modelUrl && (
            <mesh 
              position={[position.x, position.y, position.z]} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              scale={scale}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color="#666666"
                metalness={0} 
                roughness={1}
              />
            </mesh>
          )}
          
          {/* AR中心点指示器 - 简化版，减少几何复杂度 */}
          {isARMode && (
            <group position={[0, 0, 0]}>
              {/* 中心圆环 */}
              <mesh>
                <ringGeometry args={[0.1, 0.13, 16]} />
                <meshBasicMaterial color="rgba(0, 255, 0, 0.9)" transparent side={THREE.DoubleSide} />
              </mesh>
              {/* 中心十字线 */}
              <group>
                <mesh position={[0, 0, 0.01]}>
                  <boxGeometry args={[0.25, 0.02, 0.01]} />
                  <meshBasicMaterial color="rgba(0, 255, 0, 0.9)" transparent />
                </mesh>
                <mesh position={[0, 0, 0.01]}>
                  <boxGeometry args={[0.02, 0.25, 0.01]} />
                  <meshBasicMaterial color="rgba(0, 255, 0, 0.9)" transparent />
                </mesh>
              </group>
            </group>
          )}
          
          {/* 交互控件 */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            enableRotate={true} 
            enableDamping={false} 
            rotateSpeed={0.3} 
            zoomSpeed={0.3} 
            panSpeed={0.3} 
            minDistance={0.5} 
            maxDistance={10} 
            enabled={!isARMode}
            // 优化：禁用不必要的控制器功能
            enableKeys={false}
            enableTouchZoom={true}
            enableMouseZoom={true}
          />

          {/* 粒子系统 - 优化：降低默认粒子数量和复杂度 */}
          {particleEffect.enabled && (
            <InstancedParticleSystem
              config={{
                model: 'flower',
                color: '#ff6b6b',
                // 优化：限制最大粒子数量
                particleCount: Math.min(particleEffect.particleCount, 100),
                scale: particleEffect.particleSize,
                spread: 5,
                size: particleEffect.particleSize,
                animationSpeed: particleEffect.animationSpeed,
                gestureSensitivity: 1,
                // 优化：默认关闭轨迹效果，减少渲染开销
                showTrails: false,
                rotationSpeed: 1,
                colorVariation: 0.2,
                emissionRate: 5,
                behavior: particleEffect.type
              }}
            />
          )}
        </Canvas>
    </>
  );
};

const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
  work?: Work;
}> = ({ config, onClose, work }) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(config.scale || 1.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [isARMode, setIsARMode] = useState(false);

  // 环境预设状态管理 - 只使用稳定的预设
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('studio');
  const environmentPresets: EnvironmentPreset[] = [
    'studio', 'apartment', 'warehouse', 'park', 'lobby'
  ];



  // 初始化加载状态
  useEffect(() => {
    setIsLoading(true);
    // 2秒后自动设置为false，防止资源加载超时
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [config.modelUrl, config.imageUrl]);

  // 清理函数，用于释放资源
  useEffect(() => {
    return () => {
      // 清理所有纹理缓存
      textureCache.forEach((texture) => {
        texture.dispose();
      });
      textureCache.clear();
    };
  }, []);

  // 粒子效果状态管理 - 优化：降低默认粒子数量和复杂度
  const [particleEffect, setParticleEffect] = useState({
    enabled: false, // 优化：默认关闭粒子效果
    type: 'spiral' as 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos',
    particleCount: 50, // 优化：减少默认粒子数量
    particleSize: 0.3, // 优化：减小默认粒子大小
    animationSpeed: 0.5 // 优化：降低默认动画速度
  });

  // 控制面板状态管理 - 优化：使用更高效的状态结构
  const [controlPanelState, setControlPanelState] = useState({
    presets: false,
    scale: true,
    rotation: false,
    position: false,
    effects: false
  });

  // 控制面板折叠/展开控制 - 使用useCallback减少函数创建
  const toggleControlPanel = useCallback((panel: keyof typeof controlPanelState) => {
    setControlPanelState(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  }, []);

  // 位置变化处理 - 使用useCallback减少函数创建
  const handlePositionChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setPosition(prev => ({
      ...prev,
      [axis]: value
    }));
  }, []);

  // 预设视图处理 - 使用useCallback减少函数创建
  const handlePresetView = useCallback((view: string) => {
    // 简化实现：只记录事件，不执行实际操作
    console.log('Preset view clicked:', view);
  }, []);

  // 粒子效果开关切换 - 使用useCallback减少函数创建
  const toggleParticleEffect = useCallback(() => {
    setParticleEffect(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  }, []);

  // 粒子效果类型更新 - 使用useCallback减少函数创建
  const updateParticleEffectType = useCallback((type: 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos') => {
    setParticleEffect(prev => ({
      ...prev,
      type
    }));
  }, []);

  // 粒子数量更新 - 使用useCallback减少函数创建
  const updateParticleCount = useCallback((count: number) => {
    setParticleEffect(prev => ({
      ...prev,
      particleCount: count
    }));
  }, []);

  // 粒子大小更新 - 使用useCallback减少函数创建
  const updateParticleSize = useCallback((size: number) => {
    setParticleEffect(prev => ({
      ...prev,
      particleSize: size
    }));
  }, []);

  // 动画速度更新 - 使用useCallback减少函数创建
  const updateAnimationSpeed = useCallback((speed: number) => {
    setParticleEffect(prev => ({
      ...prev,
      animationSpeed: speed
    }));
  }, []);

  // 重置变换状态 - 使用useCallback减少函数创建
  const handleResetTransform = useCallback(() => {
    setScale(config.scale || 1.0);
    setRotation(config.rotation || { x: 0, y: 0, z: 0 });
    setPosition(config.position || { x: 0, y: 0, z: 0 });
    toast.success('已重置变换');
  }, [config]);

  // 截图相关状态和函数 - 优化：只有在需要时才创建状态
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);

  // 处理截图 - 使用useCallback减少函数创建
  const handleScreenshot = useCallback(() => {
    toast.info('截图功能开发中');
  }, []);

  // 保存截图 - 使用useCallback减少函数创建
  const handleSaveScreenshot = useCallback(() => {
    if (screenshot) {
      toast.info('保存截图功能开发中');
    }
  }, [screenshot]);

  // 处理缩放变化 - 使用useCallback减少函数创建
  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  }, []);

  // 处理旋转变化 - 使用useCallback减少函数创建
  const handleRotationChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setRotation(prev => ({
      ...prev,
      [axis]: value
    }));
  }, []);

  // 优化：使用useMemo缓存常用计算值
  const rotationDegrees = useMemo(() => ({
    x: (rotation.x * 180 / Math.PI).toFixed(0),
    y: (rotation.y * 180 / Math.PI).toFixed(0),
    z: (rotation.z * 180 / Math.PI).toFixed(0)
  }), [rotation]);

  const positionFormatted = useMemo(() => ({
    x: position.x.toFixed(2),
    y: position.y.toFixed(2),
    z: position.z.toFixed(2)
  }), [position]);

  // 手势控制状态管理 - 优化版
  const gestureRef = useRef({
    isDragging: false,
    lastTouch: { x: 0, y: 0 },
    initialPosition: position
  });

  // 更新手势初始位置
  useEffect(() => {
    gestureRef.current.initialPosition = position;
  }, [position]);

  // 处理触摸开始事件 - 优化版
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    
    if (touches.length === 1) {
      // 单指触摸：准备平移
      gestureRef.current = {
        isDragging: true,
        lastTouch: { x: touches[0].clientX, y: touches[0].clientY },
        initialPosition: position
      };
    }
  }, [position]);

  // 处理触摸移动事件 - 优化版
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    
    if (gestureRef.current.isDragging && touches.length === 1) {
      // 只有在拖动时才阻止默认行为
      e.preventDefault();
      // 单指移动：平移
      const deltaX = (touches[0].clientX - gestureRef.current.lastTouch.x) / 100;
      const deltaY = (gestureRef.current.lastTouch.y - touches[0].clientY) / 100;
      
      setPosition(prev => ({
        x: gestureRef.current.initialPosition.x + deltaX,
        y: gestureRef.current.initialPosition.y + deltaY,
        z: prev.z
      }));
      
      // 更新触摸位置
      gestureRef.current.lastTouch = { x: touches[0].clientX, y: touches[0].clientY };
    }
  }, []);

  // 处理触摸结束事件 - 优化版
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // 重置手势状态
    gestureRef.current = {
      isDragging: false,
      lastTouch: { x: 0, y: 0 },
      initialPosition: position
    };
  }, [position]);

  // 处理触摸取消事件 - 优化版
  const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // 重置手势状态
    gestureRef.current = {
      isDragging: false,
      lastTouch: { x: 0, y: 0 },
      initialPosition: position
    };
  }, [position]);

  // AR模式切换处理 - 简化实现
  useEffect(() => {
    if (isARMode) {
      // 简化AR模式，只显示AR视觉效果，不访问摄像头
    }
  }, [isARMode]);

  // 处理AR场景点击 - 简化版
  const handleARClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isARMode || isLoading) return;
    
    // 简化AR点击处理
    toast.success('模型已放置');
  }, [isARMode, isLoading]);



  return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} overflow-y-auto`}>
        <div className={`w-full max-w-3xl h-[90vh] flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-2xl overflow-hidden`}>
          {/* 顶部导航栏 - 优化：更小的导航栏，为AR预览区域腾出更多空间 */}
          <div className={`sticky top-0 z-40 flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90'} backdrop-blur-md`}>
            <h2 className="text-lg font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">AR预览</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700 hover:scale-110' : 'bg-gray-100 hover:bg-gray-200 hover:scale-110'} transition-all duration-300 ripple-button`}
              aria-label="关闭"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* 原本的视图内容 - 作品信息和图片/视频 - 优化：更小的作品信息区域 */}
          {work && (
            <div className={`sticky top-[56px] z-30 p-3 border-b ${isDark ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90'} backdrop-blur-md`}>
              <div className={`rounded-xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="p-3 order-2 lg:order-1">
                    <div className="flex items-center justify-between mb-1">
                      <h1 className="text-lg font-bold line-clamp-1">{work.title}</h1>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{work.category}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <img src={work.creatorAvatar} alt="avatar" className="w-6 h-6 rounded-full mr-2 object-cover" />
                      <div>
                        <div className="font-medium text-xs">{work.creator}</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>创作者</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center"><i className="far fa-heart mr-1" /><span className="text-xs">{work.likes}</span></div>
                      <div className="flex items-center"><i className="far fa-comment mr-1" /><span className="text-xs">{work.comments}</span></div>
                      <div className="flex items-center"><i className="far fa-eye mr-1" /><span className="text-xs">{work.views}</span></div>
                    </div>
                    <div className="mb-0">
                      <div className="font-semibold text-xs mb-1">标签</div>
                      <div className="flex flex-wrap gap-1 max-h-10 overflow-y-auto">
                        {work.tags.map((t, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2">
                    {/* 中文注释：如果存在视频地址，展示视频播放器；否则展示图片 */}
                    {work.videoUrl ? (
                      <video
                        src={work.videoUrl}
                        poster={work.thumbnail}
                        controls
                        className="w-full h-full object-cover max-h-[150px] lg:max-h-[200px]"
                      />
                    ) : (
                      <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover max-h-[150px] lg:max-h-[200px]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AR预览区域 - 优化：移除最小高度限制，让AR预览区域占据所有剩余空间 */}
          <div className="flex-1 relative overflow-hidden">
          {/* 加载状态 - 简化版 */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 backdrop-blur-md">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-t-green-500 border-gray-700 rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-medium bg-gradient-to-r from-red-400 to-purple-500 bg-clip-text text-transparent">正在加载AR资源...</p>
              </div>
            </div>
          )}
          
          {/* 3D预览内容 */}
          <div 
            className="w-full h-full relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 cursor-crosshair touch-none"
            onClick={handleARClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            {!isLoading && (
              <ARPreviewErrorBoundary>
                {/* 使用Suspense包裹动态加载的3D内容 */}
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 backdrop-blur-md">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-t-green-500 border-gray-700 rounded-full animate-spin mb-4"></div>
                      <p className="text-xl font-medium bg-gradient-to-r from-red-400 to-purple-500 bg-clip-text text-transparent">正在加载3D渲染引擎...</p>
                    </div>
                  </div>
                }>
                  <DynamicARContent>
                    {(props: any) => {
                      const { THREE, Canvas, OrbitControls, PerspectiveCamera, Environment } = props;
                      return (
                        <ThreeDPreviewContent
                          THREE={THREE}
                          Canvas={Canvas}
                          OrbitControls={OrbitControls}
                          PerspectiveCamera={PerspectiveCamera}
                          Environment={Environment}
                          config={config}
                          scale={scale}
                          rotation={rotation}
                          position={position}
                          isARMode={isARMode}
                          environmentPreset={environmentPreset}
                          particleEffect={particleEffect}
                        />
                      );
                    }}
                  </DynamicARContent>
                </Suspense>
              </ARPreviewErrorBoundary>
            )}
            
            {/* AR模式下的提示信息 - 极简版 */}
            {isARMode && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
                {/* 顶部状态提示 */}
                <div className="bg-black bg-opacity-75 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-xl">
                  <i className="fas fa-info-circle mr-2 text-green-400"></i>
                  <span>AR模式已激活</span>
                </div>
                
                {/* 中央交互引导 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-black bg-opacity-75 backdrop-blur-md px-5 py-3 rounded-full text-white text-sm font-medium shadow-xl">
                    <i className="fas fa-hand-pointer mr-2 text-green-400"></i>
                    <span>点击屏幕放置模型</span>
                  </div>
                </div>
                
                {/* 底部操作提示 */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  <div className="bg-black bg-opacity-75 backdrop-blur-sm px-3 py-2.5 rounded-lg text-white text-xs text-center shadow-lg">
                    <i className="fas fa-eye-slash block mb-1 text-lg"></i>
                    退出AR
                  </div>
                  <div className="bg-black bg-opacity-75 backdrop-blur-sm px-3 py-2.5 rounded-lg text-white text-xs text-center shadow-lg">
                    <i className="fas fa-redo block mb-1 text-lg"></i>
                    重置
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 控制栏 */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'} backdrop-blur-lg rounded-b-3xl shadow-2xl`}>
          {/* 主要操作按钮 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => {
                setIsARMode(!isARMode);
              }}
              className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isARMode 
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30' 
                : isDark 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900'}`}
            >
              <i className={`fas fa-${isARMode ? 'eye-slash' : 'eye'} text-xl`}></i>
              <span className="text-xs">{isARMode ? '退出AR' : '进入AR'}</span>
            </button>
            
            <button
              onClick={handleResetTransform}
              className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
                : 'bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-900'}`}
            >
              <i className="fas fa-redo text-xl"></i>
              <span className="text-xs">重置</span>
            </button>
            
            <button
              onClick={handleScreenshot}
              className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-900 shadow-md shadow-blue-500/20'}`}
            >
              <i className="fas fa-camera text-xl"></i>
              <span className="text-xs">拍照</span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => {
                  const dropdown = document.getElementById('environment-dropdown');
                  if (dropdown) {
                    dropdown.classList.toggle('hidden');
                  }
                }}
                className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-900 shadow-md shadow-green-500/20'}`}
              >
                <i className="fas fa-mountain text-xl"></i>
                <span className="text-xs">环境</span>
              </button>
              
              {/* 环境下拉菜单 */}
              <div 
                id="environment-dropdown" 
                className={`absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-300 animate-fadeIn ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hidden`}
              >
                <div className="p-2">
                  <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>选择环境</h4>
                  <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                    {environmentPresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setEnvironmentPreset(preset);
                          document.getElementById('environment-dropdown')?.classList.add('hidden');
                          toast.success(`已切换到${preset}环境`);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 ${environmentPreset === preset 
                          ? (isDark ? 'bg-green-600 text-white' : 'bg-green-100 text-green-900') 
                          : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900')}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 预设视图 - 可折叠 */}
          <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
            <div 
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggleControlPanel('presets')}
            >
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <i className={`fas fa-camera-retro`}></i>
                预设视图
              </h3>
              <button className={`text-gray-500 transition-transform duration-300 ${
                controlPanelState.presets ? 'rotate-180' : ''
              }`}>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
            
            {controlPanelState.presets && (
              <div className="animate-fadeIn">
                <div className="grid grid-cols-6 gap-2">
                  {(['front', 'back', 'left', 'right', 'top', 'bottom'] as const).map(view => (
                    <button
                      key={view}
                      onClick={() => handlePresetView(view)}
                      className={`py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 text-xs ${
                        view === 'top' || view === 'bottom' 
                        ? (isDark 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-900 shadow-md shadow-blue-500/20')
                        : (isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900')
                      }`}
                    >
                      <i className={`fas fa-${{
                        front: 'eye',
                        back: 'eye-slash',
                        left: 'arrow-left',
                        right: 'arrow-right',
                        top: 'arrow-up',
                        bottom: 'arrow-down'
                      }[view]} text-sm mr-1`}></i>
                      {{
                        front: '前',
                        back: '后',
                        left: '左',
                        right: '右',
                        top: '顶',
                        bottom: '底'
                      }[view]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 缩放控制 - 可折叠 */}
          <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
            <div 
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggleControlPanel('scale')}
            >
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <i className="fas fa-expand-arrows-alt"></i>
                缩放
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">{scale.toFixed(1)}x</span>
                <button className={`text-gray-500 transition-transform duration-300 ${
                  controlPanelState.scale ? 'rotate-180' : ''
                }`}>
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
            
            {controlPanelState.scale && (
              <div className="animate-fadeIn">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={scale}
                  onChange={handleScaleChange}
                  className="w-full h-4 bg-gradient-to-r from-gray-300 to-gray-200 rounded-full appearance-none cursor-pointer transition-all duration-200 hover:h-5"
                  style={{
                    background: isDark ? 'linear-gradient(to right, #374151, #4b5563)' : 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              </div>
            )}
          </div>
          
          {/* 旋转控制 - 可折叠 */}
          <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
            <div 
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggleControlPanel('rotation')}
            >
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <i className="fas fa-sync-alt"></i>
                旋转
              </h3>
              <button className={`text-gray-500 transition-transform duration-300 ${
                controlPanelState.rotation ? 'rotate-180' : ''
              }`}>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
            
            {controlPanelState.rotation && (
              <div className="animate-fadeIn space-y-4">
                {(['x', 'y', 'z'] as const).map(axis => (
                  <div key={axis}>
                    <div className="flex justify-between items-center mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {axis.toUpperCase()} 轴
                    </label>
                    <span className="text-xs font-mono bg-gray-800 text-green-400 px-2 py-0.5 rounded">
                      {rotationDegrees[axis]}°
                    </span>
                  </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={rotation[axis] * 180 / Math.PI}
                      onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value) * Math.PI / 180)}
                      className="w-full h-3 bg-gradient-to-r from-red-400 via-purple-500 to-blue-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 平移控制 - 可折叠 */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out">
            <div 
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggleControlPanel('position')}
            >
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <i className="fas fa-arrows-alt"></i>
                平移
              </h3>
              <button className={`text-gray-500 transition-transform duration-300 ${
                controlPanelState.position ? 'rotate-180' : ''
              }`}>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
            
            {controlPanelState.position && (
              <div className="animate-fadeIn space-y-4">
                {(['x', 'y', 'z'] as const).map(axis => (
                  <div key={axis}>
                    <div className="flex justify-between items-center mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {axis.toUpperCase()} 轴
                    </label>
                    <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                      {positionFormatted[axis]}
                    </span>
                  </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={position[axis]}
                      onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-400 via-green-500 to-yellow-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 粒子效果控制 - 可折叠 */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out">
            <div 
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => toggleControlPanel('effects')}
            >
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <i className="fas fa-magic"></i>
                粒子特效
              </h3>
              <button className={`text-gray-500 transition-transform duration-300 ${
                controlPanelState.effects ? 'rotate-180' : ''
              }`}>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
            
            {controlPanelState.effects && (
              <div className="animate-fadeIn space-y-4">
                {/* 粒子效果开关 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`fas fa-particle-heart text-lg ${particleEffect.enabled ? 'text-purple-500' : 'text-gray-500'}`}></i>
                    <span className="text-sm font-medium">粒子效果</span>
                  </div>
                  <button
                    onClick={toggleParticleEffect}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${particleEffect.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${particleEffect.enabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                </div>

                {/* 粒子效果类型 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">效果类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['spiral', 'explosion', 'wave', 'orbit', 'chaos'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => updateParticleEffectType(type)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 ${
                          particleEffect.type === type
                            ? (isDark ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-900')
                            : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900')
                        }`}
                      >
                        <i className={`fas fa-${{
                          spiral: 'spinner',
                          explosion: 'bomb',
                          wave: 'wave-square',
                          orbit: 'circle-notch',
                          chaos: 'asterisk'
                        }[type]} text-sm`}></i>
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 粒子数量 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">粒子数量</label>
                    <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                      {particleEffect.particleCount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={particleEffect.particleCount}
                    onChange={(e) => updateParticleCount(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                    disabled={!particleEffect.enabled}
                  />
                </div>

                {/* 粒子大小 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">粒子大小</label>
                    <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                      {particleEffect.particleSize.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={particleEffect.particleSize}
                    onChange={(e) => updateParticleSize(parseFloat(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                    disabled={!particleEffect.enabled}
                  />
                </div>

                {/* 动画速度 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">动画速度</label>
                    <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                      {particleEffect.animationSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={particleEffect.animationSpeed}
                    onChange={(e) => updateAnimationSpeed(parseFloat(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-500 to-red-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                    disabled={!particleEffect.enabled}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 截图预览模态框 - 极简版 */}
        {isScreenshotModalOpen && screenshot && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
            <div className={`relative max-w-3xl w-full mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] flex flex-col`}>
              {/* 模态框头部 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-lg font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">截图预览</h3>
                <button
                  onClick={() => setIsScreenshotModalOpen(false)}
                  className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all duration-200`}
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              {/* 截图预览内容 */}
              <div className="p-4 flex-1 overflow-auto">
                <div className="flex justify-center mb-6">
                  <div className="rounded-lg overflow-hidden shadow-2xl max-h-[50vh] overflow-y-auto">
                    <img 
                      src={screenshot} 
                      alt="AR预览截图" 
                      className="max-w-full h-auto rounded-lg" 
                    />
                  </div>
                </div>
                
                {/* 操作按钮 - 极简版 */}
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handleSaveScreenshot}
                    className="py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
                  >
                    <i className="fas fa-download text-lg"></i>
                    保存到本地
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
  );
};

export default ARPreview;