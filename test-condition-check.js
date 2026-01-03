// 更准确的测试脚本，直接使用我们修改后的条件判断逻辑

// 测试条件判断逻辑
function testConditionCheck(url) {
  try {
    const urlObj = new URL(url);
    // 我们修改后的条件判断
    return urlObj.searchParams.has('w') && urlObj.searchParams.has('h') && urlObj.searchParams.has('fit');
  } catch (error) {
    return false;
  }
}

// 测试用例
const testUrls = [
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
  // 没有完整参数的URL
  'https://images.unsplash.com/photo-1234567890',
  'https://images.unsplash.com/photo-1234567890?w=800',
  'https://images.unsplash.com/photo-1234567890?w=800&h=600'
];

console.log('=== 测试条件判断逻辑 ===\n');

testUrls.forEach((url, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`URL: ${url}`);
  const result = testConditionCheck(url);
  console.log(`是否包含完整参数 (w, h, fit): ${result}`);
  console.log(`应该返回原始URL: ${result}`);
  console.log('---\n');
});

// 现在让我们测试完整的处理逻辑，特别是条件判断部分
console.log('=== 测试完整处理逻辑 ===\n');

function testFullProcessImageUrl(url) {
  if (!url) {
    return '';
  }
  
  try {
    // 检查是否为Unsplash图片URL
    const urlObj = new URL(url);
    if ((urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com'))) {
      // 我们修改后的条件判断
      if (urlObj.searchParams.has('w') && urlObj.searchParams.has('h') && urlObj.searchParams.has('fit')) {
        console.log(`✅ 原始URL包含完整参数，直接返回: ${url}`);
        return url;
      }
      
      console.log(`✅ 原始URL缺少参数，进行处理: ${url}`);
      // 模拟处理
      return `processed: ${url}`;
    }
    
    console.log(`❌ 非Unsplash URL，直接返回: ${url}`);
    return url;
  } catch (error) {
    console.error(`❌ 处理出错: ${url}`, error);
    return url;
  }
}

testUrls.forEach((url, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  const result = testFullProcessImageUrl(url);
  console.log(`处理后URL: ${result}`);
  console.log(`URL是否改变: ${result !== url}`);
  console.log('---\n');
});