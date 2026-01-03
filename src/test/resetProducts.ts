import productService from '../services/productService';

console.log('当前产品数量:', productService.getAllProducts().length);
console.log('产品列表:', productService.getAllProducts());

console.log('\n正在重置产品数据...');
productService.resetProducts();

console.log('\n重置后产品数量:', productService.getAllProducts().length);
console.log('重置后产品列表:', productService.getAllProducts());

const products = productService.getAllProducts();
console.log('\n产品分类统计:');
const categoryCount = products.reduce((acc, product) => {
  acc[product.category] = (acc[product.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log(categoryCount);

console.log('\n积分范围:');
const points = products.map(p => p.points);
console.log(`最低: ${Math.min(...points)} 积分`);
console.log(`最高: ${Math.max(...points)} 积分`);
console.log(`平均: ${(points.reduce((a, b) => a + b, 0) / points.length).toFixed(0)} 积分`);
