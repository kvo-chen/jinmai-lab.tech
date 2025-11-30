import { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { markPrefetched, isPrefetched } from '@/services/prefetch'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout, updateUser } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sidebarWidth')
    // 中文注释：默认侧边栏更窄（180px），并将可拖拽的最小宽度下调到 180px
    return saved ? Math.min(Math.max(parseInt(saved), 180), 320) : 180
  })
  const dragging = useRef(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  // 中文注释：通知数据类型与状态管理
  interface Notification {
    id: string
    title: string
    description?: string
    time: string
    read: boolean
    type?: 'info' | 'success' | 'warning'
  }
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) return JSON.parse(stored)
    } catch {}
    return [
      { id: 'n1', title: '欢迎回来', description: '每日签到可领取奖励', time: '刚刚', read: false, type: 'success' },
      { id: 'n2', title: '系统更新', description: '创作中心新增AI文案优化', time: '1 小时前', read: false, type: 'info' },
      { id: 'n3', title: '新教程上线', description: '杨柳青年画入门视频', time: '昨天', read: true, type: 'info' },
    ]
  })
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch {}
  }, [notifications])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!notifRef.current) return
      if (!notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  // 中文注释：用户头像菜单相关状态与引用
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  // 中文注释：点击外部关闭用户菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])
  // 中文注释：处理更换头像文件上传
  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      if (url) {
        updateUser({ avatar: url })
      }
    }
    reader.readAsDataURL(file)
    setShowUserMenu(false)
    e.target.value = ''
  }

  // 中文注释：侧边栏最小宽度从 200px 调整为 180px，使默认更紧凑
  const minW = 180
  const maxW = 320

  const onMouseDown = () => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
  }

  // 中文注释：路由预加载优化——避免重复import，提高交互性能与稳定性
  const prefetchRoute = (path: string, ttlMs = 60000) => {
    const key = (() => {
      if (path === '/') return 'home'
      const k = path.replace(/^\//, '')
      return k || 'home'
    })()
    if (isPrefetched(key)) return
    switch (path) {
      case '/': import('@/pages/Home'); markPrefetched('home', ttlMs); break
      case '/explore': import('@/pages/Explore'); markPrefetched('explore', ttlMs); break
      case '/create': import('@/pages/Create'); markPrefetched('create', ttlMs); break
      case '/tools': import('@/pages/Tools'); markPrefetched('tools', ttlMs); break
      case '/neo': import('@/pages/Neo'); markPrefetched('neo', ttlMs); break
      case '/wizard': import('@/pages/Wizard'); markPrefetched('wizard', ttlMs); break
      case '/square': import('@/pages/Square'); markPrefetched('square', ttlMs); break
      case '/community': import('@/pages/Community'); markPrefetched('community', ttlMs); break
      case '/knowledge': import('@/pages/CulturalKnowledge'); markPrefetched('knowledge', ttlMs); break
      case '/tianjin': import('@/components/TianjinCreativeActivities'); markPrefetched('tianjin', ttlMs); break
      case '/brand': import('@/pages/BrandGuide'); markPrefetched('brand', ttlMs); break
      case '/about': import('@/pages/About'); markPrefetched('about', ttlMs); break
      default: break
    }
  }

  // 中文注释：在浏览器空闲时优先预加载“共创向导”，保障首次进入体验
  useEffect(() => {
    const idle = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 500))
    const handle = idle(() => prefetchRoute('/wizard', 300000))
    return () => {
      // 中文注释：兼容不同idle实现，简单清理
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || collapsed) return
      const next = Math.min(Math.max(width + e.movementX, minW), maxW)
      setWidth(next)
      localStorage.setItem('sidebarWidth', String(next))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = 'default'
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [width, collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement && (document.activeElement as HTMLElement).tagName) || ''
      const isTyping = ['INPUT', 'TEXTAREA'].includes(tag)
      if (e.key === 't') {
        toggleTheme()
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'b') {
        setCollapsed((c) => !c)
      }
      if (!isTyping) {
        const map: Record<string, string> = {
          '1': '/',
          '2': '/explore',
          '3': '/tools',
          '4': '/neo',
          '5': '/wizard',
          '6': '/square',
          '7': '/knowledge',
          '8': '/tianjin',
          '9': '/brand',
          '0': '/about',
        }
        const dest = map[e.key]
        if (dest) {
          prefetchRoute(dest)
          navigate(dest)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme])

  const navItemClass = useMemo(() => (
    `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 active:scale-95`
  ), [isDark])

  const activeClass = useMemo(() => (
    `${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm'}`
  ), [isDark])

  const title = useMemo(() => {
    const p = location.pathname
    if (p === '/') return '首页'
    if (p.startsWith('/explore')) return '探索作品'
    if (p.startsWith('/tools')) return '创作中心'
    if (p.startsWith('/about')) return '关于我们'
    if (p.startsWith('/knowledge')) return '文化知识库'
    if (p.startsWith('/tianjin')) return '天津特色专区'
    if (p.startsWith('/square')) return '共创广场'
    if (p.startsWith('/community')) {
      const sp = new URLSearchParams(location.search)
      const ctx = sp.get('context')
      return ctx === 'cocreation' ? '共创社群' : '创作者社区'
    }
    if (p.startsWith('/brand')) return '品牌合作'
    if (p.startsWith('/dashboard')) return '控制台'
    if (p.startsWith('/create')) return '创作中心'
    if (p.startsWith('/drafts')) return '草稿箱'
    // 中文注释：为生成页提供明确的顶部标题显示
    if (p.startsWith('/generate')) return 'AI生成引擎'
    if (p.startsWith('/neo')) return '灵感引擎'
    if (p.startsWith('/wizard')) return '共创向导'
    if (p.startsWith('/admin')) return '管理控制台'
    return '津脉智坊'
  }, [location.pathname, location.search])

  const onSearchSubmit = () => {
    if (!search.trim()) return
    navigate(`/explore?q=${encodeURIComponent(search.trim())}`)
  }

  // 中文注释：共创社群模块展开状态与快捷导航方法
  const [communityOpen, setCommunityOpen] = useState(true)
  const gotoCommunity = (path?: string) => {
    const target = '/community' + (path ? path : '')
    navigate(target)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex`}> 
      <aside 
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r relative ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`} 
        style={{ width: collapsed ? 72 : width }}
      >
        <div className="px-3 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>津脉</span>
            {!collapsed && <span className="font-bold">智坊</span>}
          </div>
          <button
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="折叠侧边栏"
          >
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        <nav className="px-2 space-y-1">
          <NavLink to="/" title={collapsed ? '首页' : undefined} onMouseEnter={() => prefetchRoute('/') } className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-home mr-2"></i>
            {!collapsed && '首页'}
          </NavLink>
          <NavLink to="/explore" title={collapsed ? '探索作品' : undefined} onMouseEnter={() => prefetchRoute('/explore')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-compass mr-2"></i>
            {!collapsed && '探索作品'}
          </NavLink>
          <NavLink to="/tools" title={collapsed ? '创作中心' : undefined} onMouseEnter={() => prefetchRoute('/tools')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-tools mr-2"></i>
            {!collapsed && '创作中心'}
          </NavLink>
          <NavLink to="/neo" title={collapsed ? '灵感引擎' : undefined} onMouseEnter={() => prefetchRoute('/neo')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-bolt mr-2"></i>
            {!collapsed && '灵感引擎'}
          </NavLink>
          {/* 中文注释：为“共创向导”导航项补充辅助功能与预加载触发，提升可访问性与响应速度 */}
          <NavLink 
            to="/wizard" 
            title={collapsed ? '共创向导' : undefined} 
            aria-label={collapsed ? '共创向导' : undefined}
            data-discover="true"
            onMouseEnter={() => prefetchRoute('/wizard', 300000)} 
            onFocus={() => prefetchRoute('/wizard', 300000)}
            onTouchStart={() => prefetchRoute('/wizard', 300000)}
            className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}
          > 
            <i className="fas fa-hat-wizard mr-2"></i>
            {!collapsed && '共创向导'}
          </NavLink>
          <NavLink to="/square" title={collapsed ? '共创广场' : undefined} onMouseEnter={() => prefetchRoute('/square')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-th-large mr-2"></i>
            {!collapsed && '共创广场'}
          </NavLink>
          {!collapsed && (
            <NavLink to="/community?context=cocreation&tab=joined" title={collapsed ? '共创社群' : undefined} onMouseEnter={() => prefetchRoute('/community?context=cocreation&tab=joined')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}>
              <i className="fas fa-user-friends mr-2"></i>
              {!collapsed && '共创社群'}
            </NavLink>
          )}
          <NavLink to="/community?context=creator" title={collapsed ? '创作者社区' : undefined} onMouseEnter={() => prefetchRoute('/community?context=creator')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-users mr-2"></i>
            {!collapsed && '创作者社区'}
          </NavLink>
          <NavLink to="/knowledge" title={collapsed ? '文化知识库' : undefined} onMouseEnter={() => prefetchRoute('/knowledge')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-book mr-2"></i>
            {!collapsed && '文化知识库'}
          </NavLink>
          <NavLink to="/tianjin" title={collapsed ? '天津特色专区' : undefined} onMouseEnter={() => prefetchRoute('/tianjin')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-landmark mr-2"></i>
            {!collapsed && '天津特色专区'}
          </NavLink>
          <NavLink to="/brand" title={collapsed ? '品牌合作' : undefined} onMouseEnter={() => prefetchRoute('/brand')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-handshake mr-2"></i>
            {!collapsed && '品牌合作'}
          </NavLink>
          <NavLink to="/about" title={collapsed ? '关于我们' : undefined} onMouseEnter={() => prefetchRoute('/about')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-info-circle mr-2"></i>
            {!collapsed && '关于我们'}
          </NavLink>
        </nav>

        {/* 中文注释：新增“共创社群”模块，提供侧栏内的快速发现与参与入口 */}
        {false && !collapsed && (
          // 中文注释：社群模块外层容器，使用半透明+毛玻璃，让视觉更柔和，不突兀
          <div className={`mx-2 mt-2 mb-24 rounded-xl ring-1 shadow-sm ${
            isDark ? 'ring-gray-700/70 bg-gray-800/80 backdrop-blur-sm' : 'ring-gray-200/70 bg-white/80 backdrop-blur-sm'
          }`}>
            {/* 中文注释：标题行增加圆角与过渡，图标与文字使用较柔的灰色 */}
            <div className={`px-3 py-2 flex items-center justify-between rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <i className={`fas fa-users ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
                <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm font-medium`}>共创社群</span>
              </div>
              <button
                className={`p-2 rounded-lg ring-1 transition duration-200 ${
                  isDark ? 'ring-gray-700/70 hover:bg-gray-700/70' : 'ring-gray-200/70 hover:bg-white/70'
                }`}
                onClick={() => setCommunityOpen(v => !v)}
                aria-expanded={communityOpen}
                aria-label="展开/收起社群模块"
              >
                <i className={`fas ${communityOpen ? 'fa-chevron-up' : 'fa-chevron-down'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>
            {communityOpen && (
              <div className="px-3 pb-3">
                {/* 中文注释：热门话题标签（点击跳转到社群页并附带查询参数） */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => gotoCommunity(`?tag=${encodeURIComponent(tag)}`)}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} hover:opacity-90`}
                    >{tag}</button>
                  ))}
                </div>
                {/* 中文注释：精选社群条目（示例入口），快速加入或查看 */}
                <ul className="space-y-1">
                  {[
                    { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
                    { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
                    { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
                  ].map((g) => (
                    <li key={g.name}>
                      <button
                        onClick={() => gotoCommunity(g.path)}
                        className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      >
                        <span className="text-xs">{g.name}</span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{g.members} 人</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => gotoCommunity('?context=cocreation&tab=joined')}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm hover:bg-gray-50'}`}
                  >进入社群</button>
                  <button
                    onClick={() => gotoCommunity('?context=cocreation&tab=user')}
                    className={`px-2 py-1 text-xs rounded-lg ${isDark ? 'bg-purple-700 text-white hover:bg-purple-600' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                  >创建社群</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 ring-1 ring-gray-600' : 'bg-white hover:bg-gray-50 ring-1 ring-gray-200 shadow-sm'} transition-colors`}
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} mr-2`}></i>
            {!collapsed && '切换主题'}
          </button>
        </div>

        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
        )}
      </aside>
      {/* 移动端遮罩层 */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 bg-black/30 md:hidden"
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0">
        <header className={`sticky top-0 z-40 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} px-4 py-3`}> 
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => setCollapsed(!collapsed)}
                aria-label="切换侧边栏"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <div className="flex items-center space-x-3 w-1/2">
              <div className={`flex-1 rounded-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} px-3 py-2 flex items-center`}>
                <i className={`fas fa-search ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`}></i>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit() }}
                  placeholder="搜索作品、素材或用户"
                  className={`flex-1 outline-none ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                />
                <button
                  onClick={onSearchSubmit}
                  className="ml-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
                >
                  搜索
                </button>
              </div>
              <div className="relative" ref={notifRef}>
                <button
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="通知"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(v => !v)}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="dialog" aria-label="通知列表">
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                      <span className="font-medium">通知</span>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        >全部已读</button>
                        <button
                          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                          onClick={() => setNotifications([])}
                        >清空</button>
                      </div>
                    </div>
                    <ul className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <li className={`${isDark ? 'text-gray-400' : 'text-gray-600'} px-4 py-6 text-sm`}>暂无通知</li>
                      ) : (
                        notifications.map(n => (
                          <li key={n.id}>
                            <button
                              className={`w-full text-left px-4 py-3 flex items-start space-x-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            >
                              <span className={`mt-0.5 inline-flex items-center justify-center w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-red-500'}`}></span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{n.title}</span>
                                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.time}</span>
                                </div>
                                {n.description && (
                                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{n.description}</p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-right`}>
                      <button
                        className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                        onClick={() => setShowNotifications(false)}
                      >关闭</button>
                    </div>
                  </div>
                )}
              </div>
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center space-x-2"
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                    onClick={() => setShowUserMenu(v => !v)}
                  >
                    <img src={user?.avatar} alt={user?.username} className="h-8 w-8 rounded-full" loading="lazy" decoding="async" />
                  </button>
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="menu" aria-label="用户菜单">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm">{user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                      <ul className="py-1">
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/dashboard') }}>个人中心</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/drafts') }}>草稿箱</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/settings') }}>设置</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => fileRef.current?.click()}>更换头像</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={async () => { if (!user?.avatar) return; try { await navigator.clipboard.writeText(user.avatar) } catch {} setShowUserMenu(false) }}>复制头像链接</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={async () => { if (!user?.avatar) return; try { const a = document.createElement('a'); a.href = user.avatar; a.download = 'avatar'; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch {} setShowUserMenu(false) }}>下载头像</button>
                        </li>
                        <li className="border-t border-gray-200">
                          <button className={`w-full text-left px-4 py-2 text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); logout() }}>退出登录</button>
                        </li>
                      </ul>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFileChange} />
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/login" className={`px-3 py-1 rounded-md ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}`}>
                  登录
                </NavLink>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
