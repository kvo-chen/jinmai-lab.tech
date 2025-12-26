import React from 'react';

interface HotTagsProps {
  tags: string[];
  isDark: boolean;
}

const HotTags: React.FC<HotTagsProps> = ({ tags, isDark }) => {
  const uniqueTags = Array.from(new Set(tags)).slice(0, 20);
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
      <h3 className="text-xl font-bold mb-4 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">热门标签</h3>
      <div className="flex flex-wrap gap-2">
        {uniqueTags.map((tag: string, index: number) => (
          <span key={index} className={`px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 hover:shadow-md ${isDark ? 'bg-gray-750 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

export default HotTags;