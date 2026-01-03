// 测试脚本，验证图片URL转换为trae-api URL的功能
import { processImageUrl } from './src/utils/imageUrlUtils.js';

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
  try {
    const result = processImageUrl(url);
    console.log(`处理后URL: ${result}`);
    console.log(`是否转换为trae-api: ${result.startsWith('/api/proxy/trae-api')}`);
    console.log(`URL是否改变: ${result !== url}`);
  } catch (error) {
    console.error(`处理出错: ${error}`);
  }
  console.log('---\n');
});

console.log('=== 测试完成 ===');