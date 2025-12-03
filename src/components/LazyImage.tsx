import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '', 
  width, 
  height, 
  onLoad, 
  onError 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 图片进入视口，开始加载
              img.src = src;
              observerRef.current?.unobserve(img);
            }
          });
        },
        {
          // 提前 100px 开始加载
          rootMargin: '100px 0px',
          // 当图片 10% 进入视口时开始加载
          threshold: 0.1
        }
      );

      observerRef.current.observe(img);
    } else {
      // 不支持 Intersection Observer，直接加载图片
      img.src = src;
    }

    return () => {
      if (observerRef.current && img) {
        observerRef.current.unobserve(img);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
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
      {/* 加载占位符 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 图片 */}
      <img
        ref={imgRef}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-opacity duration-300 ease-in-out',
          isLoaded ? 'opacity-100' : 'opacity-0',
          isError ? 'hidden' : '',
          className
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
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