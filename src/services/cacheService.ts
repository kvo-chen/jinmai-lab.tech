// 缓存服务

// 缓存策略类型
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'none'

// 缓存项类型
interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // 过期时间（毫秒）
}

// 缓存配置类型
interface CacheConfig {
  defaultTtl: number // 默认过期时间（毫秒）
  defaultStrategy: CacheStrategy
  maxMemoryItems: number // 内存缓存最大项数
}

// 内存缓存存储
class MemoryCache {
  private cache = new Map<string, CacheItem>()
  private maxItems: number

  constructor(maxItems: number = 100) {
    this.maxItems = maxItems
  }

  set(key: string, value: CacheItem) {
    // 移除过期项
    this.removeExpiredItems()

    // 如果缓存已满，移除最旧的项
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, value)
  }

  get(key: string): CacheItem | undefined {
    const item = this.cache.get(key)
    if (item && !this.isExpired(item)) {
      return item
    }
    // 如果过期了，移除该项
    this.cache.delete(key)
    return undefined
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl
  }

  private removeExpiredItems() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 缓存服务类
export class CacheService {
  private memoryCache: MemoryCache
  private config: CacheConfig

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtl: config?.defaultTtl || 30 * 60 * 1000, // 默认30分钟
      defaultStrategy: config?.defaultStrategy || 'memory',
      maxMemoryItems: config?.maxMemoryItems || 100
    }
    this.memoryCache = new MemoryCache(this.config.maxMemoryItems)
  }

  /**
   * 设置缓存
   */
  set<T>(
    key: string,
    data: T,
    options?: {
      ttl?: number
      strategy?: CacheStrategy
    }
  ): void {
    const ttl = options?.ttl || this.config.defaultTtl
    const strategy = options?.strategy || this.config.defaultStrategy

    if (strategy === 'none') {
      return
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    switch (strategy) {
      case 'memory':
        this.memoryCache.set(key, cacheItem)
        break
      case 'localStorage':
        try {
          localStorage.setItem(key, JSON.stringify(cacheItem))
        } catch (error) {
          console.error('Failed to set localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          sessionStorage.setItem(key, JSON.stringify(cacheItem))
        } catch (error) {
          console.error('Failed to set sessionStorage:', error)
        }
        break
    }
  }

  /**
   * 获取缓存
   */
  get<T>(
    key: string,
    strategy?: CacheStrategy
  ): T | null {
    const cacheStrategy = strategy || this.config.defaultStrategy

    if (cacheStrategy === 'none') {
      return null
    }

    let cacheItem: CacheItem<T> | undefined

    switch (cacheStrategy) {
      case 'memory':
        cacheItem = this.memoryCache.get(key) as CacheItem<T> | undefined
        break
      case 'localStorage':
        try {
          const item = localStorage.getItem(key)
          if (item) {
            cacheItem = JSON.parse(item) as CacheItem<T>
            // 检查是否过期
            if (this.isExpired(cacheItem)) {
              localStorage.removeItem(key)
              cacheItem = undefined
            }
          }
        } catch (error) {
          console.error('Failed to get localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          const item = sessionStorage.getItem(key)
          if (item) {
            cacheItem = JSON.parse(item) as CacheItem<T>
            // 检查是否过期
            if (this.isExpired(cacheItem)) {
              sessionStorage.removeItem(key)
              cacheItem = undefined
            }
          }
        } catch (error) {
          console.error('Failed to get sessionStorage:', error)
        }
        break
    }

    return cacheItem ? cacheItem.data : null
  }

  /**
   * 删除缓存
   */
  delete(key: string, strategy?: CacheStrategy): void {
    const cacheStrategy = strategy || this.config.defaultStrategy

    if (cacheStrategy === 'none') {
      return
    }

    switch (cacheStrategy) {
      case 'memory':
        this.memoryCache.delete(key)
        break
      case 'localStorage':
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.error('Failed to delete localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.error('Failed to delete sessionStorage:', error)
        }
        break
    }

    // 同时删除其他策略中的相同键
    if (strategy) {
      this.deleteFromOtherStrategies(key, strategy)
    }
  }

  /**
   * 清除所有缓存
   */
  clear(strategy?: CacheStrategy): void {
    if (!strategy) {
      // 清除所有策略的缓存
      this.memoryCache.clear()
      try {
        localStorage.clear()
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
      try {
        sessionStorage.clear()
      } catch (error) {
        console.error('Failed to clear sessionStorage:', error)
      }
    } else {
      // 清除指定策略的缓存
      switch (strategy) {
        case 'memory':
          this.memoryCache.clear()
          break
        case 'localStorage':
          try {
            localStorage.clear()
          } catch (error) {
            console.error('Failed to clear localStorage:', error)
          }
          break
        case 'sessionStorage':
          try {
            sessionStorage.clear()
          } catch (error) {
            console.error('Failed to clear sessionStorage:', error)
          }
          break
      }
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string, strategy?: CacheStrategy): boolean {
    return this.get(key, strategy) !== null
  }

  /**
   * 缓存预热 - 预加载多个键值对
   */
  preload(items: Array<{
    key: string
    data: any
    ttl?: number
    strategy?: CacheStrategy
  }>): void {
    items.forEach(item => {
      this.set(item.key, item.data, {
        ttl: item.ttl,
        strategy: item.strategy
      })
    })
  }

  /**
   * 缓存预取 - 根据键预取数据
   */
  prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: {
      ttl?: number
      strategy?: CacheStrategy
    }
  ): Promise<T> {
    // 先检查缓存
    const cachedData = this.get<T>(key, options?.strategy)
    if (cachedData) {
      return Promise.resolve(cachedData)
    }

    // 缓存不存在，执行获取函数并缓存结果
    return fetchFn().then(data => {
      this.set(key, data, options)
      return data
    })
  }

  /**
   * 获取缓存统计信息
   */
  getStats(strategy?: CacheStrategy): {
    memoryItems?: number
    localStorageItems?: number
    sessionStorageItems?: number
  } {
    const stats: any = {}

    if (!strategy || strategy === 'memory') {
      stats.memoryItems = this.memoryCache['cache'].size
    }

    if (!strategy || strategy === 'localStorage') {
      try {
        stats.localStorageItems = localStorage.length
      } catch (error) {
        console.error('Failed to get localStorage stats:', error)
      }
    }

    if (!strategy || strategy === 'sessionStorage') {
      try {
        stats.sessionStorageItems = sessionStorage.length
      } catch (error) {
        console.error('Failed to get sessionStorage stats:', error)
      }
    }

    return stats
  }

  /**
   * 从其他策略中删除相同键
   */
  private deleteFromOtherStrategies(key: string, excludeStrategy: CacheStrategy): void {
    const strategies: CacheStrategy[] = ['memory', 'localStorage', 'sessionStorage']
    strategies.forEach(strategy => {
      if (strategy !== excludeStrategy) {
        this.delete(key, strategy)
      }
    })
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl
  }
}

// 创建单例实例
const cacheService = new CacheService()

export default cacheService
