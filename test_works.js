// 简单的测试脚本来检查 mockWorks 数据
import { mockWorks } from './src/mock/works.js';

console.log('Total works:', mockWorks.length);
if (mockWorks.length > 0) {
  console.log('First few works:', mockWorks.slice(0, 5).map(w => ({ id: w.id, title: w.title })));
  console.log('Last few works:', mockWorks.slice(-5).map(w => ({ id: w.id, title: w.title })));
} else {
  console.log('No works found in mockWorks array!');
}