// 简单测试脚本，检查前几个作品的图片URL
import { mockWorks } from './src/mock/works.js';

console.log('=== 检查作品图片URL ===');

// 检查前5个作品的URL
mockWorks.slice(0, 5).forEach((work, index) => {
  console.log(`\n作品 ${index + 1}:`);
  console.log(`ID: ${work.id}`);
  console.log(`标题: ${work.title}`);
  console.log(`图片URL: ${work.thumbnail}`);
  
  // 检查是否是原始的Unsplash URL
  if (work.thumbnail.includes('unsplash.com') && !work.thumbnail.includes('q=') && !work.thumbnail.includes('w=') && !work.thumbnail.includes('h=')) {
    console.log('✅ 是原始的Unsplash URL');
  } else if (work.thumbnail.includes('unsplash.com')) {
    console.log('⚠️ 是Unsplash URL，但包含了额外参数');
  } else {
    console.log('ℹ️ 不是Unsplash URL');
  }
});

console.log('\n=== 测试完成 ===');
