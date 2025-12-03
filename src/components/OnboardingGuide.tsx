import { useState } from 'react'
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

  // 中文注释：新手引导的步骤配置（标题、副文案、主按钮动作）
  const steps: Array<{ title: string; desc: string; action?: () => void; primaryText?: string }>
    = [
      { title: '欢迎加入 AI 共创平台', desc: '我们将用 5 步带你快速上手平台核心玩法' },
      { title: '探索灵感', desc: '在“作品探索”页浏览精选作品与主题合集', action: () => navigate('/explore'), primaryText: '去探索' },
      { title: '选择AI模型', desc: '在“设置”中选择适合你创作风格的AI模型，支持模型比较', action: () => navigate('/settings'), primaryText: '去设置' },
      { title: '开始创作', desc: '在“创作中心”使用 AI 工具生成你的作品', action: () => navigate('/create'), primaryText: '去创作' },
      { title: 'AI协作模式', desc: '使用AI协作面板与AI进行多轮对话，完善你的创意', action: () => navigate('/lab'), primaryText: '去体验' },
      { title: '参与社群', desc: '加入你感兴趣的社群，获取反馈与成长', action: () => navigate('/community'), primaryText: '进社群' },
    ]

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      // 中文注释：完成所有步骤，触发完成回调与奖励提示
      toast.success('新手引导已完成，奖励 50 积分')
      onClose(true)
    }
  }

  const skip = () => {
    onClose(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={skip} />
          <motion.div
            className={`relative w-[92%] max-w-xl rounded-2xl p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-2xl border ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-red-600">新手引导</span>
                <span className="text-xs opacity-70">{step + 1} / {steps.length}</span>
              </div>
              <button onClick={skip} className={`${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-800'} text-sm`}>跳过</button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">{steps[step].title}</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{steps[step].desc}</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={skip}
                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg transition-colors`}
              >
                以后再说
              </button>

              <div className="flex items-center space-x-3">
                {steps[step].action && (
                  <button
                    onClick={steps[step].action}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {steps[step].primaryText || '前往'}
                  </button>
                )}
                <button
                  onClick={next}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {step < steps.length - 1 ? '下一步' : '完成'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

