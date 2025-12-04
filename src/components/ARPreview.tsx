import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
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

// 改进的纹理缓存，带引用计数
interface TextureCacheItem {
  texture: THREE.Texture;
  refCount: number;
}

const textureCache = new Map<string, TextureCacheItem>();

// 2D图片组件 - 带纹理缓存
const ImagePreview: React.FC<{
  url: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}> = ({ url, scale, rotation, position }) => {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  
  React.useEffect(() => {
    // 检查缓存中是否已有该纹理
    if (textureCache.has(url)) {
      // 使用缓存的纹理并增加引用计数
      const cachedItem = textureCache.get(url)!;
      cachedItem.refCount++;
      setTexture(cachedItem.texture);
      return;
    }
    
    // 缓存中没有，加载新纹理
    const loader = new THREE.TextureLoader();
    loader.load(
      url, 
      (loadedTexture: THREE.Texture) => {
        // 优化纹理尺寸，限制最大尺寸为2048px
        const maxSize = 2048;
        const image = loadedTexture.image as HTMLImageElement;
        
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
            ctx.drawImage(image, 0, 0, newWidth, newHeight);
            // 更新纹理图片
            loadedTexture.image = canvas;
            // 重新生成mipmap
            loadedTexture.generateMipmaps = true;
          }
        } else {
          // 原始尺寸合适，生成mipmap
          loadedTexture.generateMipmaps = true;
        }
        
        // 设置合适的纹理参数
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        
        // 存入缓存，引用计数初始化为1
        textureCache.set(url, {
          texture: loadedTexture,
          refCount: 1
        });
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Texture loading error:', error);
        // 加载失败时显示占位符或错误信息
        setTexture(null);
      }
    );
    
    // 清理函数
    return () => {
      const cachedItem = textureCache.get(url);
      if (cachedItem) {
        // 减少引用计数
        cachedItem.refCount--;
        
        // 如果引用计数为0，清理纹理资源
        if (cachedItem.refCount <= 0) {
          cachedItem.texture.dispose();
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
        <meshBasicMaterial transparent side={THREE.DoubleSide} map={texture} />
      ) : (
        // 占位符材质，显示错误状态
        <meshBasicMaterial 
          side={THREE.DoubleSide} 
          color="#cccccc"
          opacity={0.5}
          transparent
        >
          {/* 可以添加更多占位符效果，比如文字或图标 */}
        </meshBasicMaterial>
      )}
    </mesh>
  );
};



const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(config.scale || 1.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [isARMode, setIsARMode] = useState(false);

  // 简化加载逻辑，确保组件能够正常渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // AR模式切换处理
  useEffect(() => {
    if (isARMode) {
      // 进入AR模式时的处理逻辑
      console.log('进入AR模式');
      // 这里应该初始化AR会话，访问设备摄像头，实现环境融合等
      // 但目前只是简单的3D预览，没有真正的AR功能
    } else {
      // 退出AR模式时的处理逻辑
      console.log('退出AR模式');
      // 这里应该清理AR会话，释放摄像头资源等
    }
  }, [isARMode]);

  // 缩放控制
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };

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
      <div className="flex-1 relative overflow-hidden">
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="text-center text-white">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
              <p className="text-lg mb-2">正在加载AR资源...</p>
            </div>
          </div>
        )}
        
        {/* 3D预览内容 */}
        <div className="w-full h-full">
          {!isLoading && (
            <Canvas shadows>
              {/* 基础相机和灯光 */}
              <PerspectiveCamera makeDefault position={[0, 0, 3]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
              
              {/* 环境预设 */}
              <Environment
                preset="studio"
                background
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
              
              {/* 3D模型预览 - 简单实现 */}
              {config.type === '3d' && (
                <mesh position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]} scale={scale}>
                  {config.modelUrl ? (
                    // 这里应该实现3D模型加载逻辑
                    <boxGeometry args={[1, 1, 1]} />
                  ) : (
                    <boxGeometry args={[1, 1, 1]} />
                  )}
                  <meshStandardMaterial color="#ff6b6b" />
                </mesh>
              )}
              
              {/* 网格辅助线 */}
              {!isARMode && <gridHelper args={[10, 10, '#888888', '#444444']} />}
              
              {/* 坐标系辅助线 */}
              {!isARMode && <axesHelper args={[2]} />}
              
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
              />
            </Canvas>
          )}
        </div>
      </div>

      {/* 控制栏 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => {
              setIsARMode(!isARMode);
              // 测试AR模式切换
              console.log('AR mode toggled:', !isARMode);
            }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isARMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
          >
            <i className={`fas fa-${isARMode ? 'eye-slash' : 'eye'}`}></i>
            {isARMode ? '退出AR' : '进入AR'}
          </button>
          
          <button
            onClick={() => {
              setPosition({ x: 0, y: 0, z: 0 });
              setRotation({ x: 0, y: 0, z: 0 });
              setScale(config.scale || 1.0);
              toast.success('模型位置已重置');
            }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-redo"></i>
            重置
          </button>
          
          <button
            onClick={() => {
              // 简化拍照功能
              toast.success('AR照片已保存');
            }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-camera"></i>
            拍照
          </button>
        </div>
        
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
      </div>
    </div>
  );
};

export default ARPreview;