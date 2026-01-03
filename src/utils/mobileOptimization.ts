/**
 * 移动端适配工具
 * 提供响应式设计和移动端优化功能
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 断点配置
 */
export const BREAKPOINTS = {
  xs: 0,      // 超小屏（手机竖屏）
  sm: 640,    // 小屏（手机横屏）
  md: 768,    // 中屏（平板）
  lg: 1024,   // 大屏（小屏笔记本）
  xl: 1280,   // 超大屏（大屏笔记本）
  '2xl': 1536 // 超超大屏（桌面显示器）
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 设备类型
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  UNKNOWN: 'unknown'
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

/**
 * 触摸事件配置
 */
export interface TouchConfig {
  threshold: number;      // 滑动阈值（像素）
  timeout: number;        // 长按超时时间（毫秒）
  preventDefault: boolean; // 是否阻止默认行为
}

/**
 * 触摸手势识别器
 */
export class TouchGestureRecognizer {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isPressed = false;
  private config: TouchConfig;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<TouchConfig> = {}) {
    this.config = {
      threshold: 50,
      timeout: 500,
      preventDefault: true,
      ...config
    };
  }

  /**
   * 添加事件监听器
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  /**
   * 处理触摸开始
   */
  handleTouchStart = (e: TouchEvent) => {
    if (this.config.preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isPressed = true;

    this.emit('touchstart', { x: this.startX, y: this.startY });

    // 设置长按检测
    setTimeout(() => {
      if (this.isPressed) {
        this.emit('longpress', { x: this.startX, y: this.startY });
      }
    }, this.config.timeout);
  };

  /**
   * 处理触摸移动
   */
  handleTouchMove = (e: TouchEvent) => {
    if (!this.isPressed) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    this.emit('touchmove', { x: touch.clientX, y: touch.clientY, deltaX, deltaY });
  };

  /**
   * 处理触摸结束
   */
  handleTouchEnd = (e: TouchEvent) => {
    if (!this.isPressed) return;

    if (this.config.preventDefault) {
      e.preventDefault();
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const deltaTime = Date.now() - this.startTime;

    this.isPressed = false;

    // 检测手势类型
    if (Math.abs(deltaX) > this.config.threshold || Math.abs(deltaY) > this.config.threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0) {
          this.emit('swiperight', { deltaX, deltaY, deltaTime });
        } else {
          this.emit('swipeleft', { deltaX, deltaY, deltaTime });
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          this.emit('swipedown', { deltaX, deltaY, deltaTime });
        } else {
          this.emit('swipeup', { deltaX, deltaY, deltaTime });
        }
      }
    } else {
      // 点击
      this.emit('tap', { x: touch.clientX, y: touch.clientY, deltaTime });
    }

    this.emit('touchend', { x: touch.clientX, y: touch.clientY, deltaX, deltaY, deltaTime });
  };

  /**
   * 绑定到元素
   */
  bindTo(element: HTMLElement) {
    element.addEventListener('touchstart', this.handleTouchStart, { passive: !this.config.preventDefault });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: !this.config.preventDefault });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: !this.config.preventDefault });

    return () => {
      element.removeEventListener('touchstart', this.handleTouchStart);
      element.removeEventListener('touchmove', this.handleTouchMove);
      element.removeEventListener('touchend', this.handleTouchEnd);
    };
  }

  /**
   * 清理所有事件监听器
   */
  clearListeners() {
    this.listeners.clear();
  }
}

/**
 * 响应式Hook
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [deviceType, setDeviceType] = useState<DeviceType>(DEVICE_TYPES.DESKTOP);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    let currentBreakpoint: Breakpoint = 'xs';

    // 确定当前断点
    if (width >= BREAKPOINTS['2xl']) currentBreakpoint = '2xl';
    else if (width >= BREAKPOINTS.xl) currentBreakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) currentBreakpoint = 'lg';
    else if (width >= BREAKPOINTS.md) currentBreakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) currentBreakpoint = 'sm';

    setBreakpoint(currentBreakpoint);

    // 确定设备类型
    let currentDeviceType: DeviceType;
    if (width < BREAKPOINTS.sm) {
      currentDeviceType = DEVICE_TYPES.MOBILE;
    } else if (width < BREAKPOINTS.md) {
      currentDeviceType = DEVICE_TYPES.TABLET;
    } else {
      currentDeviceType = DEVICE_TYPES.DESKTOP;
    }

    setDeviceType(currentDeviceType);
    setIsMobile(currentDeviceType === DEVICE_TYPES.MOBILE);
    setIsTablet(currentDeviceType === DEVICE_TYPES.TABLET);
    setIsDesktop(currentDeviceType === DEVICE_TYPES.DESKTOP);
  }, []);

  useEffect(() => {
    updateBreakpoint();
    
    const handleResize = () => {
      updateBreakpoint();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBreakpoint]);

  return {
    breakpoint,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  };
}

/**
 * 触摸手势Hook
 */
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: {
    onTap?: (event: any) => void;
    onSwipeLeft?: (event: any) => void;
    onSwipeRight?: (event: any) => void;
    onSwipeUp?: (event: any) => void;
    onSwipeDown?: (event: any) => void;
    onLongPress?: (event: any) => void;
    onTouchStart?: (event: any) => void;
    onTouchMove?: (event: any) => void;
    onTouchEnd?: (event: any) => void;
  },
  config: Partial<TouchConfig> = {}
) {
  const [recognizer] = useState(() => new TouchGestureRecognizer(config));

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // 绑定事件处理器
    if (handlers.onTap) recognizer.on('tap', handlers.onTap);
    if (handlers.onSwipeLeft) recognizer.on('swipeleft', handlers.onSwipeLeft);
    if (handlers.onSwipeRight) recognizer.on('swiperight', handlers.onSwipeRight);
    if (handlers.onSwipeUp) recognizer.on('swipeup', handlers.onSwipeUp);
    if (handlers.onSwipeDown) recognizer.on('swipedown', handlers.onSwipeDown);
    if (handlers.onLongPress) recognizer.on('longpress', handlers.onLongPress);
    if (handlers.onTouchStart) recognizer.on('touchstart', handlers.onTouchStart);
    if (handlers.onTouchMove) recognizer.on('touchmove', handlers.onTouchMove);
    if (handlers.onTouchEnd) recognizer.on('touchend', handlers.onTouchEnd);

    // 绑定到元素
    const unbind = recognizer.bindTo(element);

    return () => {
      unbind();
      // 清理事件监听器
      recognizer.clearListeners();
    };
  }, [elementRef, handlers, recognizer]);

  return recognizer;
}

/**
 * 移动端检测Hook
 */
export function useMobileDetection() {
  const [userAgent, setUserAgent] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWeChat, setIsWeChat] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    setUserAgent(ua);

    // 移动端检测
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipad', 'ipod', 'windows phone', 'blackberry', 'bb10'
    ];
    const isMobileDevice = mobileKeywords.some(keyword => ua.includes(keyword));
    setIsMobile(isMobileDevice);

    // 系统检测
    setIsIOS(/(iphone|ipad|ipod)/i.test(ua));
    setIsAndroid(ua.includes('android'));
    setIsWeChat(ua.includes('micromessenger'));
  }, []);

  return {
    userAgent,
    isMobile,
    isIOS,
    isAndroid,
    isWeChat,
    isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
    isChrome: /chrome/i.test(userAgent) && !/edge/i.test(userAgent),
    isFirefox: /firefox/i.test(userAgent),
    isEdge: /edge/i.test(userAgent)
  };
}

/**
 * 视口Hook
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      }));
    };

    const handleScroll = () => {
      setViewport(prev => ({
        ...prev,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return viewport;
}

/**
 * 移动端优化Hook
 */
export function useMobileOptimization() {
  const { isMobile, isIOS, isSafari } = useMobileDetection();
  const { isTablet } = useResponsive();

  // 防止iOS Safari的橡皮筋效果
  useEffect(() => {
    if (!isIOS || !isSafari) return;

    const preventRubberBand = (e: TouchEvent) => {
      const element = e.target as HTMLElement;
      const isScrollable = element.scrollHeight > element.clientHeight;
      
      if (!isScrollable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventRubberBand, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventRubberBand);
    };
  }, [isIOS, isSafari]);

  // 移动端100vh修复
  useEffect(() => {
    if (!isMobile) return;

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, [isMobile]);

  return {
    isMobile,
    isIOS,
    isSafari,
    isTablet,
    
    // 移动端优化类名
    mobileClasses: cn({
      'touch-manipulation': isMobile,
      'select-none': isMobile,
      'tap-highlight-transparent': isMobile
    }),
    
    // iOS Safari优化类名
    iosSafariClasses: cn({
      'ios-safari-fix': isIOS && isSafari,
      'webkit-touch-callout-none': isIOS,
      'webkit-user-select-none': isIOS
    })
  };
}

/**
 * 响应式工具函数
 */
export const responsiveUtils = {
  /**
   * 生成响应式类名
   */
  createResponsiveClass: (baseClass: string, breakpoints: Record<string, string>) => {
    const classes: string[] = [baseClass];
    
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

// 工具函数
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default {
  BREAKPOINTS,
  DEVICE_TYPES,
  useResponsive,
  useTouchGestures,
  useMobileDetection,
  useViewport,
  useMobileOptimization,
  responsiveUtils,
  TouchGestureRecognizer,
  cn
};