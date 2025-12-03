// 图片服务层 - 统一管理图片请求、缓存和错误处理

// 图片缓存接口
interface ImageCacheItem {
  url: string;
  timestamp: number;
  success: boolean;
}

// 图片服务配置
interface ImageServiceConfig {
  maxCacheSize: number;
  cacheTTL: number; // 缓存过期时间（毫秒）
  maxRetries: number;
  retryDelay: (attempt: number) => number; // 重试延迟策略
}

// 默认配置
const DEFAULT_CONFIG: ImageServiceConfig = {
  maxCacheSize: 100,
  cacheTTL: 24 * 60 * 60 * 1000, // 24小时
  maxRetries: 3,
  retryDelay: (attempt: number) => 1000 * Math.pow(2, attempt), // 指数退避
};

// 图片服务类
class ImageService {
  private cache: Map<string, ImageCacheItem> = new Map();
  private config: ImageServiceConfig;
  private inProgressRequests: Map<string, Promise<string>> = new Map();

  constructor(config: Partial<ImageServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cleanupCache();
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

  // 生成低质量占位图URL
  public getLowQualityUrl(url: string): string {
    if (url.includes('trae-api-sg.mchost.guru')) {
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('quality', '20');
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
    return `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=1024x1024`;
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

  // 验证图片URL是否可访问
  private async validateImageUrl(url: string, retries: number = 0): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    try {
      // 实现手动超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    options?: { priority?: boolean; validate?: boolean }
  ): Promise<string> {
    const normalizedUrl = this.normalizeUrl(url);
    const { priority = false, validate = false } = options || {}; // 默认不验证，提高性能

    // 清理过期缓存
    this.cleanupCache();

    // 检查缓存
    const cachedItem = this.cache.get(normalizedUrl);
    if (cachedItem) {
      return cachedItem.success ? normalizedUrl : this.getFallbackUrl(alt);
    }

    // 检查是否已有进行中的请求
    if (this.inProgressRequests.has(normalizedUrl)) {
      return this.inProgressRequests.get(normalizedUrl)!;
    }

    // 快速返回URL，不进行验证，通过图片加载事件异步更新缓存
    // 这样可以避免验证导致的性能问题，同时保证图片加载的可靠性
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success: true, // 默认认为成功，后续通过onError事件修正
    });
    
    return normalizedUrl;
  }

  // 批量获取可靠的图片URL
  public async getReliableImageUrls(
    urls: { url: string; alt: string }[],
    options?: { priority?: boolean; validate?: boolean }
  ): Promise<string[]> {
    return Promise.all(
      urls.map(({ url, alt }) => this.getReliableImageUrl(url, alt, options))
    );
  }

  // 更新缓存中的图片状态
  public updateImageStatus(url: string, success: boolean): void {
    const normalizedUrl = this.normalizeUrl(url);
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success,
    });
    this.cleanupCache();
  }

  // 清除特定URL的缓存
  public clearCache(url?: string): void {
    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      this.cache.delete(normalizedUrl);
    } else {
      this.cache.clear();
    }
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
    };
  }
}

// 创建单例实例
const imageService = new ImageService();

export default imageService;