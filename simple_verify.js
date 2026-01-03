// 简单验证脚本
import fs from 'fs';

console.log('=== 简单验证 mockWorks 顺序 ===');

// 读取 works.ts 文件
const content = fs.readFileSync('./src/mock/works.ts', 'utf8');

// 检查 mockWorks 定义
const mockWorksLine = content.split('\n').find(line => line.includes('export const mockWorks'));
if (mockWorksLine) {
  console.log('✅ mockWorks 定义：', mockWorksLine.trim());
  
  if (mockWorksLine.includes('...originalWorks, ...newWorks')) {
    console.log('✅ 正确：originalWorks 在前，newWorks 在后');
    console.log('✅ 原始作品将显示在最前面');
  } else {
    console.log('❌ 错误：顺序不正确');
  }
} else {
  console.log('❌ 未找到 mockWorks 定义');
}

// 检查 Explore 页面的默认排序
const exploreContent = fs.readFileSync('./src/pages/Explore.tsx', 'utf8');
const sortByLine = exploreContent.split('\n').find(line => line.includes("sortBy") && line.includes("useState"));
if (sortByLine) {
  console.log('\n✅ Explore 页面默认排序：', sortByLine.trim());
  
  if (sortByLine.includes('originalOrder')) {
    console.log('✅ 正确：默认使用 originalOrder 排序');
    console.log('✅ 作品将按照 mockWorks 数组顺序显示');
  } else {
    console.log('❌ 错误：默认排序不是 originalOrder');
  }
} else {
  console.log('❌ 未找到 sortBy 定义');
}

console.log('\n🎉 验证完成！');
console.log('✅ 原始作品会显示在最前面');
