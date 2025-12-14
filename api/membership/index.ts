import type { VercelRequest, VercelResponse } from '@vercel/node'
const { verifyToken } = require('../../server/jwt.mjs')
const { userDB } = require('../../server/database.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')


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
  
  // 验证请求方法
  if (req.method !== 'GET') {
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  }
  
  try {
    // 从请求头中获取Authorization令牌
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED)
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1]
    
    // 验证令牌
    const decoded: any = verifyToken(token)
    if (!decoded) {
      return sendErrorResponse(res, API_ERRORS.INVALID_TOKEN)
    }
    
    // 从令牌中获取用户ID
    const userId = decoded.userId
    if (!userId) {
      return sendErrorResponse(res, API_ERRORS.INVALID_TOKEN)
    }
    
    // 根据ID查找用户
    const user = await userDB.findById(parseInt(userId))
    if (!user) {
      return sendErrorResponse(res, API_ERRORS.USER_NOT_FOUND)
    }
    
    // 返回会员信息
    return sendSuccessResponse(res, {
      membership: {
        level: user.membership_level || 'free',
        status: user.membership_status || 'active',
        start: user.membership_start || new Date().toISOString(),
        end: user.membership_end || null
      }
    })
  } catch (e: any) {
    console.error('获取会员信息失败:', e.message)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}
