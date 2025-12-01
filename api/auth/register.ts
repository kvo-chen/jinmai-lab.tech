import type { VercelRequest, VercelResponse } from 'vercel'
import bcryptjs from 'bcryptjs'
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
    const { username, email, password } = req.body || {}
    
    // 验证必填字段
    if (!username || !email || !password) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' })
      return
    }
    
    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      res.status(400).json({ error: 'USERNAME_LENGTH_INVALID' })
      return
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'EMAIL_FORMAT_INVALID' })
      return
    }
    
    // 验证密码强度
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({ error: 'PASSWORD_STRENGTH_INVALID' })
      return
    }
    
    // 简化注册流程：直接生成JWT令牌，不依赖数据库
    const userId = Date.now()
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: userId.toString(), email, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    // 返回用户信息和令牌
    res.status(201).json({
      ok: true,
      token,
      user: {
        id: userId.toString(),
        username,
        email
      }
    })
  } catch (e: any) {
    console.error('注册失败:', e.message)
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}