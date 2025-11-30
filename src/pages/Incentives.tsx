import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'

const REWARDS = [
  { id: 1, name: '积分兑红包', description: '1000积分可兑换红包', type: '外在' },
  { id: 2, name: '作品商业化分成', description: '优秀作品可参与分成', type: '外在' },
  { id: 3, name: '成就徽章', description: '完成任务解锁徽章', type: '内在' },
  { id: 4, name: '社交分享', description: '分享至小红书/抖音', type: '内在' },
]

export default function Incentives() {
  const { isDark } = useTheme()
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">激励系统</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {REWARDS.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 * i }} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
              <div className="text-sm opacity-70 mb-1">{r.type}</div>
              <div className="font-bold mb-2">{r.name}</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{r.description}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-sm opacity-70">参考：根据行业报告，此类系统可提升参与率约50%</div>
      </main>
    </div>
  )
}
