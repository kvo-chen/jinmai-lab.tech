import type { VercelRequest, VercelResponse } from 'vercel'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userDB } from '../../server/database.mjs'

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
    console.log('收到注册请求:', { method: req.method, path: req.url })
    
    const { username, email, password } = req.body || {}
    
    console.log('注册请求参数:', { username, email, hasPassword: !!password })
    
    // 验证必填字段
    if (!username || !email || !password) {
      console.log('注册失败: 缺少必填字段')
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS', message: '用户名、邮箱和密码为必填字段' })
      return
    }
    
    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      console.log('注册失败: 用户名长度无效')
      res.status(400).json({ error: 'USERNAME_LENGTH_INVALID', message: '用户名长度必须在2-20个字符之间' })
      return
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('注册失败: 邮箱格式无效')
      res.status(400).json({ error: 'EMAIL_FORMAT_INVALID', message: '请输入有效的邮箱地址' })
      return
    }
    
    // 验证密码强度
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      console.log('注册失败: 密码强度不足')
      res.status(400).json({ error: 'PASSWORD_STRENGTH_INVALID', message: '密码至少6个字符，包含至少一个大写字母和一个数字' })
      return
    }
    
    // 初始化PostgreSQL
    console.log('初始化PostgreSQL...')
    await initPostgreSQL()
    
    // 获取PostgreSQL连接池
    const pool = getPostgreSQL()
    
    // 检查用户名是否已存在
    console.log('检查用户名是否已存在:', username)
    const existingUserByUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    if (existingUserByUsername.rows.length > 0) {
      console.log('注册失败: 用户名已存在')
      res.status(409).json({ error: 'USERNAME_ALREADY_EXISTS', message: '该用户名已被使用' })
      return
    }
    
    // 检查邮箱是否已存在
    console.log('检查邮箱是否已存在:', email)
    const existingUserByEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existingUserByEmail.rows.length > 0) {
      console.log('注册失败: 邮箱已存在')
      res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS', message: '该邮箱已被注册' })
      return
    }
    
    // 哈希密码
    console.log('哈希密码...')
    const saltRounds = 10
    const passwordHash = await bcryptjs.hash(password, saltRounds)
    
    // 创建用户
    console.log('创建用户...')
    const now = Date.now()
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, passwordHash, now, now]
    )
    
    const userId = result.rows[0].id.toString()
    console.log('用户创建成功:', { userId, username, email })
    
    // 生成JWT令牌
    console.log('生成JWT令牌...')
    const token = jwt.sign(
      { userId, email, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    // 返回用户信息和令牌
    console.log('注册成功，返回响应...')
    res.status(201).json({
      ok: true,
      token,
      user: {
        id: userId,
        username,
        email
      }
    })
  } catch (e: any) {
    console.error('注册失败:', e)
    console.error('错误详情:', { message: e.message, stack: e.stack })
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN' 
    })
  }
}