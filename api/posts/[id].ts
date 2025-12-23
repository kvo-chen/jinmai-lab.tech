import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
const { verifyToken } = require('../../server/jwt.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未配置完整')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 模拟帖子数据，保留用于展示和测试
const mockPosts = [
  {
    id: 1,
    title: '国潮设计的崛起与发展',
    content: '国潮设计正在成为当代设计领域的重要力量...',
    user_id: 1,
    category_id: 1,
    status: 'published',
    view_count: 120,
    like_count: 25,
    comment_count: 10,
    created_at: Date.now(),
    updated_at: Date.now(),
    visibility: 'public'
  },
  {
    id: 2,
    title: '非遗传承的现代创新',
    content: '非物质文化遗产如何在现代社会中焕发新生...',
    user_id: 2,
    category_id: 2,
    status: 'published',
    view_count: 95,
    like_count: 18,
    comment_count: 7,
    created_at: Date.now(),
    updated_at: Date.now(),
    visibility: 'public'
  }
]

// 验证JWT令牌
function verifyAuth(req: VercelRequest): { userId: number } | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const token = authHeader.split(' ')[1]
  if (!token) return null
  
  try {
    const decoded = verifyToken(token)
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    const { id } = req.query
    const postId = parseInt(id as string)
    
    // 验证帖子ID
    if (isNaN(postId)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '无效的帖子ID'
      })
    }
    
    let post: any = null
    let postIndex = -1
    
    // 先从模拟数据中查找帖子
    postIndex = mockPosts.findIndex(p => p.id === postId)
    if (postIndex !== -1) {
      post = mockPosts[postIndex]
    }
    
    // 尝试从数据库获取帖子
    let dbPost: any = null
    try {
      const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single()
      if (data) {
        dbPost = data
        post = dbPost // 数据库中的帖子优先
      }
    } catch (dbError) {
      console.warn('从数据库获取帖子失败，使用模拟数据:', dbError.message)
    }
    
    // 如果帖子不存在
    if (!post) {
      return sendErrorResponse(res, API_ERRORS.POST_NOT_FOUND, {
        message: '帖子不存在'
      })
    }
    
    // GET请求 - 获取单个帖子
    if (req.method === 'GET') {
      console.log(`获取帖子: ${postId}`)
      
      // 增加浏览量
      const updatedViews = (post.view_count || 0) + 1
      
      // 更新数据库中的浏览量
      try {
        await supabase.from('posts').update({ view_count: updatedViews, updated_at: Date.now() }).eq('id', postId)
        // 同时更新数据库帖子对象
        if (dbPost) {
          dbPost.view_count = updatedViews
          post = dbPost
        }
      } catch (dbError) {
        console.warn('更新浏览量失败:', dbError.message)
      }
      
      // 更新模拟数据中的浏览量
      if (postIndex !== -1) {
        mockPosts[postIndex].view_count = updatedViews
        post = mockPosts[postIndex]
      }
      
      return sendSuccessResponse(res, post)
    }
    
    // 验证身份
    const auth = verifyAuth(req)
    if (!auth) {
      return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
        message: '未授权访问'
      })
    }
    
    // 验证用户权限
    if (post.user_id !== auth.userId) {
      return sendErrorResponse(res, API_ERRORS.FORBIDDEN, {
        message: '没有权限操作此帖子'
      })
    }
    
    // PUT请求 - 更新帖子
    if (req.method === 'PUT') {
      const { title, content, category_id, status } = req.body || {}
      
      // 验证必填字段
      if (!title || !content) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '帖子标题和内容为必填字段'
        })
      }
      
      // 更新帖子
      const now = Date.now()
      const updatedPost = {
        ...post,
        title,
        content,
        category_id: category_id || null,
        status: status || 'published',
        updated_at: now
      }
      
      // 同步到数据库
      try {
        const { data: dbUpdatedPost, error } = await supabase.from('posts').update({
          title,
          content,
          category_id: category_id || null,
          status: status || 'published',
          updated_at: now
        }).eq('id', postId).select().single()
        if (dbUpdatedPost) {
          post = dbUpdatedPost // 使用数据库返回的更新后数据
        }
      } catch (dbError) {
        console.error('更新帖子失败，数据库错误:', dbError)
        // 继续执行，使用模拟数据
      }
      
      // 更新模拟数据
      if (postIndex !== -1) {
        mockPosts[postIndex] = updatedPost
        post = updatedPost
      }
      
      console.log(`更新帖子成功: ${postId}`)
      return sendSuccessResponse(res, post, {
        message: '帖子更新成功'
      })
    }
    
    // DELETE请求 - 删除帖子
    if (req.method === 'DELETE') {
      // 从数据库中删除
      try {
        await supabase.from('posts').delete().eq('id', postId)
      } catch (dbError) {
        console.error('删除帖子失败，数据库错误:', dbError)
        // 继续执行，从模拟数据中删除
      }
      
      // 从模拟数据中删除
      if (postIndex !== -1) {
        mockPosts.splice(postIndex, 1)
      }
      
      console.log(`删除帖子成功: ${postId}`)
      return sendSuccessResponse(res, {}, {
        message: '帖子删除成功'
      })
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('帖子管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}