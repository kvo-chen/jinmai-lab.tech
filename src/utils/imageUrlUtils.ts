// 处理图片URL的工具函数

/**
 * 图片质量等级
 */
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * 图片尺寸配置
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 图片处理选项
 */
export interface ImageProcessingOptions {
  quality?: ImageQuality;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
  autoFormat?: boolean;
  responsive?: boolean;
}

/**
 * 将质量等级转换为具体的质量数值
 * @param quality 质量等级
 * @returns 质量数值 (0-100)
 */
export function qualityToValue(quality: ImageQuality): number {
  switch (quality) {
    case 'low':
      return 60;
    case 'medium':
      return 80;
    case 'high':
      return 95;
    default:
      return 80;
  }
}

/**
 * 检测浏览器是否支持WebP格式
 * @returns 是否支持WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') {
    return true; // 服务端渲染默认支持
  }
  
  // 检查浏览器是否支持WebP
  try {
    const img = new Image();
    return img.srcset?.includes?.('webp') !== undefined || (window as any).createImageBitmap;
  } catch {
    return false;
  }
}

/**
 * 根据设备像素比和屏幕尺寸计算合适的图片尺寸
 * @param baseWidth 基础宽度
 * @param baseHeight 基础高度
 * @returns 计算后的图片尺寸
 */
export function calculateResponsiveSize(baseWidth: number, baseHeight: number): ImageSize {
  if (typeof window === 'undefined') {
    return { width: baseWidth, height: baseHeight };
  }
  
  // 获取设备像素比
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // 最大支持2x
  
  // 获取屏幕宽度
  const screenWidth = window.innerWidth;
  
  // 根据屏幕宽度调整图片尺寸
  let scaleFactor = 1;
  if (screenWidth < 640) {
    // 移动端
    scaleFactor = 0.75;
  } else if (screenWidth < 1024) {
    // 平板
    scaleFactor = 1;
  }
  
  // 计算最终尺寸
  const width = Math.round(baseWidth * scaleFactor * dpr);
  const height = Math.round(baseHeight * scaleFactor * dpr);
  
  return { width, height };
}

/**
 * 处理图片URL，添加压缩和格式转换支持
 * @param url 原始图片URL
 * @param options 图片处理选项
 * @returns 处理后的图片URL
 */
export function processImageUrl(url: string, options: ImageProcessingOptions = {}): string {
  if (!url) {
    console.warn('Empty URL provided to processImageUrl');
    return url;
  }
  
  try {
    // 默认选项
    const defaultOptions: Required<ImageProcessingOptions> = {
      quality: 'medium',
      width: 800,
      height: 600,
      format: 'jpeg',
      autoFormat: true,
      responsive: true
    };
    
    // 合并选项
    const opts = { ...defaultOptions, ...options };
    
    // 检查是否为base64编码的图片数据
    if (url.startsWith('data:')) {
      // 直接返回原始URL，不进行额外处理
      return url;
    }
    
    // 检查是否为API代理URL
    if (url.startsWith('/api/proxy/')) {
      // API代理URL处理，直接返回原始URL，避免添加不必要的参数或转换
      return url;
    } else if (url.startsWith('/api/proxy/unsplash')) {
        // 对于Unsplash代理，直接返回原始URL，Vercel会处理
        return url;
      }
      
      // 其他代理URL，直接返回原始URL
      return url;
    }
    
    // 检查是否为相对路径
    if (url.startsWith('/')) {
      // 对于相对路径，直接返回，Vercel会自动处理
      return url;
    }
    
    // 检查是否为有效的URL格式
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      // 如果URL格式无效，直接返回原始URL，不进行额外处理
      console.warn('Invalid URL format, returning original:', url, error);
      return url;
    }
    
    // 检查是否为Unsplash图片URL
    if (urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com')) {
      // 为Unsplash图片添加压缩和格式参数
      const quality = qualityToValue(opts.quality);
      
      // 响应式尺寸计算
      const size = opts.responsive 
        ? calculateResponsiveSize(opts.width, opts.height)
        : { width: opts.width, height: opts.height };
      
      // 自动格式检测
      const format = opts.autoFormat && supportsWebP() ? 'webp' : opts.format;
      
      // 构建新的Unsplash URL，添加压缩和格式参数
      const newUrl = new URL(urlObj.href);
      newUrl.searchParams.set('q', quality.toString());
      newUrl.searchParams.set('w', size.width.toString());
      newUrl.searchParams.set('h', size.height.toString());
      newUrl.searchParams.set('fm', format);
      newUrl.searchParams.set('fit', 'crop');
      
      return newUrl.toString();
    }
    
    // 检查是否为已知的代理URL
    if (url.includes('trae-api-sg.mchost.guru')) {
      // 直接返回原始URL，不进行静态环境检测
      return url;
    }
    
    // 处理 https://jinmalab.tech/proxy?url=... 格式的URL
    if (urlObj.hostname === 'jinmalab.tech' && urlObj.pathname === '/proxy') {
      // 提取查询参数中的真实图片URL
      const realUrl = urlObj.searchParams.get('url');
      if (realUrl) {
        try {
          const realUrlObj = new URL(realUrl);
          // 根据真实URL的主机名选择合适的代理路径
          if (realUrlObj.hostname.includes('unsplash.com') || realUrlObj.hostname.includes('images.unsplash.com')) {
            return `/jinmai-lab/api/proxy/unsplash${realUrlObj.pathname}${realUrlObj.search}`;
          }
          // 对于其他URL，直接返回真实URL
          return realUrl;
        } catch (error) {
          console.warn('Invalid real URL in proxy format, returning original:', realUrl, error);
          return realUrl || url;
        }
      }
    }
    
    // 其他URL保持不变
    return url;
  } catch (error) {
    console.warn('Unexpected error processing URL, returning original:', url, error);
    // 对于任何错误，返回原始URL，而不是空字符串，确保图片能够尝试加载
    return url;
  }
}

/**
 * 批量处理图片URL数组
 * @param urls 原始图片URL数组
 * @param options 图片处理选项
 * @returns 处理后的图片URL数组
 */
export function processImageUrls(urls: string[], options: ImageProcessingOptions = {}): string[] {
  return urls.map(url => processImageUrl(url, options));
}

/**
 * 构建响应式图片srcset属性
 * @param url 基础图片URL
 * @param widths 宽度数组
 * @param quality 质量等级
 * @returns srcset属性值
 */
export function buildSrcSet(url: string, widths: number[], quality: ImageQuality = 'medium'): string {
  if (!url || !widths || widths.length === 0) {
    return '';
  }
  
  // 检测是否支持WebP
  const useWebP = supportsWebP();
  const qualityValue = qualityToValue(quality);
  
  return widths
    .map(width => {
      // 为每个宽度构建URL
      const sizedUrl = processImageUrl(url, { 
        width, 
        quality, 
        autoFormat: true 
      });
      return `${sizedUrl} ${width}w`;
    })
    .join(', ');
}