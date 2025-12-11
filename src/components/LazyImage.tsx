import { useState, useRef, useMemo, useEffect } from 'react';
import { clsx } from 'clsx';
import imageService from '../services/imageService';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high';
  loading?: 'eager' | 'lazy';
  sizes?: string;
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  fit?: 'cover' | 'contain';
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '', 
  width,
  height,
  onLoad,
  onError,
  priority,
  loading = 'lazy',
  sizes = '100vw',
  ratio = 'auto',
  fit = 'cover'
}: LazyImageProps) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // 移除复杂的比例样式，直接使用容器尺寸
  // 处理比例样式
  const ratioStyle = useMemo(() => {
    switch (ratio) {
      case 'square':
        return { aspectRatio: '1/1' };
      case 'landscape':
        return { aspectRatio: '4/3' };
      case 'portrait':
        return { aspectRatio: '3/4' };
      default:
        return undefined;
    }
  }, [ratio]);

  // 生成备用图像
  const generateFallbackImage = () => {
    // 创建一个默认的灰色背景作为备用，更符合整体设计风格
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 绘制一个浅灰色背景
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制一个简洁的图片图标
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(256, 200, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制相机镜头
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.arc(256, 200, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制相机机身
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(180, 240, 152, 80);
      
      // 绘制相机手柄
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(240, 320, 32, 20);
      
      // 绘制文字
      ctx.fillStyle = '#6b7280';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', canvas.width / 2, 380);
      ctx.font = '14px Arial';
      ctx.fillText('点击重试', canvas.width / 2, 410);
    }
    // 将canvas转换为data URL
    return canvas.toDataURL('image/png');
  };

  // 使用imageService获取可靠的图片URL
  const [finalSrc, setFinalSrc] = useState<string>(src);

  // 初始化时获取可靠的图片URL
  useEffect(() => {
    const getReliableUrl = async () => {
      try {
        const reliableUrl = await imageService.getReliableImageUrl(src, alt, {
          priority: priority,
          size: 'md',
          validate: false // 快速返回，不进行验证
        });
        setFinalSrc(reliableUrl);
      } catch (error) {
        console.error('Failed to get reliable image URL:', error);
      }
    };

    getReliableUrl();
  }, [src, alt, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsError(false);
    // 更新图片服务的缓存状态
    imageService.updateImageStatus(src, true);
    onLoad?.();
  };

  const handleError = () => {
    // 更新图片服务的缓存状态
    imageService.updateImageStatus(src, false);
    
    if (retryCount < 2) {
      // 重试加载图片
      setIsLoading(true);
      setRetryCount(prev => prev + 1);
      
      // 延迟重试，避免立即重试导致的连续失败
      setTimeout(() => {
        try {
          // 清除旧的缓存条目，强制重新加载
          imageService.clearCache(src);
          
          // 获取新的图片URL并重新加载
          const getNewUrl = async () => {
            try {
              const newUrl = await imageService.getReliableImageUrl(src, alt, {
                priority: priority,
                size: 'md',
                validate: false
              });
              setFinalSrc(newUrl);
              if (imgRef.current) {
                imgRef.current.src = newUrl;
              }
            } catch (error) {
              console.error('Failed to get new image URL:', error);
              // 如果获取新URL失败，尝试加载备选图像
              tryFallbackImage();
            }
          };
          
          getNewUrl();
        } catch (error) {
          console.error('Failed to retry loading image:', error);
          // 如果重试过程中出现错误，尝试加载备选图像
          tryFallbackImage();
        }
      }, 1000 * (retryCount + 1)); // 指数退避策略
    } else {
      // 达到最大重试次数，尝试加载备选图像
      tryFallbackImage();
    }
    
    // 辅助函数：尝试加载备选图像
    async function tryFallbackImage() {
      try {
        // 获取备选图像URL
        const fallbackUrl = await imageService.getFallbackUrl(alt);
        
        // 尝试加载备选图像
        const testImage = new Image();
        testImage.onload = () => {
          // 备选图像加载成功，使用备选图像
          setFinalSrc(fallbackUrl);
          if (imgRef.current) {
            imgRef.current.src = fallbackUrl;
          }
          setIsLoading(false);
          setIsError(false);
          // 更新图片服务的缓存状态
          imageService.updateImageStatus(fallbackUrl, true);
        };
        
        testImage.onerror = () => {
          // 备选图像也加载失败，显示错误状态
          showErrorState();
        };
        
        testImage.src = fallbackUrl;
      } catch (error) {
        console.error('Failed to load fallback image:', error);
        // 获取备选图像URL或加载备选图像失败，显示错误状态
        showErrorState();
      }
    }
    
    // 辅助函数：显示错误状态
    function showErrorState() {
      const fallbackImage = generateFallbackImage();
      setFallbackSrc(fallbackImage);
      setIsError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setIsError(false);
    setRetryCount(0); // 重置重试计数，允许重新开始重试
    
    // 清除旧的缓存条目，强制重新加载
    imageService.clearCache(src);
    
    // 获取新的图片URL并重新加载
    const getNewUrl = async () => {
      try {
        const newUrl = await imageService.getReliableImageUrl(src, alt, {
          priority: priority,
          size: 'md',
          validate: false
        });
        setFinalSrc(newUrl);
        if (imgRef.current) {
          imgRef.current.src = newUrl;
        }
      } catch (error) {
        console.error('Failed to get new image URL:', error);
        // 如果获取新URL失败，显示错误状态
        setIsLoading(false);
        setIsError(true);
        const fallbackImage = generateFallbackImage();
        setFallbackSrc(fallbackImage);
      }
    };

    getNewUrl();
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        placeholderClassName
      )}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        ...ratioStyle
      }}
    >
      {/* 图片元素 */}
      <img
        ref={imgRef}
        src={isError ? fallbackSrc : finalSrc}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding="async"
        style={{
          objectFit: fit,
          display: 'block'
        }}
      />
      
      {/* 加载状态指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 错误提示 - 始终可见，方便用户操作 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800 bg-opacity-80 backdrop-blur-sm">
          <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
            <div className="mb-4">
              <div className="text-red-500 dark:text-red-400 font-bold text-xl mb-2">图片加载失败</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                <div>已尝试 {retryCount + 1} 次加载，均失败</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  可能的原因：网络连接问题、图片URL无效或服务器故障
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新加载
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                刷新页面
              </button>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => navigator.clipboard.writeText(src).then(() => alert('图片URL已复制到剪贴板'))}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
              >
                复制图片URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}