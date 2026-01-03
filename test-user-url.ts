import { processImageUrl } from './src/utils/imageUrlUtils';

// 测试用户提到的URL
const userUrl = 'https://jinmai-lab-tech-ek5m356e8-kvos-projects.vercel.app/explore?q=%E4%BC%A0%E7%BB%9F%E5%B7%A5%E8%89%BA%E6%95%B0%E5%AD%97%E5%8C%96';

console.log('=== 测试用户URL处理 ===');
console.log(`原始URL: ${userUrl}`);
console.log(`处理后URL: ${processImageUrl(userUrl)}`);
console.log('\n=== 测试其他相关URL ===');

// 测试各种类型的URL
const testUrls = [
  // Vercel相关URL
  'https://jinmai-lab-tech-ek5m356e8-kvos-projects.vercel.app/explore?q=%E4%BC%A0%E7%BB%9F%E5%B7%A5%E8%89%BA%E6%95%B0%E5%AD%97%E5%8C%96',
  'https://example.vercel.app/image.jpg',
  'https://another-site.vercel.app/path/to/resource',
  
  // 其他外部URL
  'https://google.com',
  'https://github.com/user/repo',
  
  // 图片URL
  'https://images.unsplash.com/photo-1234567890.jpg',
  'https://raw.githubusercontent.com/user/repo/image.png',
  
  // 内部URL
  '/images/avatar.jpg',
  '/api/proxy/https://example.com/image.jpg'
];

testUrls.forEach((url, index) => {
  console.log(`\n测试 ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  try {
    const result = processImageUrl(url);
    console.log(`处理后URL: ${result}`);
    console.log(`URL是否改变: ${result !== url}`);
  } catch (error) {
    console.error(`处理出错: ${error}`);
  }
});