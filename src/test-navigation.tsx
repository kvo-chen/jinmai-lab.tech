import React from 'react';
import { navigationGroups } from './config/navigationConfig';

// 测试导航配置是否正确
console.log('=== 导航配置测试 ===');
console.log('核心导航项:');
navigationGroups.find(group => group.id === 'core')?.items.forEach(item => {
  console.log(`- ${item.label}: ${item.path}`);
});

console.log('\n创作中心链接检查:');
const createItem = navigationGroups.find(group => group.id === 'core')?.items.find(item => item.label === '创作中心');
if (createItem) {
  console.log(`创作中心路径: ${createItem.path}`);
  console.log(`路径是否正确: ${createItem.path === '/create' ? '✅ 正确' : '❌ 错误'}`);
} else {
  console.log('❌ 未找到创作中心导航项');
}
