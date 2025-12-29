import { createClient } from '@supabase/supabase-js'

// 获取环境变量，同时支持多种前缀格式
let supabaseUrl = ''
let supabaseKey = ''

// 尝试从不同前缀的环境变量中获取配置
if (import.meta.env) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL || ''
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || ''
}

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未配置完整')
  console.error('请检查Vercel环境变量配置，确保已添加正确的Supabase URL和API密钥')
  console.error('支持的环境变量名称:')
  console.error('- VITE_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY 或 SUPABASE_PUBLISHABLE_KEY 或 SUPABASE_ANON_KEY')
}

// 创建并导出Supabase客户端实例
// 只有在环境变量有效的情况下才创建客户端
export let supabase = null

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
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