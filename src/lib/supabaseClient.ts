import { createClient } from '@supabase/supabase-js'

// 获取环境变量，优先使用NEXT_PUBLIC_前缀，因为Vercel配置的是这个前缀
let supabaseUrl = ''
let supabaseKey = ''

// 直接从import.meta.env中获取各种前缀的环境变量
const nextPublicUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const nextPublicKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const viteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const viteSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const directUrl = import.meta.env.SUPABASE_URL
const directKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY

// 优先使用NEXT_PUBLIC_前缀的环境变量
if (nextPublicUrl) {
  supabaseUrl = nextPublicUrl.replace(/^[\s`']+|[\s`']+$/g, '')
} else if (viteSupabaseUrl) {
  supabaseUrl = viteSupabaseUrl.replace(/^[\s`']+|[\s`']+$/g, '')
} else if (directUrl) {
  supabaseUrl = directUrl.replace(/^[\s`']+|[\s`']+$/g, '')
}

if (nextPublicKey) {
  supabaseKey = nextPublicKey.replace(/^[\s`']+|[\s`']+$/g, '')
} else if (viteSupabaseAnonKey) {
  supabaseKey = viteSupabaseAnonKey.replace(/^[\s`']+|[\s`']+$/g, '')
} else if (directKey) {
  supabaseKey = directKey.replace(/^[\s`']+|[\s`']+$/g, '')
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
    console.log('- 完整URL:', supabaseUrl)
    console.log('- 密钥长度:', supabaseKey.length)
    
    // 验证URL格式
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      console.error('❌ Supabase URL格式不正确，必须以http://或https://开头:', supabaseUrl)
    }
    
    // 验证密钥格式
    if (supabaseKey.length < 30) {
      console.error('❌ Supabase密钥长度过短，可能是无效密钥:', supabaseKey)
    }
    
    // 创建客户端时使用更简单的配置，避免不必要的功能
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // 简化配置，只保留必要的认证功能
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
        // 明确指定auth端点，避免自动检测失败
        endpoints: {
          // 明确指定认证端点，确保使用正确的URL
          signUp: `${supabaseUrl}/auth/v1/signup`,
          signIn: `${supabaseUrl}/auth/v1/token?grant_type=password`,
          refreshToken: `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
          signOut: `${supabaseUrl}/auth/v1/logout`,
          getUser: `${supabaseUrl}/auth/v1/user`,
          resetPasswordForEmail: `${supabaseUrl}/auth/v1/recover`,
          updateUser: `${supabaseUrl}/auth/v1/user`,
          getSession: `${supabaseUrl}/auth/v1/session`
        }
      },
      // 禁用所有不必要的功能，只保留核心功能
      realtime: {
        enabled: false
      },
      storage: {
        enabled: false
      }
    })
    
    console.log('✅ Supabase客户端创建成功')
    console.log('✅ Supabase auth对象:', typeof supabase.auth)
    console.log('✅ Supabase auth.signUp方法:', typeof supabase.auth.signUp)
  } else {
    console.error('❌ 无法创建Supabase客户端，环境变量不完整:')
    console.error('- URL:', supabaseUrl || '未设置')
    console.error('- 密钥:', supabaseKey ? '已设置但为空' : '未设置')
  }
} catch (error) {
  console.error('❌ 创建Supabase客户端失败:', error)
  console.error('错误详情:', error instanceof Error ? error.message : String(error))
  console.error('错误堆栈:', error instanceof Error ? error.stack : '')
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
