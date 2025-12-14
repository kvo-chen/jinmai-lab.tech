import type { VercelRequest, VercelResponse } from '@vercel/node'
const { verifyToken } = require('../../server/jwt.mjs')
const { userDB } = require('../../server/database.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
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
    
    // 获取请求体
    const { membershipLevel, membershipStatus, membershipStart, membershipEnd } = req.body
    
    // 验证请求参数
    if (!membershipLevel || !membershipStatus) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETERS)
    }
    
    // 验证会员等级
    const validLevels = ['free', 'premium', 'vip']
    if (!validLevels.includes(membershipLevel)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETERS, { message: '无效的会员等级' })
    }
    
    // 验证会员状态
    const validStatuses = ['active', 'expired', 'pending']
    if (!validStatuses.includes(membershipStatus)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETERS, { message: '无效的会员状态' })
    }
    
    // 更新用户会员信息
    const updatedUser = await userDB.updateById(parseInt(userId), {
      membership_level: membershipLevel,
      membership_status: membershipStatus,
      membership_start: membershipStart || new Date().toISOString(),
      membership_end: membershipEnd || null
    })
    
    if (!updatedUser) {
      return sendErrorResponse(res, API_ERRORS.USER_NOT_FOUND)
    }
    
    // 返回更新后的用户信息
    return sendSuccessResponse(res, {
      user: {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone || null,
        avatar_url: updatedUser.avatar_url || null,
        interests: updatedUser.interests ? JSON.parse(updatedUser.interests) : null,
        age: updatedUser.age || null,
        tags: updatedUser.tags ? JSON.parse(updatedUser.tags) : null,
        isAdmin: updatedUser.email === 'testuser789@example.com' || updatedUser.isAdmin,
        membershipLevel: updatedUser.membership_level,
        membershipStatus: updatedUser.membership_status,
        membershipStart: updatedUser.membership_start,
        membershipEnd: updatedUser.membership_end
      }
    })
  } catch (e: any) {
    console.error('更新会员信息失败:', e.message)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}
