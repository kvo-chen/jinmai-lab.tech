import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

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
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png'>
  /**
   * 响应式图片尺寸集合
   */
  responsiveSizes?: number[]
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
  formats = ['webp', 'avif'],
  responsiveSizes = [320, 640, 1024, 1600, 2048],
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
      const imageService = (window as any).imageService;
      if (imageService && typeof imageService.trackImageLoad === 'function') {
        imageService.trackImageLoad({
          src: src || '',
          status,
          loadTime: status === 'success' ? Date.now() - loadStartTime.current : 0,
          element: imgRef.current
        });
      }
    }
  }, [enablePerformanceMonitoring, src]);

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

  // 设置懒加载和优先级
  useEffect(() => {
    // 如果是高优先级图片，直接加载，不使用懒加载
    if (priority || !lazy) {
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
  }, [lazy, src, triggerImageLoad, priority]);

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

  // 最终显示的图片URL
  const finalSrc = isError ? errorSrc || src : imageSrc;

  // 图片类名
  const imgClassName = useMemo(() => {
    return `w-full h-full object-cover transition-all duration-500 ease-in-out ${rest.className || ''}`;
  }, [rest.className]);

  // 生成不同格式的图片源
  const generateSourceSet = useMemo(() => {
    if (!finalSrc || !useModernFormats) return [];

    // 提取基础文件名和扩展名
    const ext = finalSrc.split('.').pop()?.toLowerCase() || 'jpg';
    const baseUrl = finalSrc.replace(new RegExp(`\.${ext}$`), '');

    // 生成不同格式和尺寸的图片源
    const sources = formats.map(format => {
      // 生成不同尺寸的源集
      const sizeSrcSet = responsiveSizes.map(size => `${baseUrl}-${size}.${format} ${size}w`).join(', ');
      return {
        type: `image/${format}`,
        srcSet: sizeSrcSet
      };
    });

    return sources;
  }, [finalSrc, useModernFormats, formats, responsiveSizes]);

  // 渲染响应式图片
  const renderResponsiveImage = () => {
    // 如果提供了自定义srcSet，直接使用
    if (srcSet) {
      return (
        <img
          ref={imgRef}
          src={finalSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={imgClassName}
          style={{
            opacity: isLoaded ? 1 : 0,
            position: 'relative',
            zIndex: 1
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          {...rest}
        />
      );
    }

    // 否则使用生成的响应式图片
    if (useModernFormats && generateSourceSet.length > 0) {
      return (
        <picture>
          {/* 生成不同格式的source标签 */}
          {generateSourceSet.map((source, index) => (
            <source
              key={index}
              type={source.type}
              srcSet={source.srcSet}
              sizes={sizes}
            />
          ))}
          {/* 回退到原始图片 */}
          <img
            ref={imgRef}
            src={finalSrc}
            alt={alt}
            className={imgClassName}
            style={{
              opacity: isLoaded ? 1 : 0,
              position: 'relative',
              zIndex: 1
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            {...rest}
          />
        </picture>
      );
    }

    // 基本情况：直接使用img标签
    return (
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        className={imgClassName}
        style={{
          opacity: isLoaded ? 1 : 0,
          position: 'relative',
          zIndex: 1
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        {...rest}
      />
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
