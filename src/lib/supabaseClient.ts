import { createClient } from '@supabase/supabase-js'

// 获取环境变量，同时支持VITE_*和NEXT_PUBLIC_*前缀
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未配置完整')
  console.error('请确保环境变量中包含VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY或NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 创建并导出Supabase客户端实例
export const supabase = createClient(supabaseUrl, supabaseKey)

// 确保supabase不会被tree-shaking移除
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__SUPABASE__ = supabase
}

// 示例：获取用户列表
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    console.error('获取用户列表失败:', error)
    return []
  }
  return data
}

// 示例：获取帖子列表
export async function getPosts() {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('获取帖子列表失败:', error)
    return []
  }
  return data
}

// 示例：创建帖子
export async function createPost(postData: any) {
  const { data, error } = await supabase.from('posts').insert([postData])
  if (error) {
    console.error('创建帖子失败:', error)
    return null
  }
  return data ? data[0] : null
}