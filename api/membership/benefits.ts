import type { VercelRequest, VercelResponse } from '@vercel/node'
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
    // 定义会员权益
    const benefits = {
      free: [
        { id: 1, name: '基础AI创作功能', description: '每天可生成10次AI作品' },
        { id: 2, name: '基础社区功能', description: '可参与社区讨论和点赞' },
        { id: 3, name: '基础作品存储', description: '可存储100个作品' },
        { id: 4, name: '基础模板库', description: '可使用免费模板' }
      ],
      premium: [
        { id: 1, name: '无限AI生成次数', description: '无限制生成AI作品' },
        { id: 2, name: '高级AI模型访问', description: '可使用高级AI模型' },
        { id: 3, name: '高清作品导出', description: '支持高清作品导出' },
        { id: 4, name: '优先处理队列', description: 'AI生成优先处理' },
        { id: 5, name: '专属模板库', description: '可使用专属模板' },
        { id: 6, name: '去除水印', description: '生成作品无水印' },
        { id: 7, name: '高级社区功能', description: '可创建专题讨论' },
        { id: 8, name: '扩大作品存储', description: '可存储1000个作品' }
      ],
      vip: [
        { id: 1, name: '无限AI生成次数', description: '无限制生成AI作品' },
        { id: 2, name: '高级AI模型访问', description: '可使用高级AI模型' },
        { id: 3, name: '高清作品导出', description: '支持高清作品导出' },
        { id: 4, name: '优先处理队列', description: 'AI生成优先处理' },
        { id: 5, name: '专属模板库', description: '可使用专属模板' },
        { id: 6, name: '去除水印', description: '生成作品无水印' },
        { id: 7, name: '专属AI训练模型', description: '可训练专属AI模型' },
        { id: 8, name: '一对一设计师服务', description: '获得专业设计师指导' },
        { id: 9, name: '商业授权', description: '作品可用于商业用途' },
        { id: 10, name: '专属活动邀请', description: '受邀参加专属活动' },
        { id: 11, name: '无限作品存储', description: '无限制作品存储' },
        { id: 12, name: '高级数据分析', description: '获得作品数据分析报告' }
      ]
    }
    
    // 返回会员权益
    return sendSuccessResponse(res, { benefits })
  } catch (e: any) {
    console.error('获取会员权益失败:', e.message)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}
