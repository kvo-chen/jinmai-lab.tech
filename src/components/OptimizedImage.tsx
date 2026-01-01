import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { processImageUrl, buildSrcSet } from '../utils/imageUrlUtils'
import { performanceMonitor } from '../utils/performanceMonitor'

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * 是否使用懒加载
   */
  lazy?: boolean
  /**
   * 占位符类型
   */
  placeholder?: 'blur' | 'color' | 'skeleton'
  /**
   * 占位符颜色（仅当placeholder为'color'时使用）
   */
  placeholderColor?: string
  /**
   * 模糊占位符图片URL（仅当placeholder为'blur'时使用）
   */
  blurPlaceholder?: string
  /**
   * 是否使用渐进式加载
   */
  progressive?: boolean
  /**
   * 加载错误时显示的图片URL
   */
  errorSrc?: string
  /**
   * 加载完成回调
   */
  onLoad?: () => void
  /**
   * 加载错误回调
   */
  onError?: () => void
  /**
   * 是否启用性能监控
   */
  enablePerformanceMonitoring?: boolean
  /**
   * 是否使用现代图片格式（WebP/AVIF）
   */
  useModernFormats?: boolean
  /**
   * 响应式图片源集合
   */
  srcSet?: string
  /**
   * 响应式图片尺寸描述
   */
  sizes?: string
  /**
   * 图片优先级
   */
  priority?: boolean
  /**
   * 图片格式集合（用于picture标签）
   */
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png' | 'gif'>
  /**
   * 响应式图片尺寸集合
   */
  responsiveSizes?: number[]
  /**
   * 图片质量
   */
  quality?: 'low' | 'medium' | 'high'
  /**
   * 响应式宽度列表
   */
  responsiveWidths?: number[]
  /**
   * 是否自动选择格式
   */
  autoFormat?: boolean
  /**
   * 图片处理选项
   */
  processingOptions?: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    crop?: string
    dpr?: number
    sharpen?: boolean
    blur?: number
  }
  /**
   * 是否预加载图片
   */
  preload?: boolean
  /**
   * 图片加载策略
   */
  loading?: 'lazy' | 'eager'
  /**
   * 图片解码策略
   */
  decoding?: 'async' | 'sync' | 'auto'
}

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
        rootMargin: '200px', // 提前200px开始加载，优化用户体验
        threshold: 0.01, // 只要有1%可见就开始加载
      }
    );
  }
};

const OptimizedImage = React.memo(({
  src,
  alt,
  lazy = true,
  placeholder = 'skeleton',
  placeholderColor = '#f0f0f0',
  blurPlaceholder,
  progressive = true,
  errorSrc,
  onLoad,
  onError,
  className,
  enablePerformanceMonitoring = false,
  useModernFormats = true,
  srcSet,
  sizes,
  priority = false,
  formats = ['avif', 'webp', 'jpeg'],
  responsiveSizes = [240, 320, 480, 640, 800, 1024, 1280, 1600, 2048],
  quality = 'medium',
  responsiveWidths = [240, 320, 480, 640, 800, 1024, 1280, 1600, 2048],
  autoFormat = true,
  processingOptions,
  preload = false,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(progressive ? undefined : src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredLoad = useRef(false);
  const loadStartTime = useRef<number>(0);

  // 图片性能统计
  const trackPerformance = useCallback((status: 'success' | 'error') => {
    if (enablePerformanceMonitoring && typeof window !== 'undefined') {
      // 使用performanceMonitor记录图片加载性能
      performanceMonitor.recordMetric({
        name: 'image-load',
        value: status === 'success' ? Date.now() - loadStartTime.current : 0,
        unit: 'ms',
        description: `Image load ${status}`,
        timestamp: Date.now(),
        category: 'image',
        metadata: {
          src: src || '',
          status,
          element: imgRef.current,
          quality,
          format: formats.join(','),
          lazy,
          priority
        }
      });
    }
  }, [enablePerformanceMonitoring, src, quality, formats, lazy, priority]);

  // 处理图片加载
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    hasTriggeredLoad.current = true;
    trackPerformance('success');
    onLoad?.();
  }, [onLoad, trackPerformance]);

  // 处理图片加载错误
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsError(true);
    trackPerformance('error');
    onError?.();
  }, [onError, trackPerformance]);

  // 触发图片加载
  const triggerImageLoad = useCallback(() => {
    if (!hasTriggeredLoad.current && src) {
      loadStartTime.current = Date.now();
      setImageSrc(src);
    }
  }, [src]);



  // 预加载图片
  useEffect(() => {
    if ((preload || priority) && src) {
      try {
        const preloadImg = new Image();
        preloadImg.src = processImageUrl(src, {
          quality,
          width: processingOptions?.width,
          height: processingOptions?.height,
          format: autoFormat ? undefined : formats[0],
          autoFormat,
          responsive: true
        });
        
        // 预加载srcSet中的所有图片
        if (srcSet || generatedSrcSet) {
          const finalSrcSetValue = srcSet || generatedSrcSet;
          const srcSetUrls = finalSrcSetValue.split(',').map(srcItem => {
            return srcItem.trim().split(' ')[0];
          });
          
          srcSetUrls.forEach(url => {
            const img = new Image();
            img.src = url;
          });
        }
      } catch (error) {
        console.warn('Failed to preload image:', error);
      }
    }
  }, [preload, priority, src, srcSet, quality, processingOptions, autoFormat, formats]);

  // 设置懒加载和优先级
  useEffect(() => {
    // 如果是高优先级图片或预加载图片，直接加载，不使用懒加载
    if (priority || preload || !lazy) {
      triggerImageLoad();
      return;
    }

    if (lazy && src) {
      if ('IntersectionObserver' in window) {
        initSharedObserver();
        
        if (sharedObserver && containerRef.current) {
          observerTargets.set(containerRef.current, triggerImageLoad);
          sharedObserver.observe(containerRef.current);
        }
      } else {
        // 降级方案：直接加载图片
        triggerImageLoad();
      }
    }

    return () => {
      if (containerRef.current) {
        observerTargets.delete(containerRef.current);
        sharedObserver?.unobserve(containerRef.current);
      }
    };
  }, [lazy, src, triggerImageLoad, priority, preload]);

  // 渲染占位符
  const renderPlaceholder = useMemo(() => {
    if (isLoaded) return null;

    switch (placeholder) {
      case 'blur':
        return blurPlaceholder ? (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={blurPlaceholder}
              alt={alt}
              className="w-full h-full object-cover filter blur-md transition-filter duration-300"
              aria-hidden="true"
              loading="eager"
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: placeholderColor }}
          ></div>
        );
      case 'color':
        return (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: placeholderColor }}
          ></div>
        );
      case 'skeleton':
      default:
        return (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"></div>
        );
    }
  }, [isLoaded, placeholder, blurPlaceholder, placeholderColor, alt]);

  // 处理图片URL
  const processedSrc = useMemo(() => {
    if (!imageSrc) return undefined;
    return processImageUrl(imageSrc, {
      quality,
      width: processingOptions?.width,
      height: processingOptions?.height,
      format: autoFormat ? undefined : formats[0],
      autoFormat,
      responsive: true
    });
  }, [imageSrc, quality, processingOptions, autoFormat, formats]);

  // 处理错误图片URL
  const processedErrorSrc = useMemo(() => {
    if (!errorSrc) return undefined;
    return processImageUrl(errorSrc, {
      quality,
      width: processingOptions?.width,
      height: processingOptions?.height,
      format: autoFormat ? undefined : formats[0],
      autoFormat,
      responsive: true
    });
  }, [errorSrc, quality, processingOptions, autoFormat, formats]);

  // 最终显示的图片URL
  const finalSrc = isError ? processedErrorSrc || processedSrc : processedSrc;

  // 图片类名
  const imgClassName = useMemo(() => {
    const className = (rest as React.ImgHTMLAttributes<HTMLImageElement>).className;
    return `w-full h-full object-cover transition-all duration-500 ease-in-out ${className || ''}`;
  }, [(rest as React.ImgHTMLAttributes<HTMLImageElement>).className]);

  // 生成响应式图片源集合
  const generatedSrcSet = useMemo(() => {
    if (!src || !useModernFormats) return '';
    return buildSrcSet(src, responsiveWidths, quality);
  }, [src, useModernFormats, responsiveWidths, quality]);

  // 最终使用的srcSet
  const finalSrcSet = srcSet || generatedSrcSet;

  // 渲染响应式图片
  const renderResponsiveImage = () => {
    // 生成更精细的sizes属性
    const defaultSizes = '(max-width: 320px) 240px, (max-width: 480px) 320px, (max-width: 640px) 480px, (max-width: 800px) 640px, (max-width: 1024px) 800px, (max-width: 1280px) 1024px, (max-width: 1600px) 1280px, (max-width: 2048px) 1600px, 2048px';
    
    const finalSizes = sizes || defaultSizes;
    
    // 使用picture标签支持多种图片格式
    return (
      <picture>
        {useModernFormats && formats.map((format, index) => {
          if (!finalSrcSet) return null;
          
          return (
            <source
              key={index}
              type={`image/${format}`}
              srcSet={finalSrcSet}
              sizes={finalSizes}
            />
          );
        })}
        <img
          ref={imgRef}
          src={finalSrc}
          srcSet={finalSrcSet}
          sizes={finalSizes}
          alt={alt}
          className={imgClassName}
          style={{
            opacity: isLoaded ? 1 : 0,
            position: 'relative',
            zIndex: 1
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          decoding={decoding}
          {...rest}
        />
      </picture>
    );
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      ref={containerRef}
    >
      {renderPlaceholder}
      {renderResponsiveImage()}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage
