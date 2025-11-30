import { useTheme } from '@/hooks/useTheme'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const DATA = [
  { name: '生成数', value: 120 },
  { name: '纯正平均分', value: 82 },
  { name: '转化率', value: 18 },
]

export default function AdminAnalytics() {
  const { isDark } = useTheme()
  const exportExcel = () => {
    const rows = [
      ['指标', '数值'],
      ...DATA.map(d => [d.name, String(d.value)])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">企业端数据分析</h1>
          <button onClick={exportExcel} className="bg-red-600 text-white px-4 py-2 rounded-lg">导出Excel</button>
        </div>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }} axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }} />
                <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }} axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '0.5rem', color: isDark ? '#ffffff' : '#000000' }} />
                <Bar dataKey="value" name="数值" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  )
}
