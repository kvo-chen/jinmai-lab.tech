import React from 'react'

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  showSuggest: boolean
  setShowSuggest: (value: boolean) => void
  suggestions: string[]
  isDark: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  search,
  setSearch,
  showSuggest,
  setShowSuggest,
  suggestions,
  isDark
}) => {
  return (
    <div className="relative">
      <input 
        value={search} 
        onChange={e => { 
          setSearch(e.target.value); 
          setShowSuggest(true) 
        }} 
        onFocus={() => setShowSuggest(true)} 
        onBlur={() => setTimeout(() => setShowSuggest(false), 150)} 
        className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full px-3 py-2 rounded-lg border`} 
        placeholder="搜索标题/评论/风格/题材（支持 style:国潮 / topic:京剧）" 
      />
      {showSuggest && suggestions.length > 0 && (
        <div className={`${isDark ? 'bg-gray-800 text-white ring-gray-700' : 'bg-white text-gray-900 ring-gray-200'} absolute z-10 mt-1 w-full rounded-lg shadow ring-1 max-h-40 overflow-auto`}>
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              onMouseDown={() => { 
                setSearch(s); 
                setShowSuggest(false) 
              }} 
              className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} px-3 py-2 text-sm cursor-pointer`}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar