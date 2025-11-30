import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface InterestTagsSelectorProps {
  value: string[]
  onChange: (tags: string[]) => void
}

const ALL_TAGS = ['国潮爱好者', '非遗迷', '插画控', '视频剪辑', '包装设计', '纹样研究', '文创产品']

export default function InterestTagsSelector({ value, onChange }: InterestTagsSelectorProps) {
  const { isDark } = useTheme()
  const [selected, setSelected] = useState<string[]>(value)
  const toggle = (t: string) => {
    const next = selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]
    setSelected(next)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <div className="text-sm">兴趣标签</div>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map(t => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={`px-3 py-1 rounded-full text-sm border ${selected.includes(t) ? 'bg-red-600 text-white border-red-600' : isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
