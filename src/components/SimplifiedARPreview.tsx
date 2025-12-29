import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 简化的AR预览配置类型 - 兼容原ARPreviewConfig类型
export interface SimplifiedARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  type: '3d' | '2d';
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  animations?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

// 3D模型加载组件
const ModelViewer: React.FC<{
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}> = ({ url, onLoad, onError, position, rotation, scale }) => {
  let scene;
  
  try {
    scene = useGLTF(url).scene;
  } catch (error) {
    console.error('3D模型加载错误:', error);
    if (onError && error instanceof Error) {
      onError(error);
    }
    // 返回一个简单的错误占位符，而不是null，提供更好的用户体验
    return (
      <mesh position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ef4444" opacity={0.7} transparent />
      </mesh>
    );
  }
  
  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

// 简化的AR预览组件
const SimplifiedARPreview: React.FC<{
  config: SimplifiedARPreviewConfig;
  onClose: () => void;
  work?: any;
}> = ({ config, onClose, work }) => {
  // AR模式状态
  const [isARMode, setIsARMode] = useState(false);
  
  // 资源加载状态
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // 兼容性状态
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  
  // 交互控制状态
  const [scale, setScale] = useState(config.scale || 5.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  
  // 引用
  const modalRef = useRef<HTMLDivElement>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);

  // 检查AR支持和浏览器兼容性
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // 检查WebXR AR会话支持
        const xrSupported = await navigator.xr?.isSessionSupported('immersive-ar') || false;
        
        // 检查其他必要条件
        const canvasSupported = typeof HTMLCanvasElement !== 'undefined';
        const webGLSupported = typeof WebGLRenderingContext !== 'undefined';
        
        // 检测浏览器类型和版本
        const userAgent = navigator.userAgent;
        let browserInfo = {
          name: 'Unknown',
          version: 'Unknown'
        };
        
        if (/Chrome/.test(userAgent)) {
          browserInfo = {
            name: 'Chrome',
            version: userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Firefox/.test(userAgent)) {
          browserInfo = {
            name: 'Firefox',
            version: userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
          browserInfo = {
            name: 'Safari',
            version: userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Edge/.test(userAgent)) {
          browserInfo = {
            name: 'Edge',
            version: userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        }
        
        console.log('AR Support Check:', {
          xrSupported,
          canvasSupported,
          webGLSupported,
          browser: browserInfo
        });
        
        // 设置AR支持状态
        setIsSupported(xrSupported && canvasSupported && webGLSupported);
      } catch (err) {
        console.warn('AR support check failed:', err);
        setIsSupported(false);
      }
    };

    checkARSupport();
  }, []);

  // 加载资源的函数，包含进度反馈和错误处理
  const loadResource = useCallback(async () => {
    console.log('AR Preview - loadResource called with config:', config);
    
    if (config.type === '3d' && !config.modelUrl) {
      setLoading(false);
      return;
    }
    if (config.type === '2d' && !config.imageUrl) {
      setLoading(false);
      return;
    }

    // 验证imageUrl是否有效
    const isValidImageUrl = (url: string) => {
      try {
        new URL(url);
        // 允许使用https协议的图片URL，不限制特定域名
        return url.startsWith('https://');
      } catch {
        return false;
      }
    };

    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setTexture(null);
      setModelLoaded(false);

      if (config.type === '2d' && config.imageUrl) {
        // 验证imageUrl是否有效
        const imageUrlToUse = isValidImageUrl(config.imageUrl) 
          ? config.imageUrl 
          : 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80';
        
        if (imageUrlToUse !== config.imageUrl) {
          console.warn('AR Preview - Invalid image URL, using fallback:', config.imageUrl);
        }

        const loader = new THREE.TextureLoader();
        textureLoaderRef.current = loader;

        await new Promise<void>((resolve, reject) => {
          try {
            loader.load(
              imageUrlToUse,
              (loadedTexture) => {
                console.log('AR Preview - Texture loaded successfully:', loadedTexture);
                setTexture(loadedTexture);
                setLoadingProgress(100);
                resolve();
              },
              (progressEvent) => {
                // 更新加载进度
                if (progressEvent.lengthComputable) {
                  const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                  setLoadingProgress(progress);
                } else {
                  // 无法计算进度时，使用模拟进度
                  setLoadingProgress(prev => Math.min(prev + 10, 90));
                }
              },
              (error) => {
                console.error('AR Preview - Error loading texture:', error);
                reject(new Error('图像资源加载失败，请重试'));
              }
            );
          } catch (innerErr) {
            console.error('AR Preview - Unexpected error in texture loader:', innerErr);
            reject(new Error('图像加载过程中发生错误，请重试'));
          }
        });
      } else if (config.type === '3d') {
        // 3D模型加载使用useGLTF，通过状态管理
        setLoadingProgress(50);
        // 模型加载完成由ModelViewer组件的onLoad回调处理
      }

      setLoading(false);
    } catch (err) {
      console.error('AR Preview - Resource loading failed:', err);
      setError(err instanceof Error ? err.message : '资源加载失败，请重试');
      setLoading(false);
    }
  }, [config.imageUrl, config.modelUrl, config.type]);

  // 重试加载资源
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      // 重置状态
      setError(null);
      setLoading(true);
      setLoadingProgress(0);
      setTexture(null);
      setModelLoaded(false);
    }
  }, [retryCount, maxRetries]);

  // 加载资源的useEffect
  useEffect(() => {
    loadResource();

    // 清理函数
      return () => {
        // 清理纹理资源 - 确保dispose方法存在
        if (texture && typeof texture.dispose === 'function') {
          texture.dispose();
        }
        // 注意：THREE.TextureLoader没有cancel方法，所以移除这个调用
        // if (textureLoaderRef.current) {
        //   textureLoaderRef.current.cancel();
        // }
      };
  }, [loadResource, texture]);

  // 监听重试计数变化，重新加载
  useEffect(() => {
    if (retryCount > 0) {
      loadResource();
    }
  }, [retryCount, loadResource]);

  // 3D模型加载完成处理
  const handleModelLoad = useCallback(() => {
    setModelLoaded(true);
    setLoadingProgress(100);
    setLoading(false);
  }, []);

  // 3D模型加载错误处理
  const handleModelError = useCallback((err: Error) => {
    console.error('Model loading error:', err);
    setError('3D模型加载失败，请重试');
    setLoading(false);
  }, []);

  // 处理模态框点击事件，防止事件冒泡影响底层main元素
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      ref={modalRef}
      onClick={handleModalClick}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ pointerEvents: 'auto' }}
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white z-10">
        <h2 className="text-xl font-bold">AR预览</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          关闭
        </button>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 relative">
        {/* Canvas */}
        <Canvas
          camera={{ position: [5, 5, 5] }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 光照 */}
          <ambientLight intensity={config.ambientLightIntensity || 1} />
          <directionalLight position={[10, 10, 10]} intensity={config.directionalLightIntensity || 1} />

          {/* 控制器 */}
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={2}
            maxDistance={15}
          />

          {/* 地面网格 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* 2D图像 - 添加变换控制和更好的视觉效果 */}
          {config.type === '2d' && texture && (
            <mesh 
              ref={modelRef}
              position={[position.x, position.y, position.z]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              scale={scale}
              castShadow
              receiveShadow
            >
              <planeGeometry args={[3, 3]} />
              <meshPhysicalMaterial 
                map={texture} 
                transparent 
                side={THREE.DoubleSide} 
                roughness={0.5} 
                metalness={0.2}
                transmission={0.1}
              />
            </mesh>
          )}

          {/* 3D模型 - 使用ModelViewer组件加载实际模型 */}
          {config.type === '3d' && config.modelUrl && (
            <ModelViewer
              url={config.modelUrl}
              onLoad={handleModelLoad}
              onError={handleModelError}
              position={[position.x, position.y, position.z]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              scale={scale}
            />
          )}
          
          {/* 3D模型占位符 - 加载完成前显示 */}
          {config.type === '3d' && !modelLoaded && (
            <mesh 
              position={[position.x, position.y, position.z]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              scale={scale}
            >
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#4f46e5" opacity={0.5} transparent />
            </mesh>
          )}
        </Canvas>
        
        {/* 控制按钮 */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
          {/* 控制面板切换按钮 */}
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isControlsOpen ? '关闭控制' : '调整模型'}
          </button>
        </div>
        
        {/* 控制面板 */}
        {isControlsOpen && (
          <div className="absolute bottom-20 right-4 z-10 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-xl max-w-xs w-full">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
              <span>模型控制</span>
              <button 
                onClick={() => setIsControlsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </h3>
            
            {/* 缩放控制 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">缩放</label>
                <span className="text-sm opacity-80">{scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x</span>
                <span>10x</span>
              </div>
            </div>
            
            {/* 旋转控制 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">旋转</h4>
              
              {/* X轴旋转 */}
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300">X轴</label>
                <span className="text-xs opacity-80">{(rotation.x * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.x * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, x: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              
              {/* Y轴旋转 */}
              <div className="flex justify-between items-center mb-1 mt-2">
                <label className="text-xs text-gray-300">Y轴</label>
                <span className="text-xs opacity-80">{(rotation.y * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.y * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, y: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              
              {/* Z轴旋转 */}
              <div className="flex justify-between items-center mb-1 mt-2">
                <label className="text-xs text-gray-300">Z轴</label>
                <span className="text-xs opacity-80">{(rotation.z * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.z * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, z: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            
            {/* 重置按钮 */}
            <button
              onClick={() => {
                setScale(config.scale || 5.0);
                setRotation(config.rotation || { x: 0, y: 0, z: 0 });
                setPosition(config.position || { x: 0, y: 0, z: 0 });
              }}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg transition-colors"
            >
              重置模型
            </button>
          </div>
        )}

        {/* AR功能提示 */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
          {isSupported === null ? (
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm bg-gray-800 bg-opacity-80 px-4 py-2 rounded-lg backdrop-blur-sm">
                正在检测设备AR兼容性
              </div>
            </div>
          ) : isSupported ? (
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm bg-blue-900 bg-opacity-80 px-4 py-2 rounded-lg max-w-xs backdrop-blur-sm">
                💡 AR功能说明：
                <br />1. 确保设备支持WebXR
                <br />2. 使用Chrome或Edge浏览器
                <br />3. 在明亮环境中使用
                <br />4. 将设备对准平面表面
                <br /><br />温馨提示：目前仅在移动设备上支持完整AR功能
              </div>
              <button
                onClick={() => {
                  alert('📱 AR功能暂不可用\n\n开发团队正在努力开发中，敬请期待！\n\n您可以继续使用3D预览功能查看模型。');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transition-all duration-200 hover:translate-y-[-2px]"
              >
                <i className="fas fa-vr-cardboard mr-2"></i>
                AR功能说明
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm bg-gray-800 bg-opacity-80 px-4 py-2 rounded-lg max-w-xs backdrop-blur-sm">
                📱 您的设备不支持AR功能
                <br /><br />建议使用：
                <ul className="mt-1 list-disc list-inside text-xs opacity-90">
                  <li>Chrome 90+（Android）</li>
                  <li>Edge 90+（Android）</li>
                  <li>Safari 15+（iOS 15+）</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 - 显示进度 */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center">
              <div className="animate-spin w-16 h-16 border-4 border-t-transparent border-white rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">正在加载AR资源...</p>
              <div className="w-64 bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm opacity-80">{loadingProgress}%</p>
            </div>
          </div>
        )}

        {/* 错误提示 - 更友好的UI和重试逻辑 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center p-8 bg-red-900 bg-opacity-70 rounded-lg max-w-md">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-3">加载失败</h3>
              <p className="mb-4">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleRetry}
                  disabled={retryCount >= maxRetries}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                    retryCount >= maxRetries 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-60' 
                      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                  }`}
                >
                  {retryCount >= maxRetries ? '已达最大重试次数' : `重试 (${retryCount}/${maxRetries})`}
                </button>
                <button 
                  onClick={onClose} 
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 hover:shadow-lg transition-all duration-200 font-medium"
                >
                  关闭
                </button>
              </div>
              {retryCount >= maxRetries && (
                <p className="text-sm opacity-80 mt-4">
                  请检查网络连接或稍后重试
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedARPreview;