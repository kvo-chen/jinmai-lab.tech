// 处理图片URL的工具函数

/**
 * 将Unsplash图片URL转换为使用代理的URL，避免ORB（Origin Restricted Blocking）错误
 * @param url 原始图片URL
 * @returns 处理后的图片URL
 */
export function processImageUrl(url: string): string {
  if (!url) {
    console.warn('Empty URL provided to processImageUrl');
    return url;
  }
  
  try {
    // 检查是否为base64编码的图片数据
    if (url.startsWith('data:')) {
      // 直接返回原始URL，不进行额外处理
      return url;
    }
    
    // 检查是否为API代理URL，在静态环境下替换为可靠的图片URL
    if (url.startsWith('/api/proxy/')) {
      // 检测是否为静态环境（GitHub Pages）
      const isStaticEnv = window.location.hostname.includes('github.io') || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app');
      
      if (isStaticEnv) {
        // 在静态环境下，将API代理URL替换为picsum.photos的随机图片
        // 提取prompt参数用于生成更相关的图片
        let prompt = 'design';
        try {
          const urlObj = new URL(url, window.location.origin);
          const promptMatch = urlObj.search.match(/prompt=([^&]+)/);
          if (promptMatch && promptMatch[1]) {
            prompt = decodeURIComponent(promptMatch[1]);
          }
        } catch (error) {
          // 忽略URL解析错误
        }
        
        // 使用picsum.photos生成随机图片，使用id参数确保每张图片不同
        const randomId = Math.floor(Math.random() * 1000);
        return `https://picsum.photos/seed/${randomId}-${encodeURIComponent(prompt)}/800/600`;
      }
      
      // 在非静态环境下，返回原始代理URL
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
      // 直接返回原始URL，不使用代理
      return url;
    }
    
    // 检查是否为已知的代理URL
    if (url.includes('trae-api-sg.mchost.guru')) {
      // 检测是否为静态环境
      const isStaticEnv = window.location.hostname.includes('github.io') || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app');
      
      if (isStaticEnv) {
        // 在静态环境下，替换为picsum.photos图片
        const randomId = Math.floor(Math.random() * 1000);
        return `https://picsum.photos/seed/${randomId}-trae/800/600`;
      }
      
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
 * @returns 处理后的图片URL数组
 */
export function processImageUrls(urls: string[]): string[] {
  return urls.map(processImageUrl);
}