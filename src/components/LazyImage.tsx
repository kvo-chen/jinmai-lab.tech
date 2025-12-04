import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
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
  priority?: boolean; // 优先级，true表示立即加载
  quality?: 'low' | 'medium' | 'high'; // 图片质量
  loading?: 'eager' | 'lazy'; // 加载方式
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
  priority = false,
  quality = 'medium',
  loading = 'lazy'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPlaceholderLoaded, setIsPlaceholderLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadStartTimeRef = useRef<number>(0);

  // 生成响应式图片URL
  const getResponsiveUrl = (originalUrl: string, qualityLevel: 'low' | 'medium' | 'high') => {
    try {
      const url = new URL(originalUrl);
      let qualityParam = '80';
      let widthParam = width?.toString() || '1920';
      
      switch (qualityLevel) {
        case 'low':
          qualityParam = '40';
          widthParam = (parseInt(widthParam) / 2).toString();
          break;
        case 'high':
          qualityParam = '90';
          break;
        default:
          qualityParam = '80';
      }
      
      // 添加或更新质量和宽度参数
      url.searchParams.set('quality', qualityParam);
      url.searchParams.set('width', widthParam);
      
      return url.toString();
    } catch {
      return originalUrl;
    }
  };

  useEffect(() => {
    // 生成低质量占位符URL
    const lowQualityUrl = imageService.getLowQualityUrl(src);
    setPlaceholderSrc(lowQualityUrl);
    
    // 生成高质量图片URL
    const highQualityUrl = getResponsiveUrl(src, quality);
    setCurrentSrc(highQualityUrl);
  }, [src, quality, width]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // 立即加载高优先级图片
    if (priority || loading === 'eager') {
      loadStartTimeRef.current = Date.now();
      img.src = currentSrc;
      return;
    }

    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 图片进入视口，开始加载
              loadStartTimeRef.current = Date.now();
              img.src = currentSrc;
              observerRef.current?.unobserve(img);
            }
          });
        },
        {
          // 提前 200px 开始加载，增加预加载距离
          rootMargin: '200px 0px',
          // 当图片 5% 进入视口时开始加载，提高敏感度
          threshold: 0.05
        }
      );

      observerRef.current.observe(img);
    } else {
      // 不支持 Intersection Observer，直接加载图片
      loadStartTimeRef.current = Date.now();
      img.src = currentSrc;
    }

    return () => {
      if (observerRef.current && img) {
        observerRef.current.unobserve(img);
      }
    };
  }, [currentSrc, priority, loading]);

  const handleLoad = () => {
    const loadTime = Date.now() - loadStartTimeRef.current;
    console.log(`Image loaded in ${loadTime}ms: ${src}`);
    setIsLoaded(true);
    onLoad?.();
    
    // 更新图片状态到缓存
    imageService.updateImageStatus(src, true);
  };

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setIsError(true);
    onError?.();
    
    // 更新图片状态到缓存
    imageService.updateImageStatus(src, false);
  };

  const handlePlaceholderLoad = () => {
    setIsPlaceholderLoaded(true);
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        isLoaded ? '' : 'bg-gray-100 dark:bg-gray-800',
        placeholderClassName
      )}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* 低质量占位符图片 */}
      {!isLoaded && (
        <img
          ref={placeholderRef}
          src={placeholderSrc}
          alt={alt}
          className={clsx(
            'absolute inset-0 w-full h-full object-cover',
            isPlaceholderLoaded ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-300 ease-in-out blur-sm'
          )}
          width={width}
          height={height}
          onLoad={handlePlaceholderLoad}
          onError={() => setIsPlaceholderLoaded(true)}
          loading="eager"
        />
      )}
      
      {/* 加载动画 */}
      {!isLoaded && !isPlaceholderLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 高质量图片 */}
      <img
        ref={imgRef}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-all duration-500 ease-in-out',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
          isError ? 'hidden' : '',
          className
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
      />
      
      {/* 加载错误占位符 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <i className="fas fa-image text-4xl text-gray-300 dark:text-gray-600"></i>
        </div>
      )}
    </div>
  );
}