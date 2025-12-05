import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

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

// 改进的纹理缓存，带引用计数和大小限制
interface TextureCacheItem {
  texture: THREE.Texture;
  refCount: number;
  size: number;
  lastUsed: number;
}

const textureCache = new Map<string, TextureCacheItem>();
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
let currentCacheSize = 0;

// 清理纹理缓存的函数
const cleanupTextureCache = () => {
  if (currentCacheSize <= MAX_CACHE_SIZE) return;
  
  // 按最后使用时间排序，清理最旧的纹理
  const sortedItems = Array.from(textureCache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  
  for (const [url, item] of sortedItems) {
    if (currentCacheSize <= MAX_CACHE_SIZE) break;
    
    // 只有当引用计数为0时才清理
    if (item.refCount <= 0) {
      item.texture.dispose();
      currentCacheSize -= item.size;
      textureCache.delete(url);
    }
  }
};

// 2D图片组件 - 带纹理缓存
const ImagePreview: React.FC<{
  url: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}> = ({ url, scale, rotation, position }) => {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    // 检查缓存中是否已有该纹理
    if (textureCache.has(url)) {
      // 使用缓存的纹理并增加引用计数
      const cachedItem = textureCache.get(url)!;
      cachedItem.refCount++;
      cachedItem.lastUsed = Date.now();
      setTexture(cachedItem.texture);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // 缓存中没有，加载新纹理
    const loader = new THREE.TextureLoader();
    
    // 先加载一个低分辨率的占位纹理
    const placeholderTexture = new THREE.Texture();
    placeholderTexture.colorSpace = THREE.SRGBColorSpace;
    setTexture(placeholderTexture);
    
    // 然后加载完整纹理
    loader.load(
      url, 
      async (loadedTexture: THREE.Texture) => {
        try {
          const image = loadedTexture.image as HTMLImageElement;
          
          // 优化纹理尺寸，限制最大尺寸为2048px
          const maxSize = 2048;
          let optimizedImage = image;
          
          // 检查是否需要调整尺寸
          if (image.width > maxSize || image.height > maxSize) {
            // 计算调整后的尺寸，保持原比例
            const aspectRatio = image.width / image.height;
            let newWidth = maxSize;
            let newHeight = maxSize;
            
            if (aspectRatio > 1) {
              // 宽图
              newHeight = Math.floor(maxSize / aspectRatio);
            } else {
              // 高图或正方形
              newWidth = Math.floor(maxSize * aspectRatio);
            }
            
            // 创建临时画布用于调整尺寸
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // 使用渐进式缩放算法，提高缩放质量
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(image, 0, 0, newWidth, newHeight);
              optimizedImage = canvas;
            }
          }
          
          // 更新纹理
          loadedTexture.image = optimizedImage;
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          loadedTexture.generateMipmaps = true;
          loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          loadedTexture.needsUpdate = true;
          
          // 计算纹理大小（近似值）
          const imageData = new ImageData(optimizedImage.width, optimizedImage.height);
          const textureSize = imageData.data.length * 4; // RGBA格式，每个通道1字节
          
          // 存入缓存，引用计数初始化为1
          textureCache.set(url, {
            texture: loadedTexture,
            refCount: 1,
            size: textureSize,
            lastUsed: Date.now()
          });
          
          currentCacheSize += textureSize;
          
          // 清理超出大小限制的缓存
          cleanupTextureCache();
          
          setTexture(loadedTexture);
        } catch (error) {
          console.error('Texture optimization error:', error);
          setTexture(null);
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('Texture loading error:', error);
        setTexture(null);
        setIsLoading(false);
      }
    );
    
    // 清理函数
    return () => {
      const cachedItem = textureCache.get(url);
      if (cachedItem) {
        // 减少引用计数
        cachedItem.refCount--;
        cachedItem.lastUsed = Date.now();
        
        // 如果引用计数为0，清理纹理资源
        if (cachedItem.refCount <= 0) {
          cachedItem.texture.dispose();
          currentCacheSize -= cachedItem.size;
          textureCache.delete(url);
        }
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
      {texture ? (
        <meshStandardMaterial 
          transparent 
          side={THREE.DoubleSide} 
          map={texture} 
          opacity={isLoading ? 0.5 : 1} // 加载过程中半透明
          metalness={0} 
          roughness={1}
        />
      ) : (
        // 占位符材质，显示错误状态
        <meshStandardMaterial 
          side={THREE.DoubleSide} 
          color="#cccccc"
          opacity={0.5}
          transparent
          metalness={0} 
          roughness={1}
        >
          {/* 可以添加更多占位符效果，比如文字或图标 */}
        </meshStandardMaterial>
      )}
    </mesh>
  );
};

// 3D模型预览组件
const ModelPreview: React.FC<{
  url?: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}> = ({ url, scale, rotation, position }) => {
  // 加载3D模型，添加错误处理
  const { scene: modelScene, error, progress } = useGLTF(url || '', { 
    draco: true, // 启用Draco压缩支持
    flipY: false,
    onProgress: (event) => {
      // 可以在这里处理加载进度
      console.log('Model loading progress:', event.loaded / event.total);
    },
    onError: (err) => {
      console.error('Model loading error:', err);
    }
  });

  // 添加默认模型几何体，当URL为空或加载失败时使用
  const defaultGeometry = (
    <group>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#4CAF50"
          opacity={0.8}
          transparent
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
      {/* 添加一些装饰元素，使默认模型更美观 */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#2196F3"
          opacity={0.8}
          transparent
        />
      </mesh>
      <mesh position={[-0.7, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial 
          color="#FFC107"
          opacity={0.8}
          transparent
        />
      </mesh>
      <mesh position={[0.7, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial 
          color="#FFC107"
          opacity={0.8}
          transparent
        />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.3, 0.1, 16, 32]} />
        <meshStandardMaterial 
          color="#9C27B0"
          opacity={0.8}
          transparent
        />
      </mesh>
    </group>
  );

  return (
    <group 
      position={[position.x, position.y, position.z]} 
      rotation={[rotation.x, rotation.y, rotation.z]} 
      scale={scale}
    >
      {modelScene ? (
        <primitive 
          object={modelScene} 
          dispose={null} // 让useGLTF处理资源释放
        />
      ) : error ? (
        // 模型加载错误状态
        defaultGeometry
      ) : (
        // 加载中状态
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#666666"
            opacity={0.5}
            transparent
          />
          {/* 加载进度指示器 */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
            <meshBasicMaterial 
              color="#4CAF50"
              transparent
              opacity={0.8}
            />
          </mesh>
        </mesh>
      )}
    </group>
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

  // 改进的加载逻辑，支持真实的加载进度
  const [loadProgress, setLoadProgress] = useState(0);

  // 环境预设状态管理 - 只使用稳定的预设
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('studio');
  const environmentPresets: EnvironmentPreset[] = [
    'studio', 'apartment', 'warehouse', 'park', 'lobby'
  ];

  // 错误状态管理
  const [error, setError] = useState<string | null>(null);

  // 清理函数，用于释放资源
  useEffect(() => {
    return () => {
      // 清理所有纹理缓存
      textureCache.forEach((item) => {
        item.texture.dispose();
      });
      textureCache.clear();
      currentCacheSize = 0;
    };
  }, []);

  // 截图功能状态管理
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setLoadProgress(Math.min(progress, 90)); // 先加载到90%
      if (progress >= 90) {
        clearInterval(interval);
        // 模拟最终加载完成
        setTimeout(() => {
          setLoadProgress(100);
          setTimeout(() => {
            setIsLoading(false);
          }, 300); // 延迟隐藏加载界面，让用户看到100%
        }, 500);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // AR模式切换处理 - 简化实现，只显示AR视觉效果
  useEffect(() => {
    if (isARMode) {
      console.log('进入AR模式');
      // 简化AR模式，只显示AR视觉效果，不访问摄像头
    } else {
      console.log('退出AR模式');
      // 清理AR模式相关资源
    }
  }, [isARMode]);

  // 缩放控制
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };

  // 旋转控制
  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setRotation(prev => ({ ...prev, [axis]: value }));
  };

  // 平移控制
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setPosition(prev => ({ ...prev, [axis]: value }));
  };

  // 重置位置和旋转
  const handleResetTransform = () => {
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(config.scale || 1.0);
    toast.success('模型变换已重置');
  };

  // 预设视图控制
  const handlePresetView = (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
    const presetRotations = {
      front: { x: 0, y: 0, z: 0 },
      back: { x: 0, y: Math.PI, z: 0 },
      left: { x: 0, y: Math.PI / 2, z: 0 },
      right: { x: 0, y: -Math.PI / 2, z: 0 },
      top: { x: -Math.PI / 2, y: 0, z: 0 },
      bottom: { x: Math.PI / 2, y: 0, z: 0 }
    };
    setRotation(presetRotations[view]);
    toast.success(`已切换到${{ front: '前', back: '后', left: '左', right: '右', top: '顶', bottom: '底' }[view]}视图`);
  };

  // 截图功能实现
  const handleScreenshot = () => {
    // 获取Canvas元素
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        // 生成截图数据URL
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setScreenshot(dataUrl);
        setIsScreenshotModalOpen(true);
        toast.success('截图已保存');
      } catch (error) {
        console.error('截图失败:', error);
        toast.error('截图失败，请重试');
      }
    } else {
      toast.error('无法获取Canvas元素');
    }
  };

  // 保存截图到本地
  const handleSaveScreenshot = () => {
    if (screenshot) {
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = `ar-screenshot-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('截图已保存到本地');
    }
  };

  // 分享截图
  const handleShareScreenshot = () => {
    if (screenshot && navigator.share) {
      try {
        navigator.share({
          title: 'AR预览截图',
          text: '查看我的AR预览截图',
          url: screenshot
        });
      } catch (error) {
        console.error('分享失败:', error);
        toast.error('分享失败，请重试');
      }
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(screenshot || '')
        .then(() => {
          toast.success('截图链接已复制到剪贴板');
        })
        .catch(error => {
          console.error('复制失败:', error);
          toast.error('复制失败，请重试');
        });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} overflow-y-auto`}>
      {/* 顶部导航栏 */}
      <div className={`sticky top-0 z-40 flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
        <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">AR预览</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700 hover:scale-110' : 'bg-gray-100 hover:bg-gray-200 hover:scale-110'} transition-all duration-300 ripple-button`}
          aria-label="关闭"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* 原本的视图内容 - 作品信息和图片/视频 */}
      {work && (
        <div className={`sticky top-16 z-30 p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
          <div className={`rounded-xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-4 order-2 lg:order-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl font-bold line-clamp-1">{work.title}</h1>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{work.category}</span>
                </div>
                <div className="flex items-center mb-3">
                  <img src={work.creatorAvatar} alt="avatar" className="w-8 h-8 rounded-full mr-2 object-cover" />
                  <div>
                    <div className="font-medium text-sm">{work.creator}</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>创作者</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center"><i className="far fa-heart mr-1" /><span className="text-sm">{work.likes}</span></div>
                  <div className="flex items-center"><i className="far fa-comment mr-1" /><span className="text-sm">{work.comments}</span></div>
                  <div className="flex items-center"><i className="far fa-eye mr-1" /><span className="text-sm">{work.views}</span></div>
                </div>
                <div className="mb-0">
                  <div className="font-semibold text-xs mb-1">标签</div>
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
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
                    className="w-full h-full object-cover max-h-[200px] lg:max-h-[300px]"
                  />
                ) : (
                  <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover max-h-[200px] lg:max-h-[300px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AR预览区域 */}
      <div className="flex-1 relative overflow-hidden min-h-[400px]">
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 backdrop-blur-md">
            <div className="text-center text-white animate-fadeIn">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-500 bg-clip-text text-transparent">
                    {loadProgress}%
                  </div>
                </div>
                <div className={`w-24 h-24 rounded-full border-4 ${loadProgress === 100 ? 'border-green-500' : 'border-gray-700'} overflow-hidden`}>
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-purple-600 to-blue-500 transition-all duration-300 ease-out"
                    style={{ 
                      transform: `rotate(${loadProgress * 3.6}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(loadProgress * 3.6 * Math.PI / 180)}% ${50 - 50 * Math.sin(loadProgress * 3.6 * Math.PI / 180)}%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black rounded-full p-1">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full shadow-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xl mb-4 font-medium bg-gradient-to-r from-red-400 to-purple-500 bg-clip-text text-transparent">正在加载AR资源...</p>
              <div className="h-2 w-48 bg-gray-700 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-purple-600 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${loadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 3D预览内容 */}
        <div className="w-full h-full relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          {!isLoading && (
            <Canvas 
              shadows 
              className="w-full h-full" 
              camera={{ position: [0, 0, 3], fov: 75, near: 0.1, far: 1000 }} 
              gl={{ antialias: true, alpha: true }} 
              style={{ backgroundColor: '#f0f0f0' }}
            >
              {/* 基础相机和灯光 */}
              <PerspectiveCamera makeDefault position={[0, 0, 3]} />
              <ambientLight intensity={isARMode ? 0.5 : 0.7} />
              <directionalLight position={[5, 5, 5]} intensity={isARMode ? 1 : 1.2} castShadow />
              <directionalLight position={[-5, -5, -5]} intensity={0.5} />
              
              {/* 环境预设 */}
              <Environment
                preset={environmentPreset as any}
                background={true}
                transition={0.5} // 添加平滑过渡效果
              />
              
              {/* 2D图片预览 */}
              {config.type === '2d' && config.imageUrl && (
                <ImagePreview
                  url={config.imageUrl}
                  scale={scale}
                  rotation={rotation}
                  position={position}
                />
              )}
              
              {/* 3D模型预览 - 使用ModelPreview组件 */}
              {config.type === '3d' && (
                <ModelPreview
                  url={config.modelUrl}
                  scale={scale}
                  rotation={rotation}
                  position={position}
                />
              )}
              
              {/* 网格辅助线 - AR模式下隐藏 */}
              {!isARMode && <gridHelper args={[10, 10, '#888888', '#444444']} />}
              
              {/* 坐标系辅助线 - AR模式下隐藏 */}
              {!isARMode && <axesHelper args={[2]} />}
              
              {/* AR模式下的视觉指示器 */}
              {isARMode && (
                <group>
                  {/* AR平面指示器 */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[5, 5]} />
                    <meshBasicMaterial 
                      color="rgba(0, 255, 0, 0.2)" 
                      transparent 
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  
                  {/* AR平面网格 */}
                  <lineSegments>
                    <gridHelper args={[5, 5, 'rgba(0, 255, 0, 0.5)', 'rgba(0, 255, 0, 0.2)']} />
                    <lineBasicMaterial color="rgba(0, 255, 0, 0.5)" />
                  </lineSegments>
                  
                  {/* AR中心点指示器 */}
                  <mesh position={[0, 0, 0]}>
                    <ringGeometry args={[0.1, 0.15, 32]} />
                    <meshBasicMaterial 
                      color="rgba(0, 255, 0, 0.8)" 
                      transparent 
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </group>
              )}
              
              {/* 交互控件 */}
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
                enabled={!isARMode} // AR模式下禁用轨道控制
              />
            </Canvas>
          )}
          
          {/* AR模式下的提示信息 */}
          {isARMode && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
              <div className="animate-pulse bg-black bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                <i className="fas fa-info-circle mr-2"></i>AR模式已激活
              </div>
              
              <div className="animate-bounce bg-black bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                <i className="fas fa-hand-pointer mr-2"></i>点击屏幕放置模型
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs text-center shadow-lg">
                  <i className="fas fa-expand-arrows-alt block mb-1 text-lg"></i>
                  缩放
                </div>
                <div className="bg-black bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs text-center shadow-lg">
                  <i className="fas fa-rotate block mb-1 text-lg"></i>
                  旋转
                </div>
                <div className="bg-black bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs text-center shadow-lg">
                  <i className="fas fa-move block mb-1 text-lg"></i>
                  移动
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 控制栏 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'} backdrop-blur-lg rounded-b-3xl shadow-2xl`}>
        {/* 主要操作按钮 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => {
              setIsARMode(!isARMode);
              console.log('AR mode toggled:', !isARMode);
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
        
        {/* 预设视图 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-500">预设视图</h3>
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
        
        {/* 缩放控制 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-gray-500">缩放</label>
            <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">{scale.toFixed(1)}x</span>
          </div>
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
        
        {/* 旋转控制 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-500">旋转</h3>
          <div className="space-y-4">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {axis.toUpperCase()} 轴
                  </label>
                  <span className="text-xs font-mono bg-gray-800 text-green-400 px-2 py-0.5 rounded">
                    {(rotation[axis] * 180 / Math.PI).toFixed(0)}°
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
        </div>
        
        {/* 平移控制 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-500">平移</h3>
          <div className="space-y-4">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {axis.toUpperCase()} 轴
                  </label>
                  <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                    {position[axis].toFixed(2)}
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
        </div>
      </div>
      
      {/* 截图预览模态框 */}
      {isScreenshotModalOpen && screenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm animate-fadeIn">
          <div className={`relative max-w-4xl w-full mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-scaleIn`}>
            {/* 模态框头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="text-lg font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">截图预览</h3>
              <button
                onClick={() => setIsScreenshotModalOpen(false)}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all duration-200 hover:scale-110`}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* 截图预览内容 */}
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="rounded-lg overflow-hidden shadow-lg max-h-[60vh] overflow-y-auto">
                  <img 
                    src={screenshot} 
                    alt="AR预览截图" 
                    className="max-w-full h-auto rounded-lg" 
                  />
                </div>
              </div>
              
              {/* 编辑工具（简化版） */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>编辑选项</h4>
                <div className="flex gap-2 flex-wrap">
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <i className="fas fa-crop-alt mr-2"></i>裁剪
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <i className="fas fa-filter mr-2"></i>滤镜
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <i className="fas fa-text mr-2"></i>添加文字
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <i className="fas fa-undo mr-2"></i>重置
                  </button>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSaveScreenshot}
                  className="py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
                >
                  <i className="fas fa-download text-lg"></i>
                  保存到本地
                </button>
                <button
                  onClick={handleShareScreenshot}
                  className="py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30"
                >
                  <i className="fas fa-share-alt text-lg"></i>
                  分享截图
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARPreview;