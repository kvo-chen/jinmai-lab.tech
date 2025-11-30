import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { toast } from 'sonner'

type FooterProps = {
  variant?: 'full' | 'simple'
  simpleText?: string
}

export default function Footer({ variant = 'full', simpleText }: FooterProps) {
  const { isDark } = useTheme()
  const [email, setEmail] = useState('')

  const handleSubscribe = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const v = email.trim()
    if (!v) { toast.warning('请输入邮箱'); return }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    if (!ok) { toast.error('邮箱格式不正确'); return }
    toast.success('订阅成功，感谢关注')
    setEmail('')
  }

  if (variant === 'simple') {
    return (
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{simpleText || '© 2025 津脉智坊. 保留所有权利'}</p>
        </div>
      </footer>
    )
  }

  return (
    <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-12 px-4`}>
      <div className="container mx-auto">
        <div className="h-px bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500/80 opacity-30 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center space-x-1 mb-4">
              <span className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>津脉</span>
              <span className="text-xl font-bold">智坊</span>
            </Link>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>津门老字号共创平台，连接传统与创新</p>
            <div className="flex space-x-4">
              {[
                { key: 'weibo', icon: 'weibo', color: 'text-red-500', label: '微博' },
                { key: 'weixin', icon: 'weixin', color: 'text-green-500', label: '微信' },
                { key: 'instagram', icon: 'instagram', color: 'text-pink-500', label: 'Instagram' },
                { key: 'twitter', icon: 'twitter', color: 'text-blue-500', label: 'Twitter' }
              ].map(({ key, icon, color, label }) => (
                <a
                  key={key}
                  href="#"
                  aria-label={label}
                  className={`text-lg ${color} opacity-70 hover:opacity-100 transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-gray-700 focus:ring-offset-gray-900' : 'focus:ring-gray-300 focus:ring-offset-white'}`}
                >
                  <i className={`fab fa-${icon}`}></i>
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">平台功能</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link to="/tools" className="hover:text-red-600 transition-colors">AI创作工具</Link></li>
              <li><Link to="/explore" className="hover:text-red-600 transition-colors">作品展示</Link></li>
              <li><Link to="/square" className="hover:text-red-600 transition-colors">创作者社区</Link></li>
              <li><Link to="/brand" className="hover:text-red-600 transition-colors">品牌合作</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">资源中心</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link to="/wizard" className="hover:text-red-600 transition-colors">创作教程</Link></li>
              <li><Link to="/knowledge" className="hover:text-red-600 transition-colors">文化知识库</Link></li>
              <li><Link to="/about" className="hover:text-red-600 transition-colors">版权说明</Link></li>
              <li><Link to="/about" className="hover:text-red-600 transition-colors">常见问题</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">联系我们</h4>
            <ul className="space-y-2 opacity-70">
              <li className="flex items-center"><i className="fas fa-envelope mr-2"></i><a href="mailto:contact@jinmaizhifang.com" className="hover:text-red-600 transition-colors">contact@jinmaizhifang.com</a></li>
              <li className="flex items-center"><i className="fas fa-phone mr-2"></i><span>400-123-4567</span></li>
              <li className="flex items-center"><i className="fas fa-map-marker-alt mr-2"></i><span>北京市海淀区中关村大街</span></li>
            </ul>
          </div>
        </div>

        <div className={`mt-10 p-4 rounded-xl ring-1 ${isDark ? 'ring-gray-800 bg-gray-900' : 'ring-gray-200 bg-white'} flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
          <div>
            <h4 className="font-bold">订阅平台更新</h4>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>获取精选作品与活动通知</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <label htmlFor="subscribe-email" className="sr-only">邮箱</label>
            <input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入你的邮箱"
              className={`${isDark ? 'bg-gray-800 text-white placeholder:text-gray-400 ring-gray-700' : 'bg-gray-50 text-gray-900 placeholder:text-gray-500 ring-gray-200'} flex-1 px-3 py-2 rounded-md ring-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-600'}`}
            />
            <button type="submit" className={`px-4 py-2 rounded-md font-medium ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>订阅</button>
          </form>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 md:mb-0`}>© 2025 津脉智坊. 保留所有权利</p>
          <div className="flex items-center space-x-6">
            <div className="flex space-x-6 opacity-60">
              <Link to="/about" className="hover:opacity-100 transition-opacity">隐私政策</Link>
              <Link to="/about" className="hover:opacity-100 transition-opacity">服务条款</Link>
              <Link to="/about" className="hover:opacity-100 transition-opacity">Cookie政策</Link>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`ml-2 px-3 py-1 rounded-md text-sm ring-1 ${isDark ? 'ring-gray-700 hover:bg-gray-800' : 'ring-gray-300 hover:bg-gray-100'}`}
              aria-label="回到顶部"
              title="回到顶部"
            >
              回到顶部
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

