import { useTheme } from '@/hooks/useTheme'

export default function Privacy() {
  const { isDark } = useTheme()
  return (
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题与说明 */}
        <h1 className="text-2xl font-bold mb-3">隐私政策</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 text-sm`}>
          我们重视您的隐私保护，以下是我们的隐私政策说明。
        </p>

        {/* 隐私政策内容 */}
        <section className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <h2 className="font-medium mb-1">信息收集与使用</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                我们收集必要的个人信息用于账户管理、服务提供和个性化推荐。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">数据存储与保护</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                我们采用行业标准的安全措施保护您的数据，防止未授权访问和泄露。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">信息共享</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                我们不会向第三方出售您的个人信息，仅在必要时与合作伙伴共享。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">您的权利</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                您有权访问、修改、删除您的个人信息，或选择退出某些数据收集。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">政策更新</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                我们可能会不时更新隐私政策，更新后将在平台上公布。
              </p>
            </li>
          </ol>
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-6`}>
            生效日期：2025-01-01
          </div>
        </section>
      </main>
  )
}