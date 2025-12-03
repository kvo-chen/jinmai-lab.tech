import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, useProgress, Environment, CameraControls } from '@react-three/drei';
import * as THREE from 'three';

// AR预览配置类型
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
}

// 环境预设类型
type EnvironmentPreset = 'studio' | 'forest' | 'city' | 'night' | 'custom';

// 动画状态类型
type AnimationState = 'playing' | 'paused' | 'stopped';

// 加载进度组件
const LoadingProgress: React.FC = () => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
      <div className="text-center text-white">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
        <p className="text-lg mb-2">正在加载AR资源...</p>
        <div className="w-64 h-2 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-600 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

// 3D模型组件
const ModelPreview: React.FC<{
  url: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  onLoaded?: () => void;
  animationState?: AnimationState;
}> = ({ url, scale, rotation, position, onLoaded, animationState }) => {
  const { scene, animations } = useGLTF(url);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // 初始化动画混合器
  useEffect(() => {
    if (scene && animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      
      // 播放所有动画
      animations.forEach((clip) => {
        mixerRef.current?.clipAction(clip).play();
      });
    }
    
    if (onLoaded) {
      onLoaded();
    }
    
    return () => {
      // 移除动画混合器的引用，让垃圾回收处理
      mixerRef.current = null;
    };
  }, [scene, animations, onLoaded]);
  
  // 更新动画
  useFrame((state, delta) => {
    if (mixerRef.current) {
      if (animationState === 'playing') {
        mixerRef.current.update(delta);
      }
    }
  });
  
  return (
    <primitive
      object={scene}
      scale={scale}
      rotation={[rotation.x, rotation.y, rotation.z]}
      position={[position.x, position.y, position.z]}
    />
  );
};

// 2D图片组件
const ImagePreview: React.FC<{
  url: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}> = ({ url, scale, rotation, position }) => {
  const textureRef = React.useRef<THREE.Texture | null>(null);
  
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (texture: THREE.Texture) => {
      textureRef.current = texture;
    });
    
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [url]);
  
  return (
    <mesh 
      position={[position.x, position.y, position.z]} 
      rotation={[rotation.x, rotation.y, rotation.z]} 
      scale={scale}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent side={THREE.DoubleSide} map={textureRef.current} />
    </mesh>
  );
};

type ViewMode = 'perspective' | 'top' | 'front' | 'side';

const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  const { isDark } = useTheme();
  const [isARMode, setIsARMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(config.scale || 1.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [modelPlaced, setModelPlaced] = useState(false);
  const [hitPosition, setHitPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [cameraRef, setCameraRef] = useState<THREE.PerspectiveCamera | null>(null);
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('studio');
  const [animationState, setAnimationState] = useState<AnimationState>('playing');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);

  // 加载资源
  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        // 模拟资源加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        toast.error('AR资源加载失败，请重试');
        setIsLoading(false);
      }
    };

    loadResources();
  }, [config]);
  
  // 自动旋转模型
  useFrame((state, delta) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5;
    }
  });
  
  // 切换动画状态
  const toggleAnimation = () => {
    if (animationState === 'playing') {
      setAnimationState('paused');
      toast.info('动画已暂停');
    } else {
      setAnimationState('playing');
      toast.info('动画已播放');
    }
  };
  
  // 切换自动旋转
  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    toast.info(autoRotate ? '自动旋转已关闭' : '自动旋转已开启');
  };
  
  // 切换统计信息显示
  const toggleStats = () => {
    setShowStats(!showStats);
    toast.info(showStats ? '统计信息已关闭' : '统计信息已开启');
  };
  
  // 切换环境预设
  const changeEnvironment = (preset: EnvironmentPreset) => {
    setEnvironmentPreset(preset);
    toast.info(`环境已切换到${preset}`);
  };

  // 切换AR模式
  const toggleARMode = () => {
    setIsARMode(!isARMode);
    if (!isARMode) {
      toast.info('已进入AR模式，将设备对准平面查看效果');
      setModelPlaced(false);
      setHitPosition(null);
    }
  };

  // 点击放置模型
  const handlePlaceModel = () => {
    if (hitPosition) {
      setPosition(hitPosition);
      setModelPlaced(true);
      toast.success('模型已放置');
    } else {
      // 随机生成一个位置
      const randomPosition = {
        x: (Math.random() - 0.5) * 2,
        y: 0,
        z: (Math.random() - 0.5) * 2
      };
      setPosition(randomPosition);
      setModelPlaced(true);
      toast.success('模型已放置');
    }
  };

  // 模拟平面检测和点击检测
  const handleCanvasClick = () => {
    if (isARMode && !modelPlaced) {
      handlePlaceModel();
    }
  };

  // 切换视图模式
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // 这里可以添加相机位置的更新逻辑
    toast.info(`已切换到${mode}视图`);
  };

  // 重置模型位置
  const resetPosition = () => {
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(config.scale || 1.0);
    toast.success('模型位置已重置');
  };

  // 缩放控制
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };

  // AR拍照功能
  const handleARPhoto = () => {
    // 获取Canvas元素
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      toast.error('无法获取Canvas元素，拍照失败');
      return;
    }
    
    try {
      // 从Canvas获取图像数据
      const dataURL = canvas.toDataURL('image/png');
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `ar-preview-${Date.now()}.png`;
      
      // 模拟点击下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('AR照片已保存到本地');
    } catch (error) {
      console.error('AR拍照失败:', error);
      toast.error('AR拍照失败，请重试');
    }
  };

  const [showARGuide, setShowARGuide] = useState(false);

  // 切换AR模式时显示引导
  useEffect(() => {
    if (isARMode && !localStorage.getItem('arGuideShown')) {
      setShowARGuide(true);
      localStorage.setItem('arGuideShown', 'true');
    }
  }, [isARMode]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* 顶部导航栏 */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold">AR预览</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          aria-label="关闭"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* AR预览区域 */}
      <div ref={arContainerRef} className="flex-1 relative overflow-hidden">
        {/* 加载进度组件 - 放在Canvas外部 */}
        {isLoading && <LoadingProgress />}
        
        {/* AR模式提示按钮 - 放在Canvas外部 */}
        {isARMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer z-10">
            进入AR模式
          </div>
        )}
        
        <div className="w-full h-full" onClick={handleCanvasClick}>
          <Canvas 
            shadows 
            ref={(canvas) => {
              if (canvas) {
                canvasRef.current = canvas;
              }
            }}
          >
            {!isARMode ? (
              <>
                <PerspectiveCamera makeDefault position={[0, 0, 3]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                
                {/* 网格辅助线 */}
                <gridHelper args={[10, 10, '#888888', '#444444']} />
                
                {/* 坐标系辅助线 */}
                <axesHelper args={[2]} />
                
                {/* 环境预设 */}
                <Environment
                  preset={environmentPreset === 'studio' ? 'studio' : 
                         environmentPreset === 'forest' ? 'forest' :
                         environmentPreset === 'city' ? 'city' :
                         environmentPreset === 'night' ? 'night' : 'studio'}
                  background
                />
                
                {config.type === '3d' && config.modelUrl ? (
                  <>
                    <ModelPreview
                      url={config.modelUrl}
                      scale={scale}
                      rotation={rotation}
                      position={position}
                      onLoaded={() => setIsLoading(false)}
                      animationState={animationState}
                    />
                    {/* 模型中心点指示器 */}
                    <mesh position={[position.x, position.y, position.z]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    {/* 模型选中效果 */}
                    <mesh position={[position.x, position.y, position.z]} scale={scale * 1.05}>
                      <planeGeometry args={[1, 1]} />
                      <meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.5} side={THREE.DoubleSide} />
                    </mesh>
                  </>
                ) : config.type === '2d' && config.imageUrl ? (
                  <>
                    <ImagePreview
                      url={config.imageUrl}
                      scale={scale}
                      rotation={rotation}
                      position={position}
                    />
                    {/* 模型中心点指示器 */}
                    <mesh position={[position.x, position.y, position.z]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                  </>
                ) : (
                  <>
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[1, 1, 1]} />
                      <meshStandardMaterial color="#ff6b6b" />
                    </mesh>
                    {/* 模型中心点指示器 */}
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    {/* 模型选中效果 */}
                    <mesh position={[0, 0, 0]} scale={1.05}>
                      <boxGeometry args={[1, 1, 1]} />
                      <meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.5} />
                    </mesh>
                  </>
                )}
                
                <OrbitControls 
                  enableZoom 
                  enablePan 
                  enableRotate 
                  dampingFactor={0.05} 
                  enableDamping={true} 
                  rotateSpeed={0.5} 
                  zoomSpeed={0.5} 
                  panSpeed={0.5} 
                  minDistance={0.5} 
                  maxDistance={10} 
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI} 
                />
              </>
            ) : (
              <>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                
                {/* 环境预设 */}
                <Environment
                  preset={environmentPreset === 'studio' ? 'studio' : 
                         environmentPreset === 'forest' ? 'forest' :
                         environmentPreset === 'city' ? 'city' :
                         environmentPreset === 'night' ? 'night' : 'studio'}
                  background
                />
                
                {/* 模型放置指示器 */}
                {isARMode && !modelPlaced && (
                  <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                    <ringGeometry args={[0.3, 0.4, 32]} />
                    <meshBasicMaterial color="#ff6b6b" transparent opacity={0.7} side={THREE.DoubleSide} />
                    <mesh position={[0, 0.01, 0]}>
                      <boxGeometry args={[0.05, 0.05, 0.05]} />
                      <meshBasicMaterial color="#ff6b6b" />
                    </mesh>
                  </mesh>
                )}
                
                {config.type === '3d' && config.modelUrl ? (
                  <>
                    <ModelPreview
                      url={config.modelUrl}
                      scale={modelPlaced ? scale : 0}
                      rotation={rotation}
                      position={position}
                      onLoaded={() => setIsLoading(false)}
                      animationState={animationState}
                    />
                    {/* 模型中心点指示器 */}
                    <mesh position={[position.x, position.y, position.z]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    {/* 模型选中效果 */}
                    {modelPlaced && (
                      <mesh position={[position.x, position.y, position.z]} scale={scale * 1.05}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.5} />
                      </mesh>
                    )}
                  </>
                ) : config.type === '2d' && config.imageUrl ? (
                  <>
                    <ImagePreview
                      url={config.imageUrl}
                      scale={modelPlaced ? scale : 0}
                      rotation={rotation}
                      position={position}
                    />
                    {/* 模型中心点指示器 */}
                    <mesh position={[position.x, position.y, position.z]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    {/* 模型选中效果 */}
                    {modelPlaced && (
                      <mesh position={[position.x, position.y, position.z]} scale={scale * 1.05}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.5} side={THREE.DoubleSide} />
                      </mesh>
                    )}
                  </>
                ) : (
                  <>
                    <mesh position={[0, 0, 0]} scale={modelPlaced ? 1 : 0}>
                      <boxGeometry args={[0.5, 0.5, 0.5]} />
                      <meshStandardMaterial color="#ff6b6b" />
                    </mesh>
                    {/* 模型中心点指示器 */}
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[0.05, 16, 16]} />
                      <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    {/* 模型选中效果 */}
                    {modelPlaced && (
                      <mesh position={[0, 0, 0]} scale={modelPlaced ? 1.05 : 0}>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.5} />
                      </mesh>
                    )}
                  </>
                )}
                
                {/* AR模式下的OrbitControls */}
                <OrbitControls 
                  enableZoom 
                  enablePan 
                  enableRotate 
                  dampingFactor={0.05} 
                  enableDamping={true} 
                  rotateSpeed={0.5} 
                  zoomSpeed={0.5} 
                  panSpeed={0.5} 
                  minDistance={0.5} 
                  maxDistance={10} 
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI} 
                />
              </>
            )}
          </Canvas>
        </div>
      </div>
      
      {/* AR引导提示 */}
      {showARGuide && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold mb-2 text-lg">AR操作引导</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <i className="fas fa-hand-pointer text-red-600 mt-1"></i>
              <span>点击屏幕放置模型</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-expand-arrows-alt text-red-600 mt-1"></i>
              <span>双指缩放调整模型大小</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-sync-alt text-red-600 mt-1"></i>
              <span>单指拖动调整模型位置</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-camera text-red-600 mt-1"></i>
              <span>点击拍照按钮保存AR场景</span>
            </li>
          </ul>
          <button 
            onClick={() => setShowARGuide(false)}
            className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            我知道了
          </button>
        </div>
      )}

      {/* 控制栏 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <button
            onClick={toggleARMode}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isARMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className={`fas fa-${isARMode ? 'eye-slash' : 'eye'}`}></i>
            {isARMode ? '退出AR' : '进入AR'}
          </button>
          
          <button
            onClick={resetPosition}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-redo"></i>
            重置
          </button>
          
          <button
            onClick={handleARPhoto}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-camera"></i>
            拍照
          </button>
        </div>
        
        {/* 动画和旋转控制 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <button
            onClick={toggleAnimation}
            className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${animationState === 'playing' 
              ? 'bg-red-600 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className={`fas fa-${animationState === 'playing' ? 'pause' : 'play'}`}></i>
            {animationState === 'playing' ? '暂停' : '播放'}
          </button>
          
          <button
            onClick={toggleAutoRotate}
            className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${autoRotate 
              ? 'bg-red-600 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-sync-alt"></i>
            自动旋转
          </button>
          
          <button
            onClick={toggleStats}
            className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${showStats 
              ? 'bg-red-600 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-chart-bar"></i>
            统计信息
          </button>
        </div>
        
        {/* 环境预设选择 */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">环境预设</div>
          <div className="flex gap-2 flex-wrap">
            {(['studio', 'forest', 'city', 'night'] as EnvironmentPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => changeEnvironment(preset)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${environmentPreset === preset 
                  ? 'bg-red-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        
        {/* 视图模式切换（仅在非AR模式下显示） */}
        {!isARMode && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">视图模式</div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleViewModeChange('perspective')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${viewMode === 'perspective' 
                  ? 'bg-red-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                透视图
              </button>
              <button
                onClick={() => handleViewModeChange('top')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${viewMode === 'top' 
                  ? 'bg-red-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                顶视图
              </button>
              <button
                onClick={() => handleViewModeChange('front')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${viewMode === 'front' 
                  ? 'bg-red-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                前视图
              </button>
              <button
                onClick={() => handleViewModeChange('side')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${viewMode === 'side' 
                  ? 'bg-red-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                侧视图
              </button>
            </div>
          </div>
        )}
        
        {/* 缩放控制 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">缩放</label>
            <span className="text-sm">{scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale}
            onChange={handleScaleChange}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
        
        {/* AR提示信息 */}
        <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <p className="font-medium mb-1">{isARMode ? 'AR模式提示' : '预览模式提示'}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {isARMode ? (
                  <>
                    <li>确保设备支持WebXR AR功能</li>
                    <li>在明亮环境中使用效果更佳</li>
                    <li>将设备对准平面（如桌面、地面）</li>
                    <li>点击屏幕放置模型</li>
                    <li>双指缩放调整大小</li>
                    <li>单指拖动调整位置</li>
                  </>
                ) : (
                  <>
                    <li>使用鼠标拖拽旋转模型</li>
                    <li>滚轮缩放模型</li>
                    <li>右键拖拽平移视图</li>
                    <li>切换不同视图模式查看模型</li>
                    <li>点击拍照按钮保存模型截图</li>
                    <li>使用环境预设改变模型显示效果</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPreview;
