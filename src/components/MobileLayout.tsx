import { useState, useContext, useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import clsx from 'clsx'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {} } = useTheme()
  const { isAuthenticated, user, logout } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    // 滚动监听
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
      // 计算滚动进度
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 页面切换时隐藏搜索框
  useEffect(() => {
    setShowSearch(false)
  }, [location.pathname])

  // 处理语音搜索
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('您的浏览器不支持语音搜索功能')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onstart = () => {
      toast.info('正在倾听...')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
      setIsListening(false)
      toast.success(`识别结果: ${transcript}`)
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech') {
        toast.error('语音识别失败，请重试')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      toast.warning('请输入搜索关键词')
      return
    }
    const encodedSearch = encodeURIComponent(search.trim())
    navigate(`/explore?search=${encodedSearch}`)
    setSearch('')
    setShowSearch(false)
  }

  // 预取路由
  const prefetchRoute = (path: string) => {
    if (path === location.pathname || isPrefetched(path)) return
    markPrefetched(path)
  }

  return (
    <div className={clsx(
      'min-h-screen flex flex-col',
      isDark ? 'bg-gray-900 text-white' : 
      theme === 'pink' ? 'bg-pink-50 text-pink-900' : 
      'bg-gray-50 text-gray-900'
    )}>
      {/* 滚动进度指示器 */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
        <div 
          className={clsx(
            'h-full transition-all duration-100 ease-out rounded-full',
            isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 
            theme === 'pink' ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 
            'bg-gradient-to-r from-orange-500 to-red-500'
          )}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* 顶部搜索栏 */}
      {showSearch ? (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-3 px-4 shadow-md transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 
          theme === 'pink' ? 'bg-pink-100/90 backdrop-blur-xl border-pink-200' : 
          'bg-white/90 backdrop-blur-xl border-gray-200'
        )}>
          <div className="relative flex items-center">
            <button
              onClick={() => setShowSearch(false)}
              className={clsx(
                'mr-3 p-2 rounded-full transition-colors duration-200',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label="关闭搜索"
            >
              <i className="fas fa-times"></i>
            </button>
            <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isDark ? '搜索...' : theme === 'pink' ? '搜索创意作品、素材或用户' : '搜索创意作品、素材或用户'}
                      className={clsx(
                        'w-full pl-10 pr-14 py-2 rounded-full focus:outline-none focus:ring-2 transition-all duration-300',
                        isDark ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500' : 
                        theme === 'pink' ? 'bg-pink-200 text-pink-900 placeholder-pink-700 focus:ring-pink-500' : 
                        'bg-gray-200 text-gray-900 placeholder-gray-700 focus:ring-orange-500'
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      <i className={clsx(
                        'fas fa-search',
                        isDark ? 'text-gray-400' : 
                        theme === 'pink' ? 'text-pink-500' : 
                        'text-orange-500'
                      )}></i>
                    </div>
                    {/* 语音搜索按钮 */}
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={clsx(
                        'absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200',
                        isListening 
                          ? (isDark ? 'bg-red-500 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white')
                          : (isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 'text-gray-700 hover:bg-gray-200')
                      )}
                      aria-label="语音搜索"
                    >
                      <i className={`fas ${isListening ? 'fa-microphone-slash animate-pulse' : 'fa-microphone'}`}></i>
                    </button>
                  </div>
                </form>
          </div>
        </div>
      ) : (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-3 px-4 shadow-md transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 
          theme === 'pink' ? 'bg-pink-100/90 backdrop-blur-xl border-pink-200' : 
          'bg-white/90 backdrop-blur-xl border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <NavLink
                to="/"
                onTouchStart={() => prefetchRoute('/')}
                className={clsx(
                  'flex items-center space-x-2',
                  isDark ? 'text-white' : 
                  theme === 'pink' ? 'text-pink-900' : 
                  'text-gray-900'
                )}
              >
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold',
                  isDark ? 'bg-blue-500' : 
                  theme === 'pink' ? 'bg-pink-500' : 
                  'bg-orange-500'
                )}>
                  {isDark ? '津' : theme === 'pink' ? '智' : '坊'}
                </div>
                <span className="text-xl font-bold">津脉智坊</span>
              </NavLink>
            </div>
            
            {/* 右侧按钮组 */}
            <div className="flex items-center space-x-3">
              {/* 搜索按钮 */}
              <button
                onClick={() => setShowSearch(true)}
                className={clsx(
                  'p-2 rounded-full transition-colors duration-200',
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="搜索"
              >
                <i className="fas fa-search"></i>
              </button>
              
              {/* 通知按钮 */}
              <button
                className={clsx(
                  'p-2 rounded-full relative transition-colors duration-200',
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="通知"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* 用户菜单 */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button
                    className={clsx(
                      'flex items-center space-x-2 p-2 rounded-full transition-colors duration-200',
                      isDark ? 'text-gray-300 hover:bg-gray-800' : 
                      theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                      'text-gray-700 hover:bg-gray-200'
                    )}
                    aria-label="用户菜单"
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-full overflow-hidden border-2',
                      isDark ? 'border-gray-700' : 
                      theme === 'pink' ? 'border-pink-300' : 
                      'border-gray-300'
                    )}>
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={clsx(
                          'w-full h-full flex items-center justify-center text-white font-bold text-lg',
                          isDark ? 'bg-gray-800' : 
                          theme === 'pink' ? 'bg-pink-300' : 
                          'bg-gray-300'
                        )}>
                          {user?.username?.charAt(0) || '用'}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* 下拉菜单 */}
                  <div className={clsx(
                    'absolute right-0 mt-2 w-48 rounded-lg shadow-xl ring-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2',
                    isDark ? 'bg-gray-800 ring-gray-700' : 
                    theme === 'pink' ? 'bg-pink-100 ring-pink-200' : 
                    'bg-white ring-gray-200'
                  )}>
                    <div className="py-2">
                      <NavLink
                        to="/dashboard"
                        onTouchStart={() => prefetchRoute('/dashboard')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-user mr-2"></i>
                        个人中心
                      </NavLink>
                      <NavLink
                        to="/create"
                        onTouchStart={() => prefetchRoute('/create')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-paint-brush mr-2"></i>
                        创作作品
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onTouchStart={() => prefetchRoute('/settings')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-cog mr-2"></i>
                        设置
                      </NavLink>
                      <div className={clsx(
                        'border-t my-2',
                        isDark ? 'border-gray-700' : 
                        theme === 'pink' ? 'border-pink-200' : 
                        'border-gray-200'
                      )}></div>
                      <button
                        onClick={() => {
                          logout()
                          navigate('/login')
                          toast.success('退出登录成功')
                        }}
                        className={clsx(
                          'w-full text-left px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-red-400 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-red-700 hover:bg-pink-200' : 
                          'text-red-700 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 未登录状态 */
                <NavLink
                  to="/login"
                  onTouchStart={() => prefetchRoute('/login')}
                  className={clsx(
                    'px-4 py-2 rounded-full font-medium transition-all duration-200',
                    isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                    theme === 'pink' ? 'bg-pink-500 text-white hover:bg-pink-600' : 
                    'bg-orange-500 text-white hover:bg-orange-600'
                  )}
                >
                  登录
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      {/* 底部导航 */}
      <nav className={clsx(
        'fixed bottom-0 inset-x-0 md:hidden z-40 transform transition-all duration-300 ease-in-out shadow-2xl',
        isDark ? 'bg-[#0b0e13]/90 backdrop-blur-xl ring-1 ring-gray-800/70' : 
        theme === 'pink' ? 'bg-white/90 backdrop-blur-xl ring-1 ring-pink-200/70' : 
        'bg-white/90 backdrop-blur-xl ring-1 ring-gray-200/70'
      )} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className="grid grid-cols-5 text-xs px-2 py-1">
          <li className="flex items-center justify-center">
            <NavLink 
              to="/" 
              onTouchStart={() => prefetchRoute('/')}
              aria-label="首页"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-home text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>首页</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('/explore')}
              aria-label="探索"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-compass text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>探索</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/community?context=cocreation&tab=joined"
              onTouchStart={() => prefetchRoute('/community')}
              aria-label="社群"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-comments text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>社群</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/create"
              onTouchStart={() => prefetchRoute('/create')}
              aria-label="创作"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-130 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-130')}>
                      <i className="fas fa-plus text-xl font-bold"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>创作</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/neo"
              onTouchStart={() => prefetchRoute('/neo')}
              aria-label="灵感"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-bolt text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>灵感</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}