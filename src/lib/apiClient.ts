type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody> {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: TBody
  timeoutMs?: number
  retries?: number
}

interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 1

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

  let attempt = 0
  let fallbackAttempt = 0
  let useFallback = false
  
  // 定义可重试的错误类型
  const retryableErrors = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'TIMEOUT', 'NETWORK_ERROR', 'fetch failed']
  
  while (attempt <= retries) {
    try {
      // 构建请求URL：先尝试主URL，失败后尝试回退URL
      const target = useFallback ? altUrl : url
      const fetchPromise = fetch(target, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      
      const res = await withTimeout(fetchPromise, timeoutMs)
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await res.json() : (await res.text()) as any
      
      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `HTTP ${res.status}`
        return { ok: false, status: res.status, error: message }
      }
      
      return { ok: true, status: res.status, data }
    } catch (err: any) {
      const errorMessage = err?.message || 'UNKNOWN_ERROR'
      
      // 检查是否是可重试的错误
      const isRetryable = retryableErrors.some(errorType => 
        errorMessage.includes(errorType)
      )
      
      if (!isRetryable) {
        return { ok: false, status: 0, error: errorMessage }
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
        return { 
          ok: false, 
          status: 0, 
          error: `API请求失败，已尝试${retries + 1}次：${errorMessage}` 
        }
      }
      
      // 指数退避重试
      const backoffTime = 300 * Math.pow(2, Math.min(attempt, 5))
      await sleep(backoffTime)
    }
  }
  
  return { ok: false, status: 0, error: 'UNKNOWN_ERROR' }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'DELETE' }),
}

export default apiClient
