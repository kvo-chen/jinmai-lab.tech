type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody> {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: TBody
  timeoutMs?: number
  retries?: number
  // 新增：缓存选项
  cache?: {
    enabled?: boolean
    ttl?: number // 缓存过期时间（毫秒）
    staleTtl?: number // 缓存过期后可使用的时间（毫秒）
    storageType?: CacheStorageType // 缓存存储类型
    key?: string // 自定义缓存键
    prefetch?: boolean // 是否预取数据
    revalidateOnFocus?: boolean // 窗口聚焦时重新验证
  }
  // 新增：防抖选项
  debounce?: {
    enabled?: boolean
    delay?: number // 防抖延迟（毫秒）
  }
  // 新增：节流选项
  throttle?: {
    enabled?: boolean
    limit?: number // 节流限制（毫秒）
  }
  // 新增：取消令牌
  signal?: AbortSignal
}

interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
  fromCache?: boolean // 新增：是否来自缓存
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 1
const DEFAULT_CACHE_TTL = 60000 // 默认缓存时间1分钟
const DEFAULT_DEBOUNCE_DELAY = 300 // 默认防抖延迟300ms
const DEFAULT_THROTTLE_LIMIT = 1000 // 默认节流限制1秒

// 缓存存储类型
type CacheStorageType = 'memory' | 'session' | 'local'

// 缓存统计数据
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  size: number
}

// 新增：增强版缓存存储
class CacheStore {
  private cache: Map<string, { data: any; timestamp: number; ttl: number; staleTtl?: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0
  }
  private storage: Storage | null = null
  private storageType: CacheStorageType
  private storagePrefix: string = 'api_cache_'

  constructor(storageType: CacheStorageType = 'memory') {
    this.storageType = storageType
    
    // 初始化持久化存储
    if (typeof window !== 'undefined') {
      if (storageType === 'session') {
        this.storage = sessionStorage
      } else if (storageType === 'local') {
        this.storage = localStorage
      }
      this.loadFromStorage()
    }
    
    // 定期清理过期缓存（每2分钟）
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 120000)
  }

  // 从持久化存储加载缓存
  private loadFromStorage(): void {
    if (!this.storage) return
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          const actualKey = key.replace(this.storagePrefix, '')
          const item = this.storage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            this.cache.set(actualKey, parsed)
          }
        }
      }
      this.stats.size = this.cache.size
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  // 保存到持久化存储
  private saveToStorage(key: string, value: any): void {
    if (!this.storage) return
    
    try {
      this.storage.setItem(this.storagePrefix + key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
      // 清理旧缓存以释放空间
      this.cleanupExpired()
    }
  }

  // 从持久化存储删除
  private removeFromStorage(key: string): void {
    if (!this.storage) return
    
    try {
      this.storage.removeItem(this.storagePrefix + key)
    } catch (error) {
      console.error('Failed to remove cache from storage:', error)
    }
  }

  // 获取缓存，支持stale-while-revalidate策略
  get(key: string, options?: { allowStale?: boolean }): { data: any; isStale: boolean } | null {
    const { allowStale = false } = options || {}
    const cached = this.cache.get(key)
    
    if (!cached) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    const isExpired = now - cached.timestamp > cached.ttl
    const isStale = isExpired && cached.staleTtl ? now - cached.timestamp > cached.staleTtl : isExpired
    
    if (isStale) {
      this.cache.delete(key)
      this.removeFromStorage(key)
      this.stats.evictions++
      this.stats.size--
      this.stats.misses++
      return null
    }
    
    this.stats.hits++
    return {
      data: cached.data,
      isStale: isExpired
    }
  }

  set(key: string, data: any, options?: { ttl?: number; staleTtl?: number }): void {
    const ttl = options?.ttl ?? DEFAULT_CACHE_TTL
    const staleTtl = options?.staleTtl ?? ttl * 2 // 默认stale时间为ttl的2倍
    
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      staleTtl
    }
    
    this.cache.set(key, cacheItem)
    this.saveToStorage(key, cacheItem)
    this.stats.sets++
    this.stats.size = this.cache.size
  }

  delete(key: string): void {
    this.cache.delete(key)
    this.removeFromStorage(key)
    this.stats.deletes++
    this.stats.size = this.cache.size
  }

  clear(): void {
    this.cache.clear()
    
    if (this.storage) {
      try {
        // 清除所有带有前缀的缓存项
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key && key.startsWith(this.storagePrefix)) {
            this.storage.removeItem(key)
          }
        }
      } catch (error) {
        console.error('Failed to clear cache from storage:', error)
      }
    }
    
    this.stats.deletes += this.stats.size
    this.stats.size = 0
  }

  private cleanupExpired(): void {
    const now = Date.now()
    let evicted = 0
    
    for (const [key, cached] of this.cache.entries()) {
      const isStale = cached.staleTtl ? now - cached.timestamp > cached.staleTtl : now - cached.timestamp > cached.ttl
      if (isStale) {
        this.cache.delete(key)
        this.removeFromStorage(key)
        evicted++
      }
    }
    
    if (evicted > 0) {
      this.stats.evictions += evicted
      this.stats.size = this.cache.size
    }
  }

  // 获取缓存统计数据
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // 获取所有缓存键
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  // 预取数据到缓存
  prefetch(key: string, data: any, options?: { ttl?: number; staleTtl?: number }): void {
    this.set(key, data, options)
  }

  // 销毁方法，清理定时器
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// 单例缓存实例
const cacheStore = new CacheStore()

// 新增：防抖存储
const debounceStore: Map<string, NodeJS.Timeout> = new Map()

// 新增：节流存储
const throttleStore: Map<string, { lastRan: number; inThrottle: boolean }> = new Map()

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (envUrl && envUrl.trim()) return envUrl
  // 中文注释：自动判断本地开发环境（localhost/127.0.0.1/file协议），统一指向本地服务端 3001
  try {
    const w = typeof window !== 'undefined' ? window : undefined
    if (w) {
      const { protocol, hostname, port } = w.location
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
      const isFile = protocol === 'file:'
      const isDev = isLocalHost || isFile
      // 中文注释：当前端端口不是 3001（避免自指），使用后端端口 3001
      if (isDev && port !== '3001') return 'http://localhost:3001'
    }
  } catch {}
  // 中文注释：默认返回空字符串，使用相对路径（生产环境由同源后端提供路由）
  return ''
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId)
    return result as T
  } catch (e) {
    clearTimeout(timeoutId)
    throw e
  }
}

// 新增：生成缓存键
const generateCacheKey = (path: string, options: RequestOptions<any>): string => {
  const method = options.method || 'GET'
  const cacheKey = options.cache?.key
  
  if (cacheKey) return cacheKey
  
  // 对于GET请求，包含查询参数
  if (method === 'GET') {
    return `${method}:${path}`
  }
  
  // 对于其他请求，包含方法、路径和请求体摘要
  const bodyDigest = options.body ? JSON.stringify(options.body).substring(0, 100) : ''
  return `${method}:${path}:${bodyDigest}`
}

// 新增：防抖包装函数
const debounceRequest = <T>(
  key: string,
  fn: () => Promise<T>,
  delay: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 清除之前的防抖定时器
    const existingTimeout = debounceStore.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // 设置新的防抖定时器
    const newTimeout = setTimeout(async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        debounceStore.delete(key)
      }
    }, delay) as NodeJS.Timeout
    
    debounceStore.set(key, newTimeout)
  })
}

// 新增：节流包装函数
const throttleRequest = <T>(
  key: string,
  fn: () => Promise<T>,
  limit: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    const throttleData = throttleStore.get(key)
    
    if (!throttleData) {
      // 第一次执行
      throttleStore.set(key, { lastRan: now, inThrottle: false })
      fn().then(resolve).catch(reject)
    } else {
      const { lastRan, inThrottle } = throttleData
      const timeSinceLast = now - lastRan
      
      if (!inThrottle && timeSinceLast >= limit) {
        // 可以执行新请求
        throttleStore.set(key, { lastRan: now, inThrottle: false })
        fn().then(resolve).catch(reject)
      } else if (!inThrottle) {
        // 进入节流状态
        throttleStore.set(key, { lastRan, inThrottle: true })
        
        // 延迟执行
        const delay = limit - timeSinceLast
        setTimeout(async () => {
          try {
            const result = await fn()
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            throttleStore.set(key, { lastRan: Date.now(), inThrottle: false })
          }
        }, delay)
      } else {
        // 已经在节流状态，拒绝新请求
        reject(new Error('Request throttled'))
      }
    }
  })
}

// 导入错误服务
import errorService from '../services/errorService';

export async function apiRequest<TResp, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<ApiResponse<TResp>> {
  const base = getBaseUrl()
  const url = base ? `${base}${path}` : path
  const altUrl = path
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
  const retries = options.retries ?? DEFAULT_RETRIES
  
  // 生成请求键，用于缓存、防抖和节流
  const requestKey = generateCacheKey(path, options)
  
  // 检查缓存
  const cacheOptions = options.cache || {}
  const isCacheEnabled = cacheOptions.enabled !== false && method === 'GET'
  let cachedResult: { data: any; isStale: boolean } | null = null
  
  if (isCacheEnabled) {
    cachedResult = cacheStore.get(requestKey)
    if (cachedResult) {
      // 如果数据过期但未失效，返回缓存数据并在后台重新验证
      if (cachedResult.isStale) {
        // 在后台重新验证缓存
        actualRequest().catch(error => {
          console.warn('Cache revalidation failed:', error);
          // 记录缓存重新验证错误
          errorService.logError(error, {
            path,
            method,
            fromCache: true,
            isRevalidation: true
          });
        })
      }
      return { ok: true, status: 200, data: cachedResult.data as TResp, fromCache: true }
    }
  }
  
  // 定义实际请求函数
  const actualRequest = async (): Promise<ApiResponse<TResp>> => {
    let attempt = 0
    let fallbackAttempt = 0
    let useFallback = false
    
    // 定义可重试的错误类型
    const retryableErrors = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'TIMEOUT', 'NETWORK_ERROR', 'fetch failed', 'Failed to fetch']
    
    while (attempt <= retries) {
      try {
        // 构建请求URL：先尝试主URL，失败后尝试回退URL
        const target = useFallback ? altUrl : url
        
        // 记录请求开始时间
        const startTime = performance.now()
        
        const fetchPromise = fetch(target, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        })
        
        const res = await withTimeout(fetchPromise, timeoutMs)
        
        // 计算请求耗时
        const endTime = performance.now()
        const duration = endTime - startTime
        
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const data = isJson ? await res.json() : (await res.text()) as any
        
        if (!res.ok) {
          // 处理HTTP错误
          const statusCode = res.status
          const message = (data && (data.message || data.error)) || `HTTP ${statusCode}`
          
          // 分类HTTP错误
          let errorType = 'HTTP_ERROR'
          if (statusCode >= 400 && statusCode < 500) {
            errorType = 'CLIENT_ERROR'
          } else if (statusCode >= 500) {
            errorType = 'SERVER_ERROR'
          } else if (statusCode === 401) {
            errorType = 'UNAUTHORIZED_ERROR'
          } else if (statusCode === 403) {
            errorType = 'FORBIDDEN_ERROR'
          } else if (statusCode === 404) {
            errorType = 'NOT_FOUND_ERROR'
          }
          
          // 记录HTTP错误
          const httpError = new Error(`${errorType}: ${message}`)
          const context = {
            path,
            method,
            url: target,
            statusCode,
            duration,
            requestBody: options.body,
            responseData: data
          }
          errorService.logError(httpError, context)
          
          return { ok: false, status: statusCode, error: message }
        }
        
        // 缓存结果（仅GET请求）
        if (isCacheEnabled) {
          const ttl = cacheOptions.ttl ?? DEFAULT_CACHE_TTL
          const staleTtl = cacheOptions.staleTtl ?? ttl * 2
          cacheStore.set(requestKey, data, { ttl, staleTtl })
        }
        
        return { ok: true, status: res.status, data }
      } catch (err: any) {
        // 处理网络错误
        const errorMessage = err?.message || 'UNKNOWN_ERROR'
        const isCanceled = errorMessage.includes('AbortError')
        
        if (isCanceled) {
          return { ok: false, status: 0, error: '请求已取消' }
        }
        
        // 分类网络错误
        let errorType = 'NETWORK_ERROR'
        if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
          errorType = 'TIMEOUT_ERROR'
        } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Connection refused')) {
          errorType = 'CONNECTION_REFUSED_ERROR'
        } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('Connection reset')) {
          errorType = 'CONNECTION_RESET_ERROR'
        } else if (errorMessage.includes('fetch failed') || errorMessage.includes('Failed to fetch')) {
          errorType = 'FETCH_ERROR'
        }
        
        // 检查是否是可重试的错误
        const isRetryable = retryableErrors.some(retryableError => 
          errorMessage.includes(retryableError)
        )
        
        if (!isRetryable) {
          // 记录不可重试的错误
          const networkError = new Error(`${errorType}: ${errorMessage}`)
          const context = {
            path,
            method,
            url: useFallback ? altUrl : url,
            attempt: useFallback ? fallbackAttempt : attempt,
            useFallback,
            requestBody: options.body
          }
          errorService.logError(networkError, context)
          
          return { ok: false, status: 0, error: errorService.getFriendlyErrorMessage(errorType) }
        }
        
        // 尝试回退URL（如果可用且未尝试过）
        if (base && !useFallback) {
          useFallback = true
          fallbackAttempt = 0
          continue
        }
        
        // 更新尝试计数
        if (useFallback) {
          fallbackAttempt++
        } else {
          attempt++
        }
        
        // 检查是否达到最大尝试次数
        const maxAttemptsReached = useFallback 
          ? fallbackAttempt > retries 
          : attempt > retries
        
        if (maxAttemptsReached) {
          // 记录重试失败的错误
          const retryError = new Error(`${errorType}: ${errorMessage}`)
          const context = {
            path,
            method,
            url: useFallback ? altUrl : url,
            retries: retries + 1,
            useFallback,
            requestBody: options.body
          }
          errorService.logError(retryError, context)
          
          return { 
            ok: false, 
            status: 0, 
            error: `API请求失败，已尝试${retries + 1}次：${errorService.getFriendlyErrorMessage(errorType)}` 
          }
        }
        
        // 记录重试尝试
        console.warn(`Request retry attempt ${useFallback ? fallbackAttempt : attempt} for ${method} ${useFallback ? altUrl : url}: ${errorMessage}`)
        
        // 指数退避重试
        const backoffTime = 300 * Math.pow(2, Math.min(useFallback ? fallbackAttempt : attempt, 5))
        await sleep(backoffTime)
      }
    }
    
    // 所有尝试都失败了
    const finalError = new Error('所有请求尝试都失败了')
    errorService.logError(finalError, {
      path,
      method,
      retries,
      requestBody: options.body
    })
    
    return { ok: false, status: 0, error: 'API请求失败，请检查网络连接后重试' }
  }
  
  // 窗口聚焦时重新验证缓存
  if (isCacheEnabled && cacheOptions.revalidateOnFocus && typeof window !== 'undefined') {
    const handleFocus = () => {
      actualRequest().catch(error => {
        console.warn('Cache revalidation on focus failed:', error);
        // 记录缓存重新验证错误
        errorService.logError(error, {
          path,
          method,
          fromCache: true,
          isFocusRevalidation: true
        });
      })
    }
    window.addEventListener('focus', handleFocus)
    // 清理事件监听器
    setTimeout(() => {
      window.removeEventListener('focus', handleFocus)
    }, 30000) // 30秒后移除监听器
  }
  
  // 应用防抖
  const debounceOptions = options.debounce || {}
  const isDebounceEnabled = debounceOptions.enabled === true
  if (isDebounceEnabled) {
    const delay = debounceOptions.delay ?? DEFAULT_DEBOUNCE_DELAY
    return debounceRequest(requestKey, actualRequest, delay)
  }
  
  // 应用节流
  const throttleOptions = options.throttle || {}
  const isThrottleEnabled = throttleOptions.enabled === true
  if (isThrottleEnabled) {
    const limit = throttleOptions.limit ?? DEFAULT_THROTTLE_LIMIT
    return throttleRequest(requestKey, actualRequest, limit)
  }
  
  // 直接执行请求
  return actualRequest()
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'DELETE' }),
  
  // 新增：缓存管理方法
  cache: {
    // 清理特定键的缓存
    clear: (key: string) => cacheStore.delete(key),
    // 清理所有缓存
    clearAll: () => cacheStore.clear(),
    // 获取缓存键
    getKey: (path: string, options?: RequestOptions<any>) => generateCacheKey(path, options || { method: 'GET' }),
    // 获取缓存统计数据
    getStats: () => cacheStore.getStats(),
    // 获取所有缓存键
    getKeys: () => cacheStore.getKeys(),
    // 预取数据到缓存
    prefetch: <T>(key: string, data: T, options?: { ttl?: number; staleTtl?: number }) => {
      cacheStore.prefetch(key, data, options)
    },
    // 手动验证缓存
    revalidate: <T>(path: string, options?: RequestOptions<never>) => {
      return apiRequest<T, never>(path, { ...options, method: 'GET', cache: { ...options?.cache, enabled: true } })
    },
  },
  
  // 新增：防抖管理方法
  debounce: {
    // 清除特定键的防抖定时器
    clear: (key: string) => {
      const timeout = debounceStore.get(key)
      if (timeout) {
        clearTimeout(timeout)
        debounceStore.delete(key)
      }
    },
    // 清除所有防抖定时器
    clearAll: () => {
      for (const timeout of debounceStore.values()) {
        clearTimeout(timeout)
      }
      debounceStore.clear()
    },
  },
  
  // 新增：节流管理方法
  throttle: {
    // 清除特定键的节流状态
    clear: (key: string) => throttleStore.delete(key),
    // 清除所有节流状态
    clearAll: () => throttleStore.clear(),
  },
  
  // 新增：取消所有进行中的请求（通过AbortController）
  cancelAll: () => {
    // 这里可以实现更复杂的请求取消逻辑
    // 目前主要通过AbortSignal机制让调用方自行管理
    console.warn('apiClient.cancelAll() is not fully implemented. Use AbortSignal for request cancellation.')
  },
  
  // 新增：性能监控方法
  performance: {
    // 获取缓存统计
    getCacheStats: () => cacheStore.getStats(),
  },
}

export default apiClient
