import { createClient } from '@supabase/supabase-js'

// 环境变量清理函数，处理可能的空格、引号和反引号
const cleanEnvValue = (value: string | undefined): string => {
  if (!value) return '';
  // 移除前后空格、引号、反引号
  return value.trim().replace(/^[\s"'`]+|[\s"'`]+$/g, '');
};

// 获取环境变量，优先使用NEXT_PUBLIC_前缀，因为Vercel配置的是这个前缀
const supabaseUrl = cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_URL) || 
                   cleanEnvValue(import.meta.env.VITE_SUPABASE_URL) || 
                   cleanEnvValue(import.meta.env.SUPABASE_URL)

// 支持新格式的Publishable key和旧格式的ANON_KEY
const supabaseKey = cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) || 
                   cleanEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) || 
                   cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
                   cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY) || 
                   cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || 
                   cleanEnvValue(import.meta.env.SUPABASE_ANON_KEY) || 
                   cleanEnvValue(import.meta.env.SUPABASE_PUBLISHABLE_KEY)

// 验证环境变量并添加详细日志
console.log('Supabase环境变量配置:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '已设置' : '未设置')
console.log('- VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '已设置' : '未设置')
console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- SUPABASE_URL:', import.meta.env.SUPABASE_URL ? '已设置' : '未设置')
console.log('- SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- SUPABASE_PUBLISHABLE_KEY:', import.meta.env.SUPABASE_PUBLISHABLE_KEY ? '已设置' : '未设置')
console.log('- 最终URL:', supabaseUrl)
console.log('- 最终密钥:', supabaseKey ? '已设置' : '未设置')
console.log('- 密钥长度:', supabaseKey ? supabaseKey.length : 0)
console.log('- 密钥前缀:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '未设置')

// 验证环境变量是否完整
if (!supabaseUrl) {
  console.error('❌ Supabase URL未配置')
  console.error('请检查Vercel环境变量配置，确保已添加以下环境变量之一:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- VITE_SUPABASE_URL')
  console.error('- SUPABASE_URL')
} 

if (!supabaseKey) {
  console.error('❌ Supabase密钥未配置')
  console.error('请检查Vercel环境变量配置，确保已添加以下环境变量之一:')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  console.error('- VITE_SUPABASE_ANON_KEY')
  console.error('- SUPABASE_ANON_KEY')
  console.error('- SUPABASE_PUBLISHABLE_KEY')
} 

if (supabaseUrl && supabaseKey) {
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
    console.log('- 密钥前缀:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '未设置')
    console.log('- 完整URL:', supabaseUrl)
    console.log('- 密钥长度:', supabaseKey ? supabaseKey.length : 0)
    
    // 验证URL格式
    if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      console.error('❌ Supabase URL格式不正确，必须以http://或https://开头:', supabaseUrl)
    }
    
    // 验证密钥格式
    if (supabaseKey && supabaseKey.length < 30) {
      console.error('❌ Supabase密钥长度过短，可能是无效密钥:', supabaseKey)
    }
    
    // 创建客户端，使用默认配置，让Supabase自动处理auth端点
supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
    
    console.log('✅ Supabase客户端创建成功')
    console.log('✅ Supabase auth对象:', typeof supabase?.auth)
    console.log('✅ Supabase auth.signUp方法:', typeof supabase?.auth.signUp)
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
