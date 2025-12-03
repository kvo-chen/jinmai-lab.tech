import type { VercelRequest, VercelResponse } from '@vercel/node'
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')
const { leaderboardDB } = require('../../server/database.mjs')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    // GET请求 - 获取帖子排行榜
    if (req.method === 'GET') {
      // 解析查询参数
      const sortBy = (req.query.sortBy as string) || 'likes_count'
      const timeRange = (req.query.timeRange as string) || 'all'
      const limit = parseInt((req.query.limit as string) || '20')
      
      // 验证参数
      const validSortBy = ['likes_count', 'views', 'comments_count']
      const validTimeRange = ['day', 'week', 'month', 'all']
      
      if (!validSortBy.includes(sortBy)) {
        return sendErrorResponse(res, API_ERRORS.INVALID_PARAMS, {
          message: '无效的排序方式，有效值：likes_count, views, comments_count'
        })
      }
      
      if (!validTimeRange.includes(timeRange)) {
        return sendErrorResponse(res, API_ERRORS.INVALID_PARAMS, {
          message: '无效的时间范围，有效值：day, week, month, all'
        })
      }
      
      if (isNaN(limit) || limit <= 0 || limit > 100) {
        return sendErrorResponse(res, API_ERRORS.INVALID_PARAMS, {
          message: '无效的限制数量，有效值：1-100'
        })
      }
      
      // 获取排行榜数据
      const posts = await leaderboardDB.getPostsLeaderboard({
        sortBy,
        timeRange,
        limit
      })
      
      console.log('获取帖子排行榜成功:', { sortBy, timeRange, limit, count: posts.length })
      return sendSuccessResponse(res, posts)
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('帖子排行榜API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}
