// 图片服务层 - 统一管理图片请求、缓存和错误处理

// 图片缓存接口
interface ImageCacheItem {
  url: string;
  timestamp: number;
  success: boolean;
  loadTime?: number; // 加载时间（毫秒）
  size?: number; // 图片大小（字节）
}

// 图片服务配置
interface ImageServiceConfig {
  maxCacheSize: number;
  cacheTTL: number; // 缓存过期时间（毫秒）
  maxRetries: number;
  retryDelay: (attempt: number) => number; // 重试延迟策略
  preloadDistance: number; // 预加载距离（像素）
  enableWebP: boolean; // 是否启用WebP格式
}

// 响应式图片尺寸选项
const RESPONSIVE_SIZES = {
  sm: { width: 320, quality: 70 },
  md: { width: 640, quality: 80 },
  lg: { width: 1200, quality: 90 },
  xl: { width: 1920, quality: 95 },
};

// 默认配置
const DEFAULT_CONFIG: ImageServiceConfig = {
  maxCacheSize: 200, // 增加缓存大小
  cacheTTL: 24 * 60 * 60 * 1000, // 24小时
  maxRetries: 3,
  retryDelay: (attempt: number) => 500 * Math.pow(2, attempt), // 更快的重试策略
  preloadDistance: 200, // 预加载距离
  enableWebP: true, // 启用WebP格式
};

// 图片服务类
class ImageService {
  private cache: Map<string, ImageCacheItem> = new Map();
  private config: ImageServiceConfig;
  private inProgressRequests: Map<string, Promise<string>> = new Map();
  private preloadedUrls: Set<string> = new Set();
  private preloadObserver: IntersectionObserver | null = null;
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    loadSuccess: 0,
    loadFailed: 0,
  };

  constructor(config: Partial<ImageServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cleanupCache();
    this.initPreloadObserver();
  }

  // 初始化预加载观察者
  private initPreloadObserver(): void {
    if ('IntersectionObserver' in window) {
      this.preloadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 元素进入预加载区域，预加载图片
              const imgUrl = entry.target.getAttribute('data-preload-img');
              if (imgUrl) {
                this.preloadImage(imgUrl);
              }
              this.preloadObserver?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: `${this.config.preloadDistance}px 0px`,
          threshold: 0,
        }
      );
    }
  }

  // 清理过期缓存
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
      }
    }

    // 如果缓存超过最大大小，删除最旧的条目
    while (this.cache.size > this.config.maxCacheSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  // 生成标准化的图片URL
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 移除不必要的参数或标准化参数顺序
      const params = new URLSearchParams(urlObj.search);
      params.sort();
      urlObj.search = params.toString();
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // 生成响应式图片URL
  public getResponsiveUrl(url: string, size: keyof typeof RESPONSIVE_SIZES = 'md', quality?: number): string {
    if (url.includes('trae-api-sg.mchost.guru')) {
      try {
        const urlObj = new URL(url);
        const responsiveConfig = RESPONSIVE_SIZES[size];
        const finalQuality = quality || responsiveConfig.quality;
        
        urlObj.searchParams.set('quality', finalQuality.toString());
        urlObj.searchParams.set('width', responsiveConfig.width.toString());
        
        // 启用WebP格式
        if (this.config.enableWebP && !urlObj.searchParams.has('format')) {
          urlObj.searchParams.set('format', 'webp');
        }
        
        return urlObj.toString();
      } catch {
        return url;
      }
    }
    return url;
  }

  // 生成低质量占位图URL
  public getLowQualityUrl(url: string): string {
    if (url.includes('trae-api-sg.mchost.guru')) {
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('quality', '20');
        urlObj.searchParams.set('width', '200');
        
        // 启用WebP格式
        if (this.config.enableWebP && !urlObj.searchParams.has('format')) {
          urlObj.searchParams.set('format', 'webp');
        }
        
        return urlObj.toString();
      } catch {
        return url;
      }
    }
    return url;
  }

  // 生成备用图片URL
  public getFallbackUrl(alt: string): string {
    const prompt = encodeURIComponent(`Beautiful ${alt} design, colorful, high quality`);
    let url = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=1024x1024`;
    
    // 启用WebP格式
    if (this.config.enableWebP) {
      url += '&format=webp';
    }
    
    return url;
  }

  // 检查URL是否为有效图片URL
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // 预加载图片
  public preloadImage(url: string): void {
    if (this.preloadedUrls.has(url)) {
      return;
    }
    
    this.preloadedUrls.add(url);
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.updateImageStatus(url, true, img.naturalWidth * img.naturalHeight);
    };
    img.onerror = () => {
      this.updateImageStatus(url, false);
    };
  }

  // 批量预加载图片
  public preloadImages(urls: string[]): void {
    urls.forEach(url => this.preloadImage(url));
  }

  // 观察元素以进行图片预加载
  public observeForPreload(element: HTMLElement, imgUrl: string): void {
    if (this.preloadObserver) {
      element.setAttribute('data-preload-img', imgUrl);
      this.preloadObserver.observe(element);
    }
  }

  // 验证图片URL是否可访问
  private async validateImageUrl(url: string, retries: number = 0): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    try {
      // 实现手动超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 缩短超时时间

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      return response.ok && (contentType?.startsWith('image/') || false);
    } catch (error) {
      if (retries < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay(retries)));
        return this.validateImageUrl(url, retries + 1);
      }
      return false;
    }
  }

  // 获取可靠的图片URL（包含验证和重试逻辑）
  public async getReliableImageUrl(
    url: string,
    alt: string,
    options?: { priority?: boolean; validate?: boolean; size?: keyof typeof RESPONSIVE_SIZES; quality?: number }
  ): Promise<string> {
    const normalizedUrl = this.normalizeUrl(url);
    const { 
      priority = false, 
      validate = false, 
      size = 'md',
      quality 
    } = options || {};

    this.stats.totalRequests++;

    // 清理过期缓存
    this.cleanupCache();

    // 检查缓存
    const cachedItem = this.cache.get(normalizedUrl);
    if (cachedItem) {
      this.stats.cacheHits++;
      return cachedItem.success ? this.getResponsiveUrl(normalizedUrl, size, quality) : this.getFallbackUrl(alt);
    }

    // 检查是否已有进行中的请求
    if (this.inProgressRequests.has(normalizedUrl)) {
      return this.inProgressRequests.get(normalizedUrl)!;
    }

    // 快速返回URL，不进行验证，通过图片加载事件异步更新缓存
    const finalUrl = this.getResponsiveUrl(normalizedUrl, size, quality);
    
    // 高优先级图片立即预加载
    if (priority) {
      this.preloadImage(finalUrl);
    }
    
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success: true, // 默认认为成功，后续通过onError事件修正
    });
    
    return finalUrl;
  }

  // 批量获取可靠的图片URL
  public async getReliableImageUrls(
    urls: { url: string; alt: string }[],
    options?: { priority?: boolean; validate?: boolean; size?: keyof typeof RESPONSIVE_SIZES; quality?: number }
  ): Promise<string[]> {
    return Promise.all(
      urls.map(({ url, alt }) => this.getReliableImageUrl(url, alt, options))
    );
  }

  // 更新缓存中的图片状态
  public updateImageStatus(url: string, success: boolean, size?: number): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    if (success) {
      this.stats.loadSuccess++;
    } else {
      this.stats.loadFailed++;
    }
    
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success,
      size,
    });
    this.cleanupCache();
  }

  // 清除特定URL的缓存
  public clearCache(url?: string): void {
    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      this.cache.delete(normalizedUrl);
      this.preloadedUrls.delete(normalizedUrl);
    } else {
      this.cache.clear();
      this.preloadedUrls.clear();
    }
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    successRate: number;
  } {
    const hitRate = this.stats.totalRequests > 0 
      ? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100) 
      : 0;
    
    const totalLoads = this.stats.loadSuccess + this.stats.loadFailed;
    const successRate = totalLoads > 0 
      ? Math.round((this.stats.loadSuccess / totalLoads) * 100) 
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate,
      successRate,
    };
  }

  // 获取性能统计信息
  public getPerformanceStats(): {
    totalRequests: number;
    cacheHits: number;
    loadSuccess: number;
    loadFailed: number;
  } {
    return { ...this.stats };
  }

  // 重置统计信息
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      loadSuccess: 0,
      loadFailed: 0,
    };
  }
}

// 创建单例实例
const imageService = new ImageService();

export default imageService;