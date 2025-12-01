import type { VercelRequest, VercelResponse } from 'vercel'
import jwt from 'jsonwebtoken'

// 获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

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
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  
  try {
    // 从请求头中获取Authorization令牌
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1]
    
    // 验证令牌
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (e) {
      res.status(401).json({ error: 'INVALID_TOKEN' })
      return
    }
    
    // 从令牌中获取用户信息
    const { userId, email, username } = decoded
    if (!userId || !email || !username) {
      res.status(401).json({ error: 'INVALID_TOKEN' })
      return
    }
    
    // 简化获取用户信息流程：直接从令牌中提取用户信息，不依赖数据库
    res.status(200).json({
      ok: true,
      user: {
        id: userId,
        username,
        email
      }
    })
  } catch (e: any) {
    console.error('获取用户信息失败:', e.message)
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}