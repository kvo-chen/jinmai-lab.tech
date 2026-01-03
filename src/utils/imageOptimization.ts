/**
 * 图片优化工具
 * 提供图片格式转换、压缩、懒加载等功能
 */

export interface ImageOptimizationOptions {
  formats?: string[];
  sizes?: number[];
  quality?: number;
  lazy?: boolean;
  preload?: boolean;
  responsive?: boolean;
}

export interface OptimizedImageResult {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * 图片优化管理器
 */
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private supportedFormats: Set<string> = new Set();
  private optimizationCache: Map<string, OptimizedImageResult> = new Map();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  private constructor() {
    this.detectSupportedFormats();
  }

  /**
   * 检测浏览器支持的图片格式
   */
  private detectSupportedFormats(): void {
    if (typeof window === 'undefined') return;

    // WebP支持检测
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      if (webP.width === 1) {
        this.supportedFormats.add('webp');
      }
    };
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/v9U/5g=';

    // AVIF支持检测
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      if (avif.width === 1) {
        this.supportedFormats.add('avif');
      }
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAAEGF2MUOBAAAAAAAAFWF2MUOCAAAACQYBAAEAAAAAABhhdmNCAAAA';
  }

  /**
   * 优化图片
   */
  async optimizeImage(
    src: string,
    alt: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      formats = ['avif', 'webp', 'jpg'],
      sizes = [320, 640, 1024, 1600],
      quality = 85,
      lazy = true,
      preload = false,
      responsive = true
    } = options;

    // 检查缓存
    const cacheKey = `${src}_${JSON.stringify(options)}`;
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    // 生成优化的图片结果
    const result = this.generateOptimizedImage(src, alt, {
      formats,
      sizes,
      quality,
      lazy,
      preload,
      responsive
    });

    // 缓存结果
    this.optimizationCache.set(cacheKey, result);

    // 预加载关键图片
    if (preload) {
      this.preloadImage(result.src);
    }

    return result;
  }

  /**
   * 生成优化的图片
   */
  private generateOptimizedImage(
    src: string,
    alt: string,
    options: Required<ImageOptimizationOptions>
  ): OptimizedImageResult {
    const { formats, sizes, quality, lazy, responsive } = options;
    
    // 获取支持的格式（按优先级排序）
    const supportedFormats = formats.filter(format => 
      format === 'jpg' || this.supportedFormats.has(format)
    );

    if (supportedFormats.length === 0) {
      supportedFormats.push('jpg'); // 回退到JPG
    }

    // 生成优化的URL
    const optimizedUrls = this.generateOptimizedUrls(src, supportedFormats, sizes, quality);
    
    // 生成srcSet和sizes
    const srcSet = responsive ? this.generateSrcSet(optimizedUrls, sizes) : undefined;
    const sizesAttr = responsive ? this.generateSizes(sizes) : undefined;

    // 选择最佳格式作为src
    const bestFormat = supportedFormats[0];
    const bestSize = sizes[Math.floor(sizes.length / 2)]; // 选择中等大小
    const bestUrl = optimizedUrls.get(`${bestFormat}_${bestSize}`) || src;

    return {
      src: bestUrl,
      srcSet,
      sizes: sizesAttr,
      alt,
      loading: lazy ? 'lazy' : 'eager',
      decoding: 'async'
    };
  }

  /**
   * 生成优化的URL
   */
  private generateOptimizedUrls(
    src: string,
    formats: string[],
    sizes: number[],
    quality: number
  ): Map<string, string> {
    const urls = new Map<string, string>();
    const baseUrl = this.getBaseUrl(src);
    const extension = this.getFileExtension(src);

    formats.forEach(format => {
      sizes.forEach(size => {
        const key = `${format}_${size}`;
        const optimizedUrl = this.buildOptimizedUrl(baseUrl, extension, format, size, quality);
        urls.set(key, optimizedUrl);
      });
    });

    return urls;
  }

  /**
   * 构建优化的URL
   */
  private buildOptimizedUrl(
    baseUrl: string,
    originalExtension: string,
    targetFormat: string,
    size: number,
    quality: number
  ): string {
    // 这里可以根据实际的图片服务API来构建URL
    // 例如使用Unsplash、Cloudinary等服务
    
    const url = new URL(baseUrl);
    
    // 添加优化参数
    if (targetFormat !== originalExtension) {
      url.searchParams.set('format', targetFormat);
    }
    
    url.searchParams.set('w', size.toString());
    url.searchParams.set('q', quality.toString());
    
    // 特殊处理Unsplash图片
    if (baseUrl.includes('unsplash.com')) {
      return this.buildUnsplashUrl(baseUrl, size, quality, targetFormat);
    }
    
    // 特殊处理其他CDN服务
    if (baseUrl.includes('cloudinary.com')) {
      return this.buildCloudinaryUrl(baseUrl, size, quality, targetFormat);
    }

    return url.toString();
  }

  /**
   * 构建Unsplash优化URL
   */
  private buildUnsplashUrl(url: string, size: number, quality: number, format: string): string {
    // Unsplash URL优化
    const match = url.match(/photo-([a-zA-Z0-9]+)/);
    if (match) {
      const photoId = match[1];
      return `https://images.unsplash.com/photo-${photoId}?w=${size}&h=${Math.floor(size * 0.75)}&fit=crop&auto=format&quality=${quality}`;
    }
    return url;
  }

  /**
   * 构建Cloudinary优化URL
   */
  private buildCloudinaryUrl(url: string, size: number, quality: number, format: string): string {
    // Cloudinary URL优化
    const transformations = [
      `w_${size}`,
      `q_${quality}`,
      `f_${format}`,
      'c_fill',
      'g_auto'
    ].join(',');
    
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  /**
   * 生成srcSet
   */
  private generateSrcSet(urls: Map<string, string>, sizes: number[]): string {
    const entries: string[] = [];
    
    sizes.forEach(size => {
      urls.forEach((url, key) => {
        if (key.endsWith(`_${size}`)) {
          const format = key.split('_')[0];
          entries.push(`${url} ${size}w`);
        }
      });
    });

    return entries.join(', ');
  }

  /**
   * 生成sizes属性
   */
  private generateSizes(sizes: number[]): string {
    const breakpoints = [
      { size: 320, media: '(max-width: 640px)' },
      { size: 640, media: '(max-width: 1024px)' },
      { size: 1024, media: '(max-width: 1600px)' },
      { size: 1600, media: '(min-width: 1601px)' }
    ];

    return breakpoints
      .filter(bp => sizes.includes(bp.size))
      .map(bp => `${bp.media} ${bp.size}px`)
      .join(', ');
  }

  /**
   * 获取基础URL
   */
  private getBaseUrl(src: string): string {
    try {
      return new URL(src).toString();
    } catch {
      // 相对路径处理
      if (typeof window !== 'undefined') {
        return new URL(src, window.location.origin).toString();
      }
      return src;
    }
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(url: string): string {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  /**
   * 预加载图片
   */
  private preloadImage(src: string): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }

  /**
   * 批量优化图片
   */
  async optimizeImages(
    images: Array<{ src: string; alt: string; options?: ImageOptimizationOptions }>
  ): Promise<OptimizedImageResult[]> {
    const promises = images.map(({ src, alt, options }) => 
      this.optimizeImage(src, alt, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.optimizationCache.clear();
  }

  /**
   * 获取支持的格式
   */
  getSupportedFormats(): string[] {
    return Array.from(this.supportedFormats);
  }
}

/**
 * 图片懒加载管理器
 */
export class LazyImageManager {
  private static instance: LazyImageManager;
  private observer: IntersectionObserver | null = null;
  private loadingImages: Set<string> = new Set();

  static getInstance(): LazyImageManager {
    if (!LazyImageManager.instance) {
      LazyImageManager.instance = new LazyImageManager();
    }
    return LazyImageManager.instance;
  }

  private constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * 设置Intersection Observer
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.01
      }
    );
  }

  /**
   * 观察图片元素
   */
  observeImage(img: HTMLImageElement): void {
    if (!this.observer) {
      // 降级方案：立即加载
      this.loadImage(img);
      return;
    }

    this.observer.observe(img);
  }

  /**
   * 加载图片
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src || this.loadingImages.has(src)) {
      return;
    }

    this.loadingImages.add(src);

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
      this.loadingImages.delete(src);
      
      // 触发加载完成事件
      img.dispatchEvent(new CustomEvent('imageLoaded'));
    };

    tempImg.onerror = () => {
      this.loadingImages.delete(src);
      img.classList.add('error');
      
      // 触发加载错误事件
      img.dispatchEvent(new CustomEvent('imageError'));
    };

    tempImg.src = src;
  }

  /**
   * 断开观察器
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 导出单例实例
export const imageOptimizer = ImageOptimizer.getInstance();
export const lazyImageManager = LazyImageManager.getInstance();

// 默认导出
export default imageOptimizer;