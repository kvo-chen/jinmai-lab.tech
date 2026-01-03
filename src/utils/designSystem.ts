/**
 * 设计系统配置
 * 定义统一的设计规范和组件标准
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 设计令牌（Design Tokens）
 */
export const designTokens = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // 次要色调
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // 成功色调
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    
    // 警告色调
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },
    
    // 错误色调
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    
    // 信息色调
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    }
  },
  
  // 字体系统
  typography: {
    // 字体族
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
    },
    
    // 字体大小
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }]
    },
    
    // 字体权重
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    
    // 字间距
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },
  
  // 间距系统
  spacing: {
    // 基础间距（4px为基准）
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
    40: '10rem',   // 160px
    48: '12rem',   // 192px
    56: '14rem',   // 224px
    64: '16rem'    // 256px
  },
  
  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },
  
  // 动画系统
  animations: {
    // 过渡时间
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms'
    },
    
    // 缓动函数
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  // 断点系统
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // z-index系统
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

/**
 * 主题配置
 */
export const themes = {
  light: {
    background: '#ffffff',
    foreground: '#020617',
    card: '#ffffff',
    cardForeground: '#020617',
    popover: '#ffffff',
    popoverForeground: '#020617',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb'
  },
  
  dark: {
    background: '#020617',
    foreground: '#ffffff',
    card: '#020617',
    cardForeground: '#ffffff',
    popover: '#020617',
    popoverForeground: '#ffffff',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    destructive: '#7f1d1d',
    destructiveForeground: '#ffffff',
    border: '#1e293b',
    input: '#1e293b',
    ring: '#3b82f6'
  }
};

/**
 * 组件变体配置
 */
export const componentVariants = {
  // 按钮变体
  button: {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  },
  
  // 卡片变体
  card: {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        outline: 'border border-border bg-card text-card-foreground',
        ghost: 'bg-transparent text-foreground'
      },
      size: {
        default: 'rounded-lg',
        sm: 'rounded-md',
        lg: 'rounded-xl',
        none: 'rounded-none'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  },
  
  // 输入框变体
  input: {
    variants: {
      variant: {
        default: 'border border-input bg-background',
        outline: 'border border-input bg-background',
        filled: 'bg-muted border-transparent',
        flushed: 'border-b border-input bg-transparent rounded-none'
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-8 px-2',
        lg: 'h-12 px-4'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
};

/**
 * 响应式工具函数
 */
export const responsiveUtils = {
  /**
   * 生成响应式类名
   */
  createResponsiveClass: (baseClass: string, breakpoints: Record<string, string>) => {
    const classes = [baseClass];
    
    Object.entries(breakpoints).forEach(([breakpoint, modifier]) => {
      if (breakpoint === 'default') {
        classes.push(`${baseClass}-${modifier}`);
      } else {
        classes.push(`${breakpoint}:${baseClass}-${modifier}`);
      }
    });
    
    return classes.join(' ');
  },
  
  /**
   * 生成响应式网格类名
   */
  createGridClasses: (columns: Record<string, number>, gap?: Record<string, number>) => {
    const classes: string[] = [];
    
    Object.entries(columns).forEach(([breakpoint, cols]) => {
      const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}grid-cols-${cols}`);
    });
    
    if (gap) {
      Object.entries(gap).forEach(([breakpoint, gapSize]) => {
        const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
        classes.push(`${prefix}gap-${gapSize}`);
      });
    }
    
    return classes.join(' ');
  },
  
  /**
   * 生成响应式间距类名
   */
  createSpacingClasses: (spacing: Record<string, Record<string, number>>) => {
    const classes: string[] = [];
    
    Object.entries(spacing).forEach(([breakpoint, properties]) => {
      const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
      
      Object.entries(properties).forEach(([property, value]) => {
        classes.push(`${prefix}${property}-${value}`);
      });
    });
    
    return classes.join(' ');
  }
};

/**
 * 无障碍工具函数
 */
export const a11yUtils = {
  /**
   * 生成屏幕阅读器文本
   */
  createScreenReaderText: (text: string) => {
    return `sr-only ${text}`;
  },
  
  /**
   * 生成焦点管理类名
   */
  createFocusClasses: (type: 'default' | 'ring' | 'outline' = 'default') => {
    switch (type) {
      case 'ring':
        return 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
      case 'outline':
        return 'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
      default:
        return 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    }
  },
  
  /**
   * 生成ARIA属性
   */
  createAriaAttributes: (attributes: Record<string, string | boolean | undefined>) => {
    return Object.entries(attributes)
      .filter(([_, value]) => value !== undefined && value !== false)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
  }
};

/**
 * 动画工具函数
 */
export const animationUtils = {
  /**
   * 生成过渡类名
   */
  createTransitionClasses: (
    properties: string[] = ['all'],
    duration: string = 'duration-200',
    easing: string = 'ease-in-out'
  ) => {
    return [
      `transition-${properties.join('-')}`,
      duration,
      easing
    ].join(' ');
  },
  
  /**
   * 生成动画类名
   */
  createAnimationClasses: (
    animation: string,
    duration?: string,
    delay?: string,
    iteration?: string
  ) => {
    const classes = [animation];
    
    if (duration) classes.push(duration);
    if (delay) classes.push(delay);
    if (iteration) classes.push(iteration);
    
    return classes.join(' ');
  },
  
  /**
   * 生成加载动画类名
   */
  createLoadingClasses: (type: 'spinner' | 'pulse' | 'dots' = 'spinner') => {
    switch (type) {
      case 'spinner':
        return 'animate-spin';
      case 'pulse':
        return 'animate-pulse';
      case 'dots':
        return 'animate-bounce';
      default:
        return 'animate-spin';
    }
  }
};

export default {
  cn,
  designTokens,
  themes,
  componentVariants,
  responsiveUtils,
  a11yUtils,
  animationUtils
};