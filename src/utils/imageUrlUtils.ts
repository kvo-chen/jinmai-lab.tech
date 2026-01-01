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
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';
  autoFormat?: boolean;
  responsive?: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  crop?: string;
  dpr?: number;
  sharpen?: boolean;
  blur?: number;
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
 * 检测浏览器是否支持特定图片格式
 * @param format 图片格式
 * @returns 是否支持该格式
 */
export function supportsFormat(format: 'webp' | 'avif' | 'jpeg' | 'png'): boolean {
  if (typeof window === 'undefined') {
    return true; // 服务端渲染默认支持所有格式
  }
  
  // 常见格式直接返回true
  if (format === 'jpeg' || format === 'png') {
    return true;
  }
  
  // 检测WebP和AVIF格式
  try {
    const img = new Image();
    const testFormat = format === 'webp' ? 'image/webp' : 'image/avif';
    return img.srcset?.includes?.(format) !== undefined || (window as any).createImageBitmap || (img as any).canPlayType?.(testFormat) === 'probably';
  } catch {
    return false;
  }
}

/**
 * 检测浏览器是否支持WebP格式
 * @returns 是否支持WebP
 */
export function supportsWebP(): boolean {
  return supportsFormat('webp');
}

/**
 * 检测浏览器是否支持AVIF格式
 * @returns 是否支持AVIF
 */
export function supportsAVIF(): boolean {
  return supportsFormat('avif');
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
  // 快速返回简单情况
  if (!url) {
    console.warn('Empty URL provided to processImageUrl');
    return url;
  }
  
  // 直接返回base64图片
  if (url.startsWith('data:')) {
    return url;
  }
  
  try {
    // 只在需要时合并选项
    const defaultOptions: Required<ImageProcessingOptions> = {
      quality: 'medium',
      width: 800,
      height: 600,
      format: 'jpeg',
      autoFormat: true,
      responsive: true,
      fit: 'cover',
      crop: 'center',
      dpr: window.devicePixelRatio || 1,
      sharpen: false,
      blur: 0
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // 直接返回相对路径和API代理URL，让服务器端处理
    if (url.startsWith('/')) {
      // 对于相对路径和API代理URL，直接返回，服务器会处理请求
      return url;
    }
    
    // 检查是否为完整URL格式
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      // 如果URL格式无效，直接返回原始URL
      console.warn('Invalid URL format, returning original:', url, error);
      return url;
    }
    
    // 检查是否为已知的CDN主机，转换为API代理URL
    // 已知CDN主机列表
    const knownCdnHostsForApiProxy = [
      'trae-api-sg.mchost.guru',
      'jinmalab.tech'
    ];
    
    // 对于已知的CDN主机，转换为API代理URL
    if (knownCdnHostsForApiProxy.some(host => urlObj.hostname.includes(host))) {
      // 构建API代理URL
      const apiProxyUrl = `/api/proxy/trae-api${urlObj.pathname}${urlObj.search}`;
      return apiProxyUrl;
    }
    
    // 预计算共享值
    const quality = qualityToValue(opts.quality);
    const size = opts.responsive 
      ? calculateResponsiveSize(opts.width, opts.height)
      : { width: opts.width, height: opts.height };
    
    let format = opts.format;
    if (opts.autoFormat) {
      if (supportsAVIF()) {
        format = 'avif';
      } else if (supportsWebP()) {
        format = 'webp';
      }
    }
    
    // Unsplash图片处理
    if (urlObj.hostname.includes('unsplash.com')) {
      const newUrl = new URL(urlObj.href);
      newUrl.searchParams.set('q', quality.toString());
      newUrl.searchParams.set('w', size.width.toString());
      newUrl.searchParams.set('h', size.height.toString());
      newUrl.searchParams.set('fm', format);
      newUrl.searchParams.set('fit', opts.fit);
      newUrl.searchParams.set('crop', opts.crop);
      newUrl.searchParams.set('dpr', opts.dpr.toString());
      
      if (opts.sharpen) newUrl.searchParams.set('sharp', '1');
      if (opts.blur > 0) newUrl.searchParams.set('blur', opts.blur.toString());
      
      return newUrl.toString();
    }
    
    // Imgix CDN处理
    if (urlObj.hostname.includes('imgix.net')) {
      const newUrl = new URL(urlObj.href);
      newUrl.searchParams.set('q', quality.toString());
      newUrl.searchParams.set('w', size.width.toString());
      newUrl.searchParams.set('h', size.height.toString());
      newUrl.searchParams.set('fit', opts.fit);
      newUrl.searchParams.set('crop', opts.crop);
      
      if (format) newUrl.searchParams.set('fm', format);
      
      return newUrl.toString();
    }
    
    // Cloudinary CDN处理
    if (urlObj.hostname.includes('cloudinary.com')) {
      const newUrl = new URL(urlObj.href);
      const pathParts = urlObj.pathname.split('/');
      const uploadIndex = pathParts.indexOf('upload');
      
      if (uploadIndex !== -1) {
        const transformations = [
          `w_${size.width}`,
          `h_${size.height}`,
          `c_${opts.fit}`,
          opts.autoFormat ? 'f_auto' : `f_${format}`,
          `q_${quality}`
        ];
        
        pathParts.splice(uploadIndex + 1, 0, ...transformations);
        newUrl.pathname = pathParts.join('/');
      }
      
      return newUrl.toString();
    }
    
    // 已知CDN主机列表（优化：使用Set提高查找效率）
    const knownCdnHosts = new Set([
      'trae-api-sg.mchost.guru',
      'jinmalab.tech',
      'cdn.jsdelivr.net',
      'cdnjs.cloudflare.com',
      'unpkg.com',
      'cloudflare-ipfs.com',
      'ipfs.io',
      'akamaihd.net',
      'fastly.net',
      's3.amazonaws.com',
      's3.us-east-1.amazonaws.com',
      's3.us-west-2.amazonaws.com',
      's3.ap-southeast-1.amazonaws.com'
    ]);
    
    // CDN URL处理
    if (knownCdnHosts.has(urlObj.hostname)) {
      const newUrl = new URL(url);
      
      if (!newUrl.searchParams.has('cache')) newUrl.searchParams.set('cache', 'true');
      if (!newUrl.searchParams.has('max_width')) newUrl.searchParams.set('max_width', opts.width.toString());
      if (!newUrl.searchParams.has('quality')) newUrl.searchParams.set('quality', quality.toString());
      
      if (opts.autoFormat) {
        if (supportsAVIF()) {
          newUrl.searchParams.set('format', 'avif');
        } else if (supportsWebP()) {
          newUrl.searchParams.set('format', 'webp');
        }
      } else if (opts.format) {
        newUrl.searchParams.set('format', opts.format);
      }
      
      return newUrl.toString();
    }
    
    // 其他URL直接返回，避免不必要的处理
    return url;
  } catch (error) {
    console.warn('Unexpected error processing URL, returning original:', url, error);
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
  
  // 对于API代理URL，不生成srcSet，直接返回空字符串
  // 因为API代理已经返回了适当格式和尺寸的图片
  if (url.startsWith('/api/proxy/')) {
    return '';
  }
  
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

/**
 * 优化CDN路径，选择最优的CDN节点
 * @param url 原始图片URL
 * @returns 优化后的CDN URL
 */
export function optimizeCdnPath(url: string): string {
  if (!url) return url;
  
  // 这里可以添加CDN路径优化逻辑，例如：
  // 1. 根据用户地理位置选择最近的CDN节点
  // 2. 选择性能更好的CDN提供商
  // 3. 添加CDN负载均衡逻辑
  
  // 示例：为unsplash图片添加多个CDN备用
  if (url.includes('images.unsplash.com')) {
    // 可以根据需要添加其他CDN节点
    return url;
  }
  
  // 示例：为trae-api图片添加CDN优化
  if (url.includes('trae-api-sg.mchost.guru')) {
    // 可以添加CDN缓存优化
    const newUrl = new URL(url);
    newUrl.searchParams.set('cdn-optimized', 'true');
    return newUrl.toString();
  }
  
  return url;
}