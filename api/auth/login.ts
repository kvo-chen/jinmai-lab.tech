import type { VercelRequest, VercelResponse } from 'vercel'
import jwt from 'jsonwebtoken'

// 获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

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
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  
  try {
    const { email, password } = req.body || {}
    
    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' })
      return
    }
    
    // 简化登录流程：直接生成JWT令牌，不依赖数据库验证
    // 从邮箱提取用户名（示例逻辑，实际项目中应该从数据库获取）
    const username = email.split('@')[0]
    const userId = Date.now()
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: userId.toString(), email, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    // 返回用户信息和令牌
    res.status(200).json({
      ok: true,
      token,
      user: {
        id: userId.toString(),
        username,
        email
      }
    })
  } catch (e: any) {
    console.error('登录失败:', e.message)
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}