import { useTheme } from '@/hooks/useTheme'

export default function Neo() {
  const { isDark } = useTheme()
  
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold">津门·灵感引擎</h1>
        <p className="text-gray-600 dark:text-gray-300">基于AI的天津文化创意内容生成平台</p>
      </main>
    </div>
  )
}