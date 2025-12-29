import { createClient } from '@supabase/supabase-js'

// 获取环境变量，同时支持多种前缀格式
let supabaseUrl = ''
let supabaseKey = ''

// 添加详细的调试日志
console.log('当前环境变量import.meta.env:', import.meta.env)

// 尝试从不同前缀的环境变量中获取配置
if (import.meta.env) {
  console.log('尝试获取Supabase URL:')
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_URL:', import.meta.env.SUPABASE_URL)
  
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL || ''
  
  console.log('尝试获取Supabase密钥:')
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('SUPABASE_PUBLISHABLE_KEY:', import.meta.env.SUPABASE_PUBLISHABLE_KEY)
  console.log('SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY)
  
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || ''
}

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未配置完整')
  console.error('最终获取到的配置:', {
    supabaseUrl,
    supabaseKey,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  })
}

// 创建并导出Supabase客户端实例
// 只有在环境变量有效的情况下才创建客户端
export let supabase = null

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase客户端创建成功')
  } else {
    console.log('Supabase环境变量不完整，客户端未创建')
  }
} catch (error) {
  console.error('创建Supabase客户端失败:', error)
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
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    console.error('获取用户列表失败:', error)
    return []
  }
  return data || []
}

// 示例：获取帖子列表
export async function getPosts() {
  if (!supabase) {
    console.error('Supabase客户端未配置，无法获取帖子列表')
    return []
  }
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('获取帖子列表失败:', error)
    return []
  }
  return data || []
}

// 示例：创建帖子
export async function createPost(postData: any) {
  if (!supabase) {
    console.error('Supabase客户端未配置，无法创建帖子')
    return null
  }
  const { data, error } = await supabase.from('posts').insert([postData])
  if (error) {
    console.error('创建帖子失败:', error)
    return null
  }
  return data ? data[0] : null
}