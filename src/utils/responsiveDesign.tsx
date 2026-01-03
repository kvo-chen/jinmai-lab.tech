import { useState, useEffect } from 'react';

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export const breakpoints: Record<string, Breakpoint> = {
  xs: { name: 'xs', minWidth: 0, maxWidth: 575 },
  sm: { name: 'sm', minWidth: 576, maxWidth: 767 },
  md: { name: 'md', minWidth: 768, maxWidth: 991 },
  lg: { name: 'lg', minWidth: 992, maxWidth: 1199 },
  xl: { name: 'xl', minWidth: 1200, maxWidth: 1599 },
  xxl: { name: 'xxl', minWidth: 1600 }
};

export type BreakpointName = keyof typeof breakpoints;

export interface ResponsiveOptions {
  mobileFirst?: boolean;
  debounceMs?: number;
  ssrBreakpoint?: BreakpointName;
}

export function useBreakpoint(breakpointName: BreakpointName, options: ResponsiveOptions = {}): boolean {
  const { mobileFirst = true, debounceMs = 100, ssrBreakpoint = 'md' } = options;
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return mobileFirst ? true : false;
    }
    return checkBreakpoint(breakpointName, mobileFirst);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const breakpoint = breakpoints[breakpointName];
    const mediaQuery = getMediaQuery(breakpoint, mobileFirst);
    
    let timeoutId: NodeJS.Timeout;
    
    const handleChange = (e: MediaQueryListEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMatches(e.matches);
      }, debounceMs);
    };

    const mediaQueryList = window.matchMedia(mediaQuery);
    setMatches(mediaQueryList.matches);
    
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      clearTimeout(timeoutId);
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [breakpointName, mobileFirst, debounceMs]);

  return matches;
}

export function useResponsive(): {
  currentBreakpoint: BreakpointName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  width: number;
  height: number;
} {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointName>('md');

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const width = dimensions.width;
    let breakpoint: BreakpointName = 'xs';

    if (width >= 1600) breakpoint = 'xxl';
    else if (width >= 1200) breakpoint = 'xl';
    else if (width >= 992) breakpoint = 'lg';
    else if (width >= 768) breakpoint = 'md';
    else if (width >= 576) breakpoint = 'sm';

    setCurrentBreakpoint(breakpoint);
  }, [dimensions]);

  return {
    currentBreakpoint,
    isMobile: ['xs', 'sm'].includes(currentBreakpoint),
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl'].includes(currentBreakpoint),
    isLarge: currentBreakpoint === 'xxl',
    width: dimensions.width,
    height: dimensions.height
  };
}

export function getResponsiveValue<T>(
  values: Partial<Record<BreakpointName, T>>,
  currentBreakpoint: BreakpointName,
  defaultValue: T
): T {
  const breakpointOrder: BreakpointName[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint]!;
    }
  }

  return defaultValue;
}

function checkBreakpoint(breakpointName: BreakpointName, mobileFirst: boolean): boolean {
  if (typeof window === 'undefined') return mobileFirst;
  
  const breakpoint = breakpoints[breakpointName];
  const mediaQuery = getMediaQuery(breakpoint, mobileFirst);
  return window.matchMedia(mediaQuery).matches;
}

function getMediaQuery(breakpoint: Breakpoint, mobileFirst: boolean): string {
  if (mobileFirst) {
    return `(min-width: ${breakpoint.minWidth}px)`;
  } else {
    if (breakpoint.maxWidth) {
      return `(max-width: ${breakpoint.maxWidth}px)`;
    }
    return `(min-width: ${breakpoint.minWidth}px)`;
  }
}

export interface ResponsiveImageSizes {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
  [key: string]: string | undefined;
}

export function getOptimizedImageSrc(
  src: string,
  sizes: ResponsiveImageSizes,
  currentBreakpoint: BreakpointName
): string {
  const size = getResponsiveValue(sizes, currentBreakpoint, src);
  return size || src;
}

export function createResponsiveClassName(
  baseClass: string,
  responsiveModifiers: Partial<Record<BreakpointName, string>>
): string {
  const classes = [baseClass];
  
  Object.entries(responsiveModifiers).forEach(([breakpoint, modifier]) => {
    if (modifier) {
      classes.push(`${baseClass}--${breakpoint}-${modifier}`);
    }
  });

  return classes.join(' ');
}

export function useOrientation(): 'portrait' | 'landscape' | undefined {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' | undefined {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  return undefined;
}

export function useHoverSupported(): boolean {
  const [hoverSupported, setHoverSupported] = useState(true);

  useEffect(() => {
    const checkHoverSupport = () => {
      setHoverSupported(window.matchMedia('(hover: hover)').matches);
    };

    checkHoverSupport();
    window.addEventListener('resize', checkHoverSupport);
    return () => window.removeEventListener('resize', checkHoverSupport);
  }, []);

  return hoverSupported;
}

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: Partial<Record<BreakpointName, string>>;
  padding?: Partial<Record<BreakpointName, string>>;
  margin?: Partial<Record<BreakpointName, string>>;
}

export function ResponsiveContainer({ children, className = '', maxWidth, padding, margin }: ResponsiveContainerProps) {
  const { currentBreakpoint } = useResponsive();
  
  const styles: React.CSSProperties = {};
  
  if (maxWidth) {
    styles.maxWidth = getResponsiveValue(maxWidth, currentBreakpoint, '100%');
  }
  
  if (padding) {
    styles.padding = getResponsiveValue(padding, currentBreakpoint, '0');
  }
  
  if (margin) {
    styles.margin = getResponsiveValue(margin, currentBreakpoint, '0 auto');
  }

  return (
    <div className={`responsive-container ${className}`} style={styles}>
      {children}
    </div>
  );
}