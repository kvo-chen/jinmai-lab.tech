// 验证 mockWorks 数组的顺序
import { mockWorks } from './src/mock/works';

// 检查前20个作品的ID，确保它们是1-20（原始作品）
console.log('=== 验证 mockWorks 数组顺序 ===');
console.log('前20个作品的ID：');

const first20Ids = mockWorks.slice(0, 20).map(work => work.id);
console.log(first20Ids);

// 检查是否按顺序排列
const isSequential = first20Ids.every((id, index) => id === index + 1);
console.log(`\n前20个作品是否按顺序排列：${isSequential ? '是' : '否'}`);

// 检查原始作品总数（应该是120个）
const originalWorksCount = mockWorks.filter(work => work.id <= 120).length;
console.log(`\n原始作品数量：${originalWorksCount}`);

// 检查新生成作品数量
const newWorksCount = mockWorks.filter(work => work.id > 120).length;
console.log(`新生成作品数量：${newWorksCount}`);

// 检查总作品数量
console.log(`总作品数量：${mockWorks.length}`);

// 验证是否所有原始作品都在前面
const allOriginalFirst = mockWorks.every((work, index) => {
  if (index < 120) {
    return work.id <= 120;
  } else {
    return work.id > 120;
  }
});

console.log(`\n所有原始作品是否都在前面：${allOriginalFirst ? '是' : '否'}`);

if (allOriginalFirst) {
  console.log('✅ 验证通过：原始作品正确显示在最前面！');
} else {
  console.log('❌ 验证失败：原始作品没有显示在最前面！');
  // 找出第一个位置错误的作品
  const firstWrongIndex = mockWorks.findIndex((work, index) => {
    if (index < 120) {
      return work.id > 120;
    } else {
      return work.id <= 120;
    }
  });
  if (firstWrongIndex !== -1) {
    console.log(`第一个位置错误的作品：索引 ${firstWrongIndex}，ID ${mockWorks[firstWrongIndex].id}`);
  }
}