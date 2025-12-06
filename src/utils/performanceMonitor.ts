/**
 * 性能监控工具
 * 用于跟踪和分析应用性能，包括自定义性能指标和定期审计功能
 */

/**
 * 自定义性能指标类型
 */
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  description?: string;
  timestamp: number;
};

/**
 * 性能监控类
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isInitialized = false;

  /**
   * 初始化性能监控
   */
  init() {
    if (this.isInitialized) return;

    // 监听核心 Web Vitals
    this.setupWebVitalsObserver();
    
    // 监听资源加载性能
    this.setupResourceObserver();
    
    this.isInitialized = true;
  }

  /**
   * 设置 Web Vitals 观察者
   */
  private setupWebVitalsObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // 只处理测量类型的条目
            if (entry.entryType === 'measure') {
              const measureEntry = entry as PerformanceMeasure;
              // 记录核心 Web Vitals
              if (this.isWebVital(measureEntry.name)) {
                this.recordMetric({
                  name: measureEntry.name,
                  value: measureEntry.duration,
                  unit: 'ms',
                  description: this.getWebVitalDescription(measureEntry.name),
                  timestamp: Date.now(),
                });
              }
            }
          });
        });

        // 监听 Web Vitals 指标
        this.observer.observe({ type: 'measure', buffered: true });
      } catch (error) {
        console.error('Failed to initialize performance observer:', error);
      }
    }
  }

  /**
   * 设置资源加载观察者
   */
  private setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[];
          entries.forEach((entry) => {
            // 记录资源加载时间
            this.recordMetric({
              name: `resource-${entry.name.split('/').pop()}`,
              value: entry.duration,
              unit: 'ms',
              description: `${entry.initiatorType} resource load time`,
              timestamp: Date.now(),
            });
          });
        });

        resourceObserver.observe({ type: 'resource', buffered: true });
      } catch (error) {
        console.error('Failed to initialize resource observer:', error);
      }
    }
  }

  /**
   * 检查是否为核心 Web Vital
   */
  private isWebVital(name: string): name is 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' {
    return ['LCP', 'FID', 'CLS', 'TTFB', 'INP'].includes(name);
  }

  /**
   * 获取 Web Vital 描述
   */
  private getWebVitalDescription(name: string): string {
    const descriptions: Record<string, string> = {
      LCP: 'Largest Contentful Paint',
      FID: 'First Input Delay',
      CLS: 'Cumulative Layout Shift',
      TTFB: 'Time to First Byte',
      INP: 'Interaction to Next Paint',
    };
    return descriptions[name] || name;
  }

  /**
   * 记录自定义性能指标
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // 发送到控制台（生产环境可发送到监控服务）
    // if (import.meta.env.DEV) {
    //   console.log('[Performance Metric]', metric);
    // }
    
    // 限制指标数量，避免内存泄漏
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 清除所有性能指标
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * 测量代码执行时间
   */
  measureExecutionTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      value: end - start,
      unit: 'ms',
      description: `Execution time for ${name}`,
      timestamp: Date.now(),
    });
    
    return result;
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  /**
   * 结束性能测量
   */
  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name).pop();
    if (measure) {
      this.recordMetric({
        name,
        value: measure.duration,
        unit: 'ms',
        description: `Performance measure for ${name}`,
        timestamp: Date.now(),
      });
    }
    
    // 清理标记
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  /**
   * 运行性能审计
   */
  async runAudit(): Promise<PerformanceAuditResult> {
    // 等待所有资源加载完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 获取性能数据
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // 计算审计结果
    const auditResult: PerformanceAuditResult = {
      timestamp: Date.now(),
      metrics: {
        // 核心 Web Vitals
        LCP: this.getMetricValue('LCP') || 0,
        FID: this.getMetricValue('FID') || 0,
        CLS: this.getMetricValue('CLS') || 0,
        TTFB: navigationEntry?.responseStart || 0,
        INP: this.getMetricValue('INP') || 0,
        // 导航性能
        navigationStart: navigationEntry?.startTime || 0,
        domContentLoaded: navigationEntry?.domContentLoadedEventEnd || 0,
        loadEvent: navigationEntry?.loadEventEnd || 0,
        // 资源统计
        totalResources: resourceEntries.length,
        totalResourceSize: resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        // 自定义指标
        customMetrics: this.metrics,
      },
      // 性能评分（基于 Web Vitals）
      score: this.calculatePerformanceScore(),
      // 优化建议
      suggestions: this.generateOptimizationSuggestions(),
    };
    
    return auditResult;
  }

  /**
   * 获取指标值
   */
  private getMetricValue(name: string): number | undefined {
    const metric = this.metrics.find(m => m.name === name);
    return metric?.value;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(): number {
    // 基于核心 Web Vitals 计算评分（0-100）
    let score = 100;
    
    // LCP (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
    const lcp = this.getMetricValue('LCP') || 0;
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    // FID (Good: <100ms, Needs Improvement: 100ms-300ms, Poor: >300ms)
    const fid = this.getMetricValue('FID') || 0;
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;
    
    // CLS (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    const cls = this.getMetricValue('CLS') || 0;
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;
    
    // INP (Good: <200ms, Needs Improvement: 200ms-500ms, Poor: >500ms)
    const inp = this.getMetricValue('INP') || 0;
    if (inp > 500) score -= 20;
    else if (inp > 200) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    const lcp = this.getMetricValue('LCP') || 0;
    const fid = this.getMetricValue('FID') || 0;
    const cls = this.getMetricValue('CLS') || 0;
    const inp = this.getMetricValue('INP') || 0;
    
    if (lcp > 2500) {
      suggestions.push('优化最大内容绘制 (LCP)：考虑优化图片大小、使用 CDN 或预加载关键资源');
    }
    
    if (fid > 100) {
      suggestions.push('优化首次输入延迟 (FID)：减少主线程阻塞，考虑代码分割或懒加载');
    }
    
    if (cls > 0.1) {
      suggestions.push('优化累积布局偏移 (CLS)：为图片添加固定尺寸，避免动态插入内容');
    }
    
    if (inp > 200) {
      suggestions.push('优化交互到下一次绘制 (INP)：减少事件处理器执行时间，使用防抖/节流');
    }
    
    return suggestions;
  }
}

/**
 * 性能审计结果类型
 */
export type PerformanceAuditResult = {
  timestamp: number;
  metrics: {
    // 核心 Web Vitals
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    INP: number;
    // 导航性能
    navigationStart: number;
    domContentLoaded: number;
    loadEvent: number;
    // 资源统计
    totalResources: number;
    totalResourceSize: number;
    // 自定义指标
    customMetrics: PerformanceMetric[];
  };
  // 性能评分（0-100）
  score: number;
  // 优化建议
  suggestions: string[];
};

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

// 自动初始化
export function initPerformanceMonitor() {
  performanceMonitor.init();
}

// 导出便捷函数
export const { 
  recordMetric, 
  getMetrics, 
  clearMetrics, 
  measureExecutionTime, 
  startMeasure, 
  endMeasure,
  runAudit 
} = performanceMonitor;