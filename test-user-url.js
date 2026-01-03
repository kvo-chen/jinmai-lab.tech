const { processImageUrl } = require('./src/utils/imageUrlUtils');

// 测试用户提到的URL
const userUrl = 'https://jinmai-lab-tech-ek5m356e8-kvos-projects.vercel.app/explore?q=%E4%BC%A0%E7%BB%9F%E5%B7%A5%E8%89%BA%E6%95%B0%E5%AD%97%E5%8C%96';

console.log('=== 测试用户URL处理 ===');
console.log(`原始URL: ${userUrl}`);
console.log(`处理后URL: ${processImageUrl(userUrl)}`);
console.log(`URL是否保持不变: ${processImageUrl(userUrl) === userUrl}`);

console.log('\n=== 测试图片URL ===');
// 测试图片URL是否仍然正常处理
const imageUrl = 'https://images.unsplash.com/photo-1234567890.jpg';
console.log(`原始图片URL: ${imageUrl}`);
console.log(`处理后图片URL: ${processImageUrl(imageUrl)}`);
console.log(`图片URL是否被处理: ${processImageUrl(imageUrl) !== imageUrl}`);

console.log('\n=== 测试其他页面URL ===');
// 测试其他页面URL
const pageUrls = [
  'https://example.com',
  'https://example.com/path/to/page',
  'https://example.com/page?param=value',
  'https://jinmalab.tech/proxy?url=https://example.com/image.jpg'
];

pageUrls.forEach((url, index) => {
  console.log(`\n页面URL ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  console.log(`处理后URL: ${processImageUrl(url)}`);
  console.log(`URL是否保持不变: ${processImageUrl(url) === url}`);
});