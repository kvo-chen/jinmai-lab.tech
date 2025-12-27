// 主题样式索引文件
// 导出所有主题样式，便于统一管理和加载

// 导入各主题样式
import './dark.css';
import './blue.css';
import './green.css';
import './pink.css';

// 导出主题类型
export type Theme = 'light' | 'dark' | 'pink' | 'blue' | 'green' | 'auto';

// 导出主题配置接口
export interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
}

// 导出主题配置列表
export const themeConfigs: ThemeConfig[] = [
  { value: 'auto', label: '自动', icon: 'fas fa-circle-half-stroke' },
  { value: 'light', label: '浅色', icon: 'fas fa-sun' },
  { value: 'dark', label: '深色', icon: 'fas fa-moon' },
  { value: 'pink', label: '粉色', icon: 'fas fa-heart' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf' }
];

// 导出主题切换顺序
export const themeOrder: Theme[] = ['light', 'dark', 'pink', 'blue', 'green', 'auto'];
