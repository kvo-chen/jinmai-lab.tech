import React, { useState, useEffect, useRef } from 'react';
import { processImageUrl } from '../utils/imageUrlUtils';

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
  quality?: 'high' | 'low' | 'medium';
  // 图片填充方式
  fit?: 'cover' | 'contain';
  // 默认图片URL，当原始图片加载失败时使用
  fallbackSrc?: string;
}

export default function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className, 
  onLoad, 
  onError, 
  ratio = 'auto',
  fit = 'cover',
  priority = false,
  quality,
  fallbackSrc,
  ...rest 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(processImageUrl(src));
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 默认fallback图片 - 使用本地占位图，避免ORB策略阻止
  const defaultFallbackSrc = '/images/placeholder-image.jpg';
  
  // 图片加载完成处理
  const handleLoad = () => {
    console.log('Image loaded successfully:', currentSrc);
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };
  
  // 图片加载失败处理
  const handleError = () => {
    console.warn('Image failed to load:', currentSrc, 'Retry count:', retryCount);
    const maxRetries = 2;
    
    // 检查是否已经是fallback图片
    const finalFallback = fallbackSrc || defaultFallbackSrc;
    const isFallback = currentSrc === finalFallback;
    
    // 如果当前URL为空或无效，直接使用fallback图片，不进行重试
    const isEmptyOrInvalid = !currentSrc || currentSrc === '';
    
    if (!isFallback && !isEmptyOrInvalid && retryCount < maxRetries) {
      // 重试机制：增加重试次数，延迟后重试
      setRetryCount(prev => prev + 1);
      // 可以添加随机延迟避免所有图片同时重试
      const delay = 1000 * Math.pow(2, retryCount);
      console.log(`Retrying image in ${delay}ms...`);
      setTimeout(() => {
        const retrySrc = processImageUrl(src);
        console.log('Retrying with URL:', retrySrc);
        setCurrentSrc(retrySrc); // 重试原始URL
      }, delay);
    } else if (!isFallback) {
      // 重试失败或URL为空，使用fallback图片
      console.log('Using fallback image:', finalFallback);
      // 重置加载状态，确保fallback图片能够显示
      setIsLoaded(false);
      setIsError(false);
      setRetryCount(0);
      setCurrentSrc(finalFallback);
    } else {
      // fallback也失败了
      console.error('Fallback image also failed:', finalFallback);
      setIsError(true);
      setIsLoaded(false);
      if (onError) {
        onError();
      }
    }
  };
  
  // 当URL为空或无效时，直接使用fallback图片
  useEffect(() => {
    const finalFallback = fallbackSrc || defaultFallbackSrc;
    if (!currentSrc || currentSrc === '') {
      setCurrentSrc(finalFallback);
    }
  }, [currentSrc, fallbackSrc]);
  
  // 当src prop变化时更新currentSrc
  useEffect(() => {
    const processedSrc = processImageUrl(src);
    console.log('LazyImage src changed:', src, 'processed to:', processedSrc);
    
    // 如果处理后的URL为空，直接使用fallback图片
    const finalFallback = fallbackSrc || defaultFallbackSrc;
    const effectiveSrc = processedSrc || finalFallback;
    
    console.log('Effective src:', effectiveSrc);
    setCurrentSrc(effectiveSrc);
    setIsLoaded(false);
    setIsError(false);
    setRetryCount(0);
  }, [src]);
  
  // 观察图片是否进入视口
  useEffect(() => {
    // 立即设置为可见，确保图片能够加载
    setIsVisible(true);
    
    // 优先级高的图片立即加载，不使用懒加载
    if (priority) {
      return;
    }
    
    // 如果浏览器不支持IntersectionObserver，则直接返回
    if (!('IntersectionObserver' in window)) {
      return;
    }
    
    // 创建IntersectionObserver实例 - 仅用于监控可见性，不影响初始加载
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // 图片进入视口后，停止观察
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      {
        // 提前100px开始加载
        rootMargin: '100px 0px',
        // 当图片10%进入视口时触发
        threshold: 0.1
      }
    );
    
    // 开始观察图片容器元素
    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }
    
    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [priority]);
  
  // 自定义占位符
  const defaultPlaceholder = (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
      <i className="fas fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
    </div>
  );
  
  return (
    <div className={`relative ${className}`}>
      {/* 图片容器，保持宽高比 */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: rest.width && rest.height 
            ? `${rest.width} / ${rest.height}` 
            : ratio === 'square' 
              ? '1 / 1' 
              : ratio === 'landscape' 
                ? '16 / 9' 
                : ratio === 'portrait' 
                  ? '4 / 5' 
                  : 'auto'
        }}
      >
        {/* 占位符 */}
        {!isLoaded && (
          <div className="absolute inset-0 z-10">
            {placeholder || defaultPlaceholder}
          </div>
        )}
        
        {/* 图片元素 */}
        <img
          ref={imgRef}
          src={isVisible ? currentSrc : ''}
          alt={alt}
          className={`w-full h-full object-${fit} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isError ? 'hidden' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
        
        {/* 加载失败状态 */}
        {isError && (
          <div className="absolute inset-0 z-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-2"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">图片加载失败</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
