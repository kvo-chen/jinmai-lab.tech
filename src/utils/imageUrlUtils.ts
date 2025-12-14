// 处理图片URL的工具函数

/**
 * 将Unsplash图片URL转换为使用代理的URL，避免ORB（Origin Restricted Blocking）错误
 * @param url 原始图片URL
 * @returns 处理后的图片URL
 */
export function processImageUrl(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // 检查是否为Unsplash图片URL
    if (urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com')) {
      // 将Unsplash URL转换为使用代理的URL
      return `/api/proxy/unsplash${urlObj.pathname}${urlObj.search}`;
    }
    
    // 其他URL保持不变
    return url;
  } catch (error) {
    console.warn('Invalid URL format:', url, error);
    return url;
  }
}

/**
 * 批量处理图片URL数组
 * @param urls 原始图片URL数组
 * @returns 处理后的图片URL数组
 */
export function processImageUrls(urls: string[]): string[] {
  return urls.map(processImageUrl);
}
