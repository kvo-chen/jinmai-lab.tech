/**
 * 优化图片组件
 * 支持懒加载、格式优化、响应式图片等功能
 */

import React, { useEffect, useRef, useState } from 'react';
import { imageOptimizer, lazyImageManager, OptimizedImageResult, ImageOptimizationOptions } from '@/utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  formats?: string[];
  sizes?: number[];
  quality?: number;
  responsive?: boolean;
  preload?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'solid' | 'none';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

/**
 * 优化的图片组件
 * 自动处理格式转换、懒加载、响应式图片等功能
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  formats = ['avif', 'webp', 'jpg'],
  sizes = [320, 640, 1024, 1600],
  quality = 85,
  responsive = true,
  preload = false,
  onLoad,
  onError,
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center'
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImageResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 优化图片
    imageOptimizer.optimizeImage(src, alt, {
      formats,
      sizes,
      quality,
      lazy: loading === 'lazy',
      preload,
      responsive
    }).then(result => {
      if (isMounted) {
        setOptimizedImage(result);
      }
    }).catch(error => {
      console.warn('Failed to optimize image:', error);
      if (isMounted) {
        // 回退到原始图片
        setOptimizedImage({
          src,
          alt,
          loading,
          decoding
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src, alt, formats, sizes, quality, loading, preload, responsive]);

  useEffect(() => {
    if (!imgRef.current || !optimizedImage) return;

    const img = imgRef.current;

    // 设置懒加载
    if (loading === 'lazy') {
      img.dataset.src = optimizedImage.src;
      lazyImageManager.observeImage(img);
    }

    // 监听加载事件
    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [optimizedImage, loading, onLoad, onError]);

  if (!optimizedImage) {
    return (
      <div 
        className={`image-placeholder ${className}`}
        style={{
          width: width || '100%',
          height: height || '200px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </div>
    );
  }

  const imageClasses = [
    className,
    isLoaded ? 'loaded' : '',
    hasError ? 'error' : '',
    loading === 'lazy' ? 'lazy' : '',
    'optimized-image'
  ].filter(Boolean).join(' ');

  const imageStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : placeholder === 'blur' ? 0.7 : 0.5
  };

  return (
    <div className="image-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* 占位符 */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
      )}

      {/* 主图片 */}
      <img
        ref={imgRef}
        src={loading === 'lazy' ? undefined : optimizedImage.src}
        data-src={loading === 'lazy' ? optimizedImage.src : undefined}
        srcSet={optimizedImage.srcSet}
        sizes={optimizedImage.sizes}
        alt={optimizedImage.alt}
        className={imageClasses}
        width={width}
        height={height}
        loading={optimizedImage.loading}
        decoding={optimizedImage.decoding}
        style={imageStyle}
      />

      {/* 错误状态 */}
      {hasError && (
        <div
          className="image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px'
          }}
        >
          <div className="text-center">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
            <div>图片加载失败</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 图片网格组件
 * 支持批量图片优化和懒加载
 */
interface ImageGridProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
  onImageClick?: (index: number) => void;
}

export const OptimizedImageGrid: React.FC<ImageGridProps> = ({
  images,
  columns = 3,
  gap = 16,
  className = '',
  onImageClick
}) => {
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImageResult[]>([]);

  useEffect(() => {
    // 批量优化图片
    imageOptimizer.optimizeImages(
      images.map(img => ({
        src: img.src,
        alt: img.alt,
        options: {
          formats: ['webp', 'jpg'],
          sizes: [320, 640, 1024],
          quality: 80,
          lazy: true,
          responsive: true
        }
      }))
    ).then(results => {
      setOptimizedImages(results);
    });
  }, [images]);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    width: '100%'
  };

  return (
    <div className={`optimized-image-grid ${className}`} style={gridStyle}>
      {optimizedImages.map((image, index) => (
        <div
          key={index}
          className="image-grid-item"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            cursor: onImageClick ? 'pointer' : 'default'
          }}
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={images[index].width}
            height={images[index].height}
            loading="lazy"
            placeholder="blur"
            objectFit="cover"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * 背景图片优化组件
 */
interface OptimizedBackgroundProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  options?: ImageOptimizationOptions;
}

export const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({
  src,
  alt,
  className = '',
  children,
  overlay = false,
  overlayOpacity = 0.5,
  options = {}
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    imageOptimizer.optimizeImage(src, alt, {
      formats: ['webp', 'jpg'],
      sizes: [1024, 1600],
      quality: 85,
      responsive: true,
      ...options
    }).then(result => {
      setBackgroundImage(result.src);
      
      // 预加载背景图片
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true); // 即使加载失败也显示内容
      img.src = result.src;
    });
  }, [src, alt, options]);

  const backgroundStyle: React.CSSProperties = {
    position: 'relative',
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: isLoaded ? 1 : 0.7,
    transition: 'opacity 0.3s ease-in-out'
  };

  return (
    <div className={`optimized-background ${className}`} style={backgroundStyle}>
      {/* 遮罩层 */}
      {overlay && (
        <div
          className="background-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, ${overlayOpacity})',
            zIndex: 1
          }}
        />
      )}

      {/* 内容 */}
      <div
        className="background-content"
        style={{
          position: 'relative',
          zIndex: overlay ? 2 : 1
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default OptimizedImage;