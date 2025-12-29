import { createClient } from '@supabase/supabase-js'

// 获取环境变量，使用Vite标准的VITE_前缀
let supabaseUrl = ''
let supabaseKey = ''

// 直接从import.meta.env中获取VITE_前缀的环境变量
const viteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const viteSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 检查并清理环境变量值
if (viteSupabaseUrl) {
  supabaseUrl = viteSupabaseUrl.replace(/^[\s`']+|[\s`']+$/g, '')
}

if (viteSupabaseAnonKey) {
  supabaseKey = viteSupabaseAnonKey.replace(/^[\s`']+|[\s`']+$/g, '')
}

// 如果VITE_前缀的环境变量不存在，尝试其他前缀作为备选
if (!supabaseUrl || !supabaseKey) {
  console.log('尝试使用其他前缀的环境变量...')
  
  // 尝试NEXT_PUBLIC_前缀
  const nextPublicUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const nextPublicKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  
  // 尝试直接使用SUPABASE_前缀
  const directUrl = import.meta.env.SUPABASE_URL
  const directKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY
  
  // 选择第一个可用的URL和密钥
  supabaseUrl = supabaseUrl || (nextPublicUrl || '').replace(/^[\s`']+|[\s`']+$/g, '') || (directUrl || '').replace(/^[\s`']+|[\s`']+$/g, '')
  supabaseKey = supabaseKey || (nextPublicKey || '').replace(/^[\s`']+|[\s`']+$/g, '') || (directKey || '').replace(/^[\s`']+|[\s`']+$/g, '')
}

// 验证环境变量并添加详细日志
console.log('Supabase环境变量配置:')
console.log('- VITE_SUPABASE_URL:', viteSupabaseUrl ? '已设置' : '未设置')
console.log('- VITE_SUPABASE_ANON_KEY:', viteSupabaseAnonKey ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- SUPABASE_URL:', import.meta.env.SUPABASE_URL ? '已设置' : '未设置')
console.log('- SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- 最终清理后URL:', supabaseUrl)
console.log('- 最终清理后密钥:', supabaseKey ? '已设置' : '未设置')
console.log('- 密钥长度:', supabaseKey ? supabaseKey.length : 0)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase环境变量未配置完整')
  console.error('请检查Vercel环境变量配置，确保已添加以下环境变量:')
  console.error('1. VITE_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL')
  console.error('2. VITE_SUPABASE_ANON_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('当前配置:')
  console.error('- URL:', supabaseUrl || '未设置')
  console.error('- 密钥:', supabaseKey ? '已设置但为空' : '未设置')
} else {
  console.log('✅ Supabase环境变量配置完整')
}

// 创建并导出Supabase客户端实例
// 只有在环境变量有效的情况下才创建客户端
export let supabase: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseKey) {
    // 添加更详细的日志
    console.log('正在创建Supabase客户端...')
    console.log('- URL:', supabaseUrl)
    console.log('- 密钥前缀:', supabaseKey.substring(0, 20) + '...')
    
    // 创建客户端时禁用自动刷新令牌，避免不必要的网络请求
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      // 添加更严格的重试策略
      retry: {
        initialDelay: 1000,
        maxDelay: 10000,
        maxRetries: 3
      },
      // 禁用Realtime，避免WebSocket连接错误
      realtime: {
        enabled: false
      }
    })
    
    console.log('✅ Supabase客户端创建成功')
  }
} catch (error) {
  console.error('❌ 创建Supabase客户端失败:', error)
  console.error('错误详情:', error instanceof Error ? error.message : String(error))
  supabase = null
}

// 确保supabase不会被tree-shaking移除
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__SUPABASE__ = supabase
}

// 示例：获取用户列表
export async function getUsers() {
  if (!supabase) {
    console.error('Supabase客户端未配置，无法获取用户列表')
    return []
  }
  try {
    const { data, error } = await supabase.from('users').select('*')
    if (error) {
      console.error('获取用户列表失败:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('获取用户列表异常:', error)
    return []
  }
}

// 示例：获取帖子列表
export async function getPosts() {
  if (!supabase) {
    console.error('Supabase客户端未配置，无法获取帖子列表')
    return []
  }
  try {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('获取帖子列表失败:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('获取帖子列表异常:', error)
    return []
  }
}

// 示例：创建帖子
export async function createPost(postData: Record<string, any>) {
  if (!supabase) {
    console.error('Supabase客户端未配置，无法创建帖子')
    return null
  }
  try {
    const { data, error } = await supabase.from('posts').insert([postData] as any[])
    if (error) {
      console.error('创建帖子失败:', error)
      return null
    }
    return data ? data[0] : null
  } catch (error) {
    console.error('创建帖子异常:', error)
    return null
  }
}
