import { useState, useEffect, createContext, ReactNode, useContext, useMemo, useCallback } from 'react';
import {
  Theme,
  themeConfig,
  defaultTheme,
  themeOrder,
  getAppliedTheme,
  initializeTheme,
  saveThemeToLocalStorage,
  getSystemTheme
} from '@/config/themeConfig';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: typeof themeConfig;
}

// 创建 ThemeContext
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: themeConfig
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 创建 ThemeProvider 组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initializeTheme);

  // 更新主题类到DOM
  const updateThemeClass = useCallback(() => {
    const appliedTheme = getAppliedTheme(theme);
    
    // 清除所有主题类
    document.documentElement.classList.remove('light', 'dark', 'pink');
    
    // 添加当前主题类（浅色主题不需要添加类，使用默认样式）
    if (appliedTheme !== 'light') {
      document.documentElement.classList.add(appliedTheme);
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (theme === 'auto') {
        updateThemeClass();
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, updateThemeClass]);

  // 主题变化时更新类名和localStorage
  useEffect(() => {
    updateThemeClass();
    saveThemeToLocalStorage(theme);
  }, [theme, updateThemeClass]);

  // 优化toggleTheme函数，使用主题顺序数组
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const currentIndex = themeOrder.indexOf(prevTheme);
      return themeOrder[(currentIndex + 1) % themeOrder.length];
    });
  }, []);

  // 确定当前是否为深色模式
  const isDark = useMemo(() => {
    if (theme === 'auto') {
      return getSystemTheme() === 'dark';
    }
    return theme === 'dark';
  }, [theme]);

  // 优化上下文值，减少组件重新渲染
  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
    availableThemes: themeConfig
  }), [theme, isDark, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
