import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface OnboardingGuideProps {
  isOpen: boolean
  onClose: (completed: boolean) => void
}

export default function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const guideRef = useRef<HTMLDivElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  // 中文注释：焦点管理，确保打开时焦点在引导窗口内
  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点
      const previousFocus = document.activeElement as HTMLElement
      
      // 焦点移到引导窗口
      if (guideRef.current) {
        guideRef.current.focus()
      }
      
      // 中文注释：处理键盘导航
      const handleKeyDown = (e: KeyboardEvent) => {
        // 按ESC关闭
        if (e.key === 'Escape') {
          e.preventDefault()
          skip()
        }
        // 按右箭头或Enter/空格前进
        if ((e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') && !completed) {
          e.preventDefault()
          next()
        }
        // 按左箭头后退
        if (e.key === 'ArrowLeft' && step > 0) {
          e.preventDefault()
          setStep(prev => prev - 1)
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      // 中文注释：组件关闭时恢复焦点
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus()
        }
      }
    }
  }, [isOpen, step, completed])

  // 中文注释：步骤变化时焦点到下一步按钮
  useEffect(() => {
    if (nextButtonRef.current && isOpen) {
      nextButtonRef.current.focus()
    }
  }, [step, isOpen])// 中文注释：新手引导的步骤配置（标题、副文案、主按钮动作）
  const steps: Array<{ title: string; desc: string; action?: () => void; primaryText?: string; icon?: string }>
    = [
      { title: '欢迎加入 AI 共创平台', desc: '我们将用 5 步带你快速上手平台核心玩法', icon: 'rocket' },
      { title: '探索灵感', desc: '在“作品探索”页浏览精选作品与主题合集，获取创作灵感', action: () => navigate('/explore'), primaryText: '去探索', icon: 'compass' },
      { title: '开始创作', desc: '在“创作中心”使用 AI 工具生成你的专属作品，体验AI创作魔力', action: () => navigate('/create'), primaryText: '去创作', icon: 'palette' },
      { title: 'AI协作模式', desc: '使用AI协作面板与AI进行多轮对话，完善你的创意细节', action: () => navigate('/lab'), primaryText: '去体验', icon: 'robot' },
      { title: '参与社群', desc: '加入感兴趣的社群，分享作品获取反馈，与创作者一起成长', action: () => navigate('/community'), primaryText: '进社群', icon: 'users' },
      { title: '个性化设置', desc: '在“设置”中选择适合你创作风格的AI模型，打造专属创作环境', action: () => navigate('/settings'), primaryText: '去设置', icon: 'cog' },
    ]

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      // 中文注释：显示完成页面
      setCompleted(true)
    }
  }

  const handleComplete = () => {
    // 中文注释：完成所有步骤，触发完成回调与奖励提示
    toast.success(
      <div className="flex items-center space-x-2">
        <i className="fas fa-trophy text-yellow-400 text-xl" />
        <div>
          <div className="font-bold">新手引导已完成！</div>
          <div className="text-sm opacity-80">获得 50 积分奖励</div>
        </div>
      </div>
    )
    onClose(true)
  }

  const skip = () => {
    onClose(false)
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.div
            className={`relative w-full max-w-2xl rounded-3xl p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-2xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} overflow-hidden`}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 中文注释：顶部装饰条 */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500`} />
            
            <div 
              className="relative"
              ref={guideRef}
              tabIndex={0}
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-title"
              aria-describedby="onboarding-desc"
              aria-live="polite"
            >
              {/* 中文注释：标题和进度信息 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={`fas fa-${steps[step].icon || 'star'}`} />
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-red-600" id="onboarding-title">新手引导</div>
                    <div className="text-xs opacity-60" id="onboarding-desc">快速上手平台核心功能</div>
                  </div>
                </div>
                <button 
                  onClick={skip} 
                  className={`${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-800'} text-sm font-medium transition-all hover:scale-105`}
                  aria-label="跳过新手引导"
                >
                  跳过
                </button>
              </div>

              {/* 中文注释：进度指示器 */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{step + 1} / {steps.length}</span>
                  <span className="text-sm opacity-60">{Math.round(((step + 1) / steps.length) * 100)}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* 中文注释：步骤内容或完成页面 */}
              <AnimatePresence mode="wait">
                {!completed ? (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{steps[step].title}</h2>
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>{steps[step].desc}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    {/* 中文注释：完成动画 */}
                    <motion.div
                      className="w-24 h-24 mx-auto mb-6 relative"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 opacity-20 blur-xl animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-trophy text-5xl text-yellow-500" />
                      </div>
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold mb-3">恭喜你！</h2>
                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>新手引导已完成</p>
                    
                    {/* 中文注释：奖励信息 */}
                    <div className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="text-sm opacity-70 mb-2">获得奖励</div>
                      <div className="flex items-center justify-center space-x-6">
                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="text-3xl font-bold text-yellow-500 mb-1">50</div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>积分</div>
                        </motion.div>
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-400 to-transparent" />
                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="text-3xl font-bold text-blue-500 mb-1">1</div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>成就</div>
                        </motion.div>
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-400 to-transparent" />
                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="text-3xl font-bold text-purple-500 mb-1">✓</div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>解锁</div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* 中文注释：完成后引导 */}
                    <div className="mb-8">
                      <div className="text-sm font-medium mb-4">接下来你可以</div>
                      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
                          <div className="flex items-center justify-center space-x-2">
                            <i className="fas fa-palette text-red-500" />
                            <span className="text-sm font-medium">开始创作</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
                          <div className="flex items-center justify-center space-x-2">
                            <i className="fas fa-compass text-blue-500" />
                            <span className="text-sm font-medium">探索作品</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
                          <div className="flex items-center justify-center space-x-2">
                            <i className="fas fa-users text-green-500" />
                            <span className="text-sm font-medium">加入社群</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
                          <div className="flex items-center justify-center space-x-2">
                            <i className="fas fa-cog text-purple-500" />
                            <span className="text-sm font-medium">个性化设置</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 中文注释：按钮区域 */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                {!completed ? (
                  <>
                    <button
                      onClick={skip}
                      className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-5 py-3 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 shadow-sm`}
                    >
                      以后再说
                    </button>

                    <div className="flex items-center space-x-4">
                      {steps[step].action && (
                        <motion.button
                          onClick={steps[step].action}
                          className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium shadow-md hover:shadow-lg"
                          whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-arrow-right mr-2" />
                          {steps[step].primaryText || '前往'}
                        </motion.button>
                      )}
                      <motion.button
                        ref={nextButtonRef}
                        onClick={next}
                        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all font-medium shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={step < steps.length - 1 ? '进入下一步' : '完成新手引导'}
                        aria-current={step === steps.length - 1 ? 'step' : undefined}
                      >
                        {step < steps.length - 1 ? (
                          <>
                            下一步
                            <i className="fas fa-chevron-right ml-2" />
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2" />
                            完成
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <motion.button
                    onClick={handleComplete}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white transition-all font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="开始创作之旅"
                    ref={nextButtonRef}
                  >
                    开始创作之旅
                    <i className="fas fa-rocket ml-2" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

