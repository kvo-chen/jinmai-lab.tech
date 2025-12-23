import { createClient } from '@supabase/supabase-js'

// 获取环境变量
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未配置完整')
  console.error('请确保.env文件中包含NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
}

// 创建并导出Supabase客户端实例
export const supabase = createClient(supabaseUrl, supabaseKey)

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
  return data[0]
}