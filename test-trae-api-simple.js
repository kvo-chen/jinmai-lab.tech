// 简化的测试脚本，直接测试核心逻辑

// 简化版的URL处理函数，仅包含我们修改的trae-api转换逻辑
function testProcessImageUrl(url) {
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
    
    // 检查是否为有效的URL格式
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
    
    // 3. 检查是否为API代理URL
    const isApiProxyUrl = url.startsWith('/api/proxy/') || url.startsWith('http://localhost:3001/api/proxy/');
    
    // 检查是否需要使用trae-api生成适配图片
    if (hasImageExtension && !isKnownImageService && !isApiProxyUrl && !url.startsWith('/') && !url.startsWith('data:')) {
      console.log(`✅ 转换URL为trae-api: ${url}`);
      
      // 生成简单的提示词
      let prompt = 'High quality image';
      
      // 尝试从URL路径中提取关键词
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const filenameWithoutExt = lastPart.replace(/\.[^/.]+$/, '');
        const keywords = filenameWithoutExt.replace(/[-_]/g, ' ');
        prompt = `${keywords}, high quality, detailed`;
      }
      
      // 构建trae-api URL
      const traeUrl = `/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=800x600&prompt=${encodeURIComponent(prompt)}`;
      return traeUrl;
    } else {
      console.log(`❌ 保持原始URL: ${url}`);
      return url;
    }
    
  } catch (error) {
    console.error(`处理出错: ${url}`, error);
    return url;
  }
}

// 测试用例
const testUrls = [
  // 普通图片URL，应该被转换为trae-api URL
  'https://example.com/image.jpg',
  'https://test.org/path/to/photo.png',
  'https://images.test.com/12345/landscape.webp',
  
  // Unsplash图片URL，应该被保留原始URL或添加参数
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
  
  // Picsum图片URL，应该被保留原始URL
  'https://picsum.photos/100/100?random=1',
  
  // API代理URL，应该被保留原始URL
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Test',
  
  // 相对路径URL，应该被保留原始URL
  '/images/avatar.jpg',
  
  // base64 URL，应该被保留原始URL
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
];

console.log('=== 测试trae-api URL转换功能 ===\n');

testUrls.forEach((url, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  const result = testProcessImageUrl(url);
  console.log(`处理后URL: ${result}`);
  console.log(`是否转换为trae-api: ${result.startsWith('/api/proxy/trae-api')}`);
  console.log(`URL是否改变: ${result !== url}`);
  console.log('---\n');
});

console.log('=== 测试完成 ===');