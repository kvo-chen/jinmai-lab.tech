import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processImageUrl, buildSrcSet, ImageQuality, ImageProcessingOptions } from '../utils/imageUrlUtils';

// 导入共享的Intersection Observer相关变量
// 共享的Intersection Observer实例，减少创建实例的开销
let sharedObserver: IntersectionObserver | null = null;
let observerTargets = new Map<Element, () => void>();

// 初始化共享的Intersection Observer
const initSharedObserver = () => {
  if (!sharedObserver && 'IntersectionObserver' in window) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = observerTargets.get(entry.target);
            if (callback) {
              callback();
              observerTargets.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '500px', // 提前500px开始加载，优化用户体验
        threshold: 0.01, // 只要有1%可见就开始加载
      }
    );
  }
};

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: React.ReactNode;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  // 支持的宽高比
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  // 图片优先级
  priority?: boolean;
  // 图片质量
  quality?: ImageQuality;
  // 图片填充方式
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  // 图片定位方式
  position?: string;
  // 默认图片URL，当原始图片加载失败时使用
  fallbackSrc?: string;
  // 是否禁用fallback机制
  disableFallback?: boolean;
  // 是否启用渐进式加载
  progressive?: boolean;
  // 模糊占位符尺寸
  blurSize?: number;
  // 加载动画类型
  loadingAnimation?: 'fade' | 'scale' | 'blur';
  // 是否启用响应式图片
  responsive?: boolean;
  // 响应式宽度数组，用于生成srcset
  responsiveWidths?: number[];
  // 图片格式
  format?: 'webp' | 'jpeg' | 'png';
  // 是否自动检测格式
  autoFormat?: boolean;
  // 图片处理选项
  processingOptions?: Omit<ImageProcessingOptions, 'width' | 'height'>;
}

const LazyImage: React.FC<LazyImageProps> = React.memo(({ 
  src, 
  alt, 
  placeholder, 
  className, 
  onLoad,
  onError,
  ratio = 'auto',
  fit = 'cover',
  position,
  priority = false,
  quality = 'medium',
  fallbackSrc,
  disableFallback = false,
  progressive = true,
  blurSize = 10,
  loadingAnimation = 'fade',
  responsive = true,
  responsiveWidths = [320, 640, 1024, 1280, 1600],
  format,
  autoFormat = true,
  processingOptions = {},
  ...rest 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // 初始设置为true，确保所有图片都能开始加载
  const [retryCount, setRetryCount] = useState(0); // 重试次数计数器
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 默认fallback图片 - 使用内联base64图片作为占位符，确保可靠加载
  const defaultFallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSIjZmZmZmZmIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSI3MCIgeT0iNzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNkY2RjZGMiLz4KPHJlY3QgeD0iOTAuNSIgeT0iOTEiIHdpZHRoPSIxOSIgaGVpZ2h0PSIxOCIgc3Ryb2tlPSIjNzc3Nzc3IiBzdHJva2Utb3BhY2l0eT0iMC41IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cjwvc3ZnPg==';
  
  // 使用useMemo确保currentSrc与src同步更新，避免异步更新问题
  const currentSrc = useMemo(() => {
    // 总是处理URL，特别是代理URL，即使disableFallback为true
    // 这样可以确保代理URL能正确转换为实际API URL
    let processedSrc = src;
    
    // 处理代理URL，不管disableFallback是什么
    if (src.startsWith('/api/proxy/trae-api')) {
      processedSrc = processImageUrl(src, {
        quality,
        responsive,
        autoFormat,
        format,
        ...processingOptions
      });
    } else if (!disableFallback) {
      // 对于其他URL，只有当disableFallback为false时才处理
      processedSrc = processImageUrl(src, {
        quality,
        responsive,
        autoFormat,
        format,
        ...processingOptions
      });
    }
    
    return processedSrc || (fallbackSrc || defaultFallbackSrc);
  }, [src, fallbackSrc, disableFallback, quality, responsive, autoFormat, format, processingOptions]);
  
  // 计算实际显示的图片URL，如果加载失败则使用fallback
  const displaySrc = useMemo(() => {
    if (isError && !disableFallback) {
      return fallbackSrc || defaultFallbackSrc;
    }
    return currentSrc;
  }, [isError, currentSrc, fallbackSrc, disableFallback]);
  
  // 构建响应式图片srcset
  const srcSet = useMemo(() => {
    // 只在响应式模式下构建srcset
    if (!responsive || disableFallback) {
      return undefined;
    }
    
    // 构建srcset
    return buildSrcSet(src, responsiveWidths, quality);
  }, [src, responsive, disableFallback, responsiveWidths, quality]);
  
  // 构建sizes属性
  const sizes = useMemo(() => {
    if (!responsive) {
      return undefined;
    }
    
    // 根据设备宽度返回合适的sizes属性
    return '(max-width: 640px) 320px, (max-width: 1024px) 640px, (max-width: 1280px) 1024px, 1280px';
  }, [responsive]);
  
  // 对于SVG数据URL，立即设置为已加载，因为它们是内联的，会立即加载
  const isSvgDataUrl = useMemo(() => {
    return src.startsWith('data:image/svg+xml');
  }, [src]);
  
  // 性能监控：记录图片加载开始时间
  const loadStartTime = useRef<number | null>(null);
  
  // 性能监控：记录图片加载统计
  const logImagePerformance = (status: 'success' | 'error' | 'load') => {
    if (typeof window !== 'undefined' && window.performance) {
      const endTime = performance.now();
      const loadTime = loadStartTime.current ? endTime - loadStartTime.current : 0;
      
      // 只在开发环境或性能监控模式下记录
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImagePerformance] ${status}: ${alt}`, {
          url: currentSrc,
          loadTime: `${loadTime.toFixed(2)}ms`,
          status,
          priority,
          quality,
          responsive,
          isVisible
        });
      }
      
      // 可以发送到监控服务
      // 例如：sendToMonitoringService({ url: currentSrc, loadTime, status, priority });
    }
  };
  
  // 图片加载完成处理
  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    logImagePerformance('success');
    if (onLoad) {
      onLoad();
    }
  };
  
  // 图片加载失败处理
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
    setIsLoaded(false);
    logImagePerformance('error');
    if (onError) {
      onError();
    }
    event.preventDefault();
    
    // 自动重试机制，最多重试3次，使用带随机抖动的指数退避策略
    if (retryCount < 3) {
      // 指数退避 + 随机抖动，避免所有请求同时重试
      const baseDelay = Math.pow(2, retryCount) * 800;
      const jitter = Math.random() * 400;
      const retryDelay = baseDelay + jitter;
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsError(false);
        setIsLoaded(false);
        const img = imgRef.current;
        if (img) {
          img.src = '';
          setTimeout(() => {
            img.src = currentSrc;
            loadStartTime.current = performance.now();
          }, 0);
        }
      }, retryDelay);
    }
  };
  
  // 监控图片加载开始时间
  useEffect(() => {
    if (isVisible) {
      loadStartTime.current = performance.now();
      logImagePerformance('load');
    }
  }, [isVisible]);
  
  // 当src变化时重置加载状态
  useEffect(() => {
    // 重置所有相关状态，确保新图片能正确显示加载过程
    setIsLoaded(isSvgDataUrl); // SVG数据URL立即设置为已加载
    setIsError(false);
    setRetryCount(0); // 重置重试计数器
  }, [src, isSvgDataUrl]);

  // 网络状态监听：当网络恢复时自动重试加载失败的图片
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      // 网络恢复时，如果图片加载失败，重置状态并重试
      if (isError) {
        setIsLoaded(false);
        setIsError(false);
        setRetryCount(0);
        const img = imgRef.current;
        if (img) {
          img.src = '';
          setTimeout(() => {
            img.src = currentSrc;
          }, 0);
        }
      }
    };

    // 监听网络恢复事件
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isError, currentSrc]);

  // 观察图片是否进入视口
  useEffect(() => {
    // 优先级高的图片立即加载，不使用懒加载
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    // 使用共享的Intersection Observer实例，降低初始延迟
    initSharedObserver();
    
    if (sharedObserver && containerRef.current) {
      // 添加到共享observer，增加预加载距离
      observerTargets.set(containerRef.current, () => setIsVisible(true));
      sharedObserver.observe(containerRef.current);
    } else {
      // 降级方案：直接加载图片
      setIsVisible(true);
    }
    
    // 清理函数
    return () => {
      if (containerRef.current) {
        observerTargets.delete(containerRef.current);
        sharedObserver?.unobserve(containerRef.current);
      }
    };
  }, [priority]);

  // 预加载关键图片，优化初始加载体验
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 高优先级图片立即预加载
    if (priority) {
      // 创建图片对象进行预加载
      const preloadImage = () => {
        const img = new Image();
        img.src = currentSrc;
        if (srcSet) {
          img.srcset = srcSet;
        }
        return img;
      };
      
      // 立即预加载
      preloadImage();
      
      // 对于特别重要的图片，使用fetch进行预加载，支持缓存控制
      if (typeof fetch !== 'undefined') {
        fetch(currentSrc, {
          mode: 'no-cors',
          cache: 'force-cache'
        }).catch(() => {
          // 忽略fetch错误，仍会使用img标签加载
        });
      }
    } else {
      // 非优先级图片，但仍在视口附近的，也进行预加载
      if (containerRef.current) {
        // 检查元素是否在视口附近（500px以内）
        const rect = containerRef.current.getBoundingClientRect();
        const isNearViewport = rect.top < window.innerHeight + 500 && rect.bottom > -500;
        
        if (isNearViewport) {
          const img = new Image();
          img.src = currentSrc;
          if (srcSet) {
            img.srcset = srcSet;
          }
        }
      }
    }
  }, [priority, currentSrc, srcSet]);
  
  // 加载动画样式
  const getLoadingAnimationClasses = () => {
    if (loadingAnimation === 'fade') {
      return 'transition-opacity duration-500 ease-in-out';
    } else if (loadingAnimation === 'scale') {
      return 'transition-all duration-500 ease-in-out transform';
    } else if (loadingAnimation === 'blur') {
      return 'transition-all duration-700 ease-in-out';
    }
    return 'transition-opacity duration-500 ease-in-out';
  };
  
  // 图片容器样式
  const getImageClasses = () => {
    const positionClass = position ? `object-${position}` : '';
    const baseClasses = `w-full h-full object-${fit} ${positionClass} ${getLoadingAnimationClasses()}`;
    
    if (isLoaded) {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-100`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-100 scale-100`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-100 blur-0`;
      }
      return `${baseClasses} opacity-100`;
    } else if (isError) {
      return `${baseClasses} opacity-0`;
    } else {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-0`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-0 scale-95`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-0 blur-${blurSize}`;
      }
      return `${baseClasses} opacity-0`;
    }
  };
  
  // 自定义占位符
  const defaultPlaceholder = (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <i className="fas fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
    </div>
  );
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 图片容器，保持宽高比 */}
      <div 
        className="relative overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          // 只有当没有父级固定宽高时才使用aspectRatio
          ...(!rest.width && !rest.height && {
            aspectRatio: ratio === 'square' 
              ? '1 / 1' 
              : ratio === 'landscape' 
                ? '16 / 9' 
                : ratio === 'portrait' 
                  ? '4 / 5' 
                  : '16 / 9' // 默认使用16:9宽高比，确保容器有高度
          })
        }}
      >
        {/* 图片元素 - 只有在可见时才加载 */}
        {isVisible && (
          <img
            ref={imgRef}
            src={displaySrc}
            alt={alt}
            className={getImageClasses()}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            srcSet={srcSet}
            sizes={sizes}
            {...rest}
          />
        )}
        
        {/* 加载状态 - 显示默认占位符或自定义占位符 */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            {placeholder || defaultPlaceholder}
          </div>
        )}
        
        {/* 加载失败状态 - 显示自定义错误界面，允许重试 */}
        {isError && (
          <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center p-4">
              <div className="mb-3">
                <i className="fas fa-image text-4xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">图片加载失败</p>
              <button 
                onClick={() => {
                  setIsLoaded(false);
                  setIsError(false);
                  setRetryCount(0);
                  const img = imgRef.current;
                  if (img) {
                    // 重置图片src，触发重新加载
                    img.src = '';
                    setTimeout(() => {
                      img.src = currentSrc;
                    }, 0);
                  }
                }} 
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                aria-label="重新加载图片"
              >
                <i className="fas fa-redo"></i>
                <span>重新加载</span>
              </button>
              {retryCount >= 3 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">已自动重试3次，请检查网络连接</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;