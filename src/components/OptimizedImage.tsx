import React, { useState, useEffect, useRef } from 'react'
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
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  lazy = true,
  placeholder = 'blur',
  placeholderColor = '#f0f0f0',
  blurPlaceholder,
  progressive = true,
  errorSrc,
  onLoad,
  onError,
  className,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | undefined>(progressive ? undefined : src)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const hasTriggeredLoad = useRef(false)

  // 处理图片加载
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    hasTriggeredLoad.current = true
    onLoad?.()
  }

  // 处理图片加载错误
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsError(true)
    onError?.()
  }

  // 触发图片加载
  const triggerImageLoad = () => {
    if (!hasTriggeredLoad.current && src) {
      setImageSrc(src)
    }
  }

  // 设置IntersectionObserver进行懒加载
  useEffect(() => {
    if (lazy && src) {
      if ('IntersectionObserver' in window) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              triggerImageLoad()
              observerRef.current?.unobserve(entries[0].target)
            }
          },
          { rootMargin: '100px' } // 提前100px开始加载
        )

        if (imgRef.current) {
          observerRef.current.observe(imgRef.current)
        }
      } else {
        // 降级方案：直接加载图片
        triggerImageLoad()
      }
    } else if (src) {
      // 非懒加载，直接加载
      triggerImageLoad()
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current)
      }
    }
  }, [lazy, src])

  // 渲染占位符
  const renderPlaceholder = () => {
    if (isLoaded) return null

    switch (placeholder) {
      case 'blur':
        return blurPlaceholder ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={blurPlaceholder}
              alt={alt}
              className="w-full h-full object-cover filter blur-md"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: placeholderColor }}
          ></div>
        )
      case 'color':
        return (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: placeholderColor }}
          ></div>
        )
      case 'skeleton':
        return (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"></div>
        )
      default:
        return null
    }
  }

  // 最终显示的图片URL
  const finalSrc = isError ? errorSrc || src : imageSrc

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {renderPlaceholder()}
      <motion.img
        src={finalSrc}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{
          opacity: isLoaded ? 1 : 0,
          position: 'relative',
          zIndex: 1
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={lazy ? 'lazy' : 'eager'}
        {...rest}
      />
      {!isLoaded && !isError && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </motion.div>
      )}
    </div>
  )
}

export default OptimizedImage
