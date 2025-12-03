import { useState, useEffect, createContext, ReactNode, useContext, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'pink' | 'blue' | 'green' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: { value: Theme; label: string; icon: string }[];
}

// 创建 ThemeContext
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: []
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 创建 ThemeProvider 组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    return 'dark';
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'auto') {
        updateThemeClass();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 更新主题类名
  const updateThemeClass = () => {
    // 移除所有主题类
    document.documentElement.classList.remove('light', 'dark', 'pink', 'blue', 'green');
    
    // 确定当前使用的实际主题
    const currentTheme = theme === 'auto' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    
    // 添加当前主题类
    document.documentElement.classList.add(currentTheme);
  };

  useEffect(() => {
    updateThemeClass();
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const themes: Theme[] = ['light', 'dark', 'pink', 'blue', 'green', 'auto'];
      const currentIndex = themes.indexOf(prevTheme);
      return themes[(currentIndex + 1) % themes.length];
    });
  };

  const availableThemes: { value: Theme; label: string; icon: string }[] = [
    { value: 'auto', label: '自动', icon: 'fas fa-circle-half-stroke' },
    { value: 'light', label: '浅色', icon: 'fas fa-sun' },
    { value: 'dark', label: '深色', icon: 'fas fa-moon' },
    { value: 'pink', label: '粉色', icon: 'fas fa-heart' },
    { value: 'blue', label: '蓝色', icon: 'fas fa-water' },
    { value: 'green', label: '绿色', icon: 'fas fa-leaf' }
  ];

  // 确定当前是否为深色模式
  const isDark = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  }, [theme]);

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    availableThemes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
