import { useState, useMemo, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { scoreAuthenticity } from '@/services/authenticityService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function Authenticity() {
  const { isDark } = useTheme()
  const [input, setInput] = useState('把麻花做成赛博朋克风')
  const [knowledge, setKnowledge] = useState('桂发祥麻花传统工艺强调多褶形态、香酥口感与津味表达')
  const result = scoreAuthenticity(input, knowledge)
  const [acks, setAcks] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem('AUTH_FEEDBACK_ACKS')
      return s ? JSON.parse(s) : {}
    } catch {
      return {}
    }
  })
  useEffect(() => {
    try { localStorage.setItem('AUTH_FEEDBACK_ACKS', JSON.stringify(acks)) } catch {}
  }, [acks])
  const toggleAck = (msg: string) => {
    setAcks(prev => ({ ...prev, [msg]: !prev[msg] }))
  }
  const tokens = useMemo(() => {
    const tk = (s: string) => s.toLowerCase().split(/[^a-zA-Z0-9\u4e00-\u9fa5]+/).filter(Boolean)
    const a = tk(input), b = tk(knowledge)
    const freqA: Record<string, number> = {}
    const freqB: Record<string, number> = {}
    a.forEach(t => freqA[t] = (freqA[t] || 0) + 1)
    b.forEach(t => freqB[t] = (freqB[t] || 0) + 1)
    const all = Array.from(new Set([...a, ...b]))
    const common = all.filter(t => (freqA[t] || 0) && (freqB[t] || 0))
    const uniqueA = all.filter(t => (freqA[t] || 0) && !(freqB[t] || 0))
    const uniqueB = all.filter(t => (freqB[t] || 0) && !(freqA[t] || 0))
    const top = common
      .map(t => ({ token: t, input: freqA[t], knowledge: freqB[t] }))
      .sort((x, y) => (y.input + y.knowledge) - (x.input + x.knowledge))
      .slice(0, 10)
    return { top, commonCount: common.length, uniqueA: uniqueA.length, uniqueB: uniqueB.length }
  }, [input, knowledge])
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">纯正性检查与评分</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">输入内容</div>
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-32 px-4 py-3 rounded-lg border`} 
              autoCapitalize="none" 
              autoCorrect="off" 
              enterKeyHint="send" 
              inputMode="text"
            />
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">知识库内容</div>
            <textarea 
              value={knowledge} 
              onChange={(e) => setKnowledge(e.target.value)} 
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-32 px-4 py-3 rounded-lg border`} 
              autoCapitalize="none" 
              autoCorrect="off" 
              enterKeyHint="send" 
              inputMode="text"
            />
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">评分</div>
            <div className="text-3xl font-bold">{result.score}</div>
            <div className="mt-3 text-sm">阈值≥70%</div>
            <ul className="mt-3 text-sm">
              {result.feedback.map((f, i) => (
                <li key={i} className="mb-2 flex items-center justify-between">
                  <span>{f}</span>
                  <button
                    onClick={() => toggleAck(f)}
                    className={`text-xs px-3 py-2 rounded-full min-h-[44px] ${acks[f] ? 'bg-green-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                  >{acks[f] ? '已优化' : '标记已优化'}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-4 font-medium">共同关键词频次对比</div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={tokens.top}>
                  <XAxis dataKey="token" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="input" fill="#f87171" name="输入" />
                  <Bar dataKey="knowledge" fill="#60a5fa" name="知识库" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-4 font-medium">关键词组成比例</div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie dataKey="value" data={[
                    { name: '共同', value: tokens.commonCount },
                    { name: '仅输入', value: tokens.uniqueA },
                    { name: '仅知识库', value: tokens.uniqueB }
                  ]} outerRadius={100} label>
                    <Cell fill="#34d399" />
                    <Cell fill="#f87171" />
                    <Cell fill="#60a5fa" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
