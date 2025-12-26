import React, { useCallback, useRef, memo } from 'react'

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  showSuggest: boolean
  setShowSuggest: (value: boolean) => void
  suggestions: string[]
  isDark: boolean
}

// 搜索建议项组件
interface SuggestionItemProps {
  suggestion: string
  isDark: boolean
  onSelect: (suggestion: string) => void
}

const SuggestionItem = memo(({ suggestion, isDark, onSelect }: SuggestionItemProps) => {
  // 预先计算样式类名
  const itemClassName = isDark 
    ? 'hover:bg-gray-700' 
    : 'hover:bg-gray-50'

  const handleSelect = useCallback(() => {
    onSelect(suggestion)
  }, [suggestion, onSelect])

  return (
    <div 
      onMouseDown={handleSelect} 
      className={`${itemClassName} px-3 py-2 text-sm cursor-pointer`}
    >
      {suggestion}
    </div>
  )
})

const SearchBar: React.FC<SearchBarProps> = memo(({
  search,
  setSearch,
  showSuggest,
  setShowSuggest,
  suggestions,
  isDark
}) => {
  // 防抖计时器引用
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 优化事件处理函数
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 防抖处理，减少状态更新频率
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      setSearch(value)
    }, 300) // 300ms防抖延迟
    
    setShowSuggest(true)
  }, [setSearch, setShowSuggest])

  const handleFocus = useCallback(() => {
    setShowSuggest(true)
  }, [setShowSuggest])

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggest(false), 150)
  }, [setShowSuggest])

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearch(suggestion)
    setShowSuggest(false)
  }, [setSearch, setShowSuggest])

  // 预先计算样式类名
  const inputBaseClassName = isDark 
    ? 'bg-gray-800 text-white focus:bg-gray-800' 
    : 'bg-gray-50 text-gray-900 focus:bg-white'

  const inputContainerClassName = isDark 
    ? 'bg-gray-700' 
    : 'bg-gray-100'

  const suggestBoxClassName = isDark 
    ? 'bg-gray-800 text-white ring-gray-700 shadow-lg' 
    : 'bg-white text-gray-900 ring-gray-200 shadow-lg'

  return (
    <div className="relative">
      <div className="flex items-center rounded-full shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* 搜索图标 */}
        <div className={`${inputContainerClassName} px-4 py-2 flex items-center justify-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input 
          value={search} 
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${inputBaseClassName} flex-1 px-4 py-2 border-0 focus:outline-none focus:ring-0 transition-all duration-300`} 
          placeholder="搜索标题/评论/风格/题材（支持 style:国潮 / topic:京剧）" 
          aria-label="搜索内容" 
        />
      </div>
      
      {showSuggest && suggestions.length > 0 && (
        <div className={`${suggestBoxClassName} absolute z-10 mt-2 w-full rounded-xl ring-1 max-h-48 overflow-auto transition-all duration-300 transform origin-top scale-100 opacity-100`}>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem 
              key={`${suggestion}-${index}`} 
              suggestion={suggestion} 
              isDark={isDark} 
              onSelect={handleSuggestionSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default SearchBar