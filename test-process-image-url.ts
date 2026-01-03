// 简单测试脚本，直接测试processImageUrl函数
// 因为这是一个简单的测试，我们可以直接实现一个简化版的processImageUrl函数

// 简化版的processImageUrl函数，仅包含我们修改的核心逻辑
function testProcessImageUrl(url: string): string {
  if (!url) {
    return '';
  }
  
  try {
    // 检查是否为base64编码的图片数据
    if (url.startsWith('data:')) {
      return url;
    }
    
    // 检查是否为API代理URL
    if (url.startsWith('/api/proxy/') || url.startsWith('http://localhost:3001/api/proxy/')) {
      return url;
    }
    
    // 检查是否为相对路径
    if (url.startsWith('/')) {
      return url;
    }
    
    // 解析URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      return url;
    }
    
    // 检查是否为图片URL
    // 1. 检查是否有明确的图片扩展名
    const hasImageExtension = urlObj.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i);
    
    // 2. 检查是否为已知的图片服务
    const isKnownImageService = [
      'unsplash.com',
      'images.unsplash.com',
      'picsum.photos',
      'images.pexels.com',
      'pixabay.com',
      'cdn.pixabay.com',
      'i.imgur.com',
      'imgur.com'
    ].some(domain => urlObj.hostname.includes(domain));
    
    // 3. 检查是否为API代理URL，这些URL可能指向图片
    const isApiProxyUrl = url.startsWith('/api/proxy/') || url.startsWith('http://localhost:3001/api/proxy/');
    
    // 只处理图片URL，非图片URL直接返回原始URL
    if (!hasImageExtension && !isKnownImageService && !isApiProxyUrl) {
      console.log(`❌ 非图片URL: ${url}`);
      return url;
    }
    
    // 检查是否为Unsplash图片URL
    if ((urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com'))) {
      // 为所有Unsplash图片添加压缩和格式参数
      const newUrl = new URL(urlObj.href);
      newUrl.searchParams.set('q', '80'); // 质量
      newUrl.searchParams.set('w', '800'); // 宽度
      newUrl.searchParams.set('h', '600'); // 高度
      newUrl.searchParams.set('fm', 'webp'); // 格式
      newUrl.searchParams.set('fit', 'crop'); // 填充方式
      
      console.log(`✅ Unsplash图片处理成功: ${url}`);
      return newUrl.toString();
    }
    
    // 检查是否为Picsum图片URL
    if (urlObj.hostname.includes('picsum.photos')) {
      // Picsum图片URL保持不变或根据需要处理
      console.log(`✅ Picsum图片处理成功: ${url}`);
      return url;
    }
    
    // 其他图片URL
    console.log(`✅ 其他图片处理成功: ${url}`);
    return url;
    
  } catch (error) {
    console.error(`❌ 处理出错: ${url}`, error);
    return url;
  }
}

// 测试mock数据中的图片URL
const mockImageUrls = [
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
  'https://picsum.photos/100/100?random=1',
  'https://picsum.photos/800/600?random=2',
  // 测试非图片URL
  'https://jinmai-lab-tech-ek5m356e8-kvos-projects.vercel.app/explore?q=%E4%BC%A0%E7%BB%9F%E5%B7%A5%E8%89%BA%E6%95%B0%E5%AD%97%E5%8C%96'
];

console.log('=== 测试图片URL处理 ===\n');

mockImageUrls.forEach((url, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  const result = testProcessImageUrl(url);
  console.log(`处理后URL: ${result}`);
  console.log(`URL是否改变: ${result !== url}`);
  console.log('---\n');
});

console.log('=== 测试完成 ===');