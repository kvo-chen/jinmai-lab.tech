import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ColorAssistant: React.FC = () => {
  const [theme, setTheme] = useState('国潮');
  const [style, setStyle] = useState('');
  const [colorScheme, setColorScheme] = useState<string[]>([]);
  const [colorAdvice, setColorAdvice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateColors = () => {
    setIsGenerating(true);
    
    // 模拟生成色彩方案
    setTimeout(() => {
      // 基于主题生成模拟色彩方案
      const baseColorSchemes = {
        '国潮': ['#E74C3C', '#F39C12', '#F1C40F', '#2ECC71', '#3498DB'],
        '天津': ['#1ABC9C', '#34495E', '#E67E22', '#9B59B6', '#E74C3C'],
        '春节': ['#E74C3C', '#27AE60', '#F39C12', '#8E44AD', '#2C3E50'],
        '自然': ['#2ECC71', '#16A085', '#3498DB', '#F1C40F', '#E67E22'],
        '现代': ['#34495E', '#95A5A6', '#3498DB', '#E74C3C', '#2ECC71'],
        '简约': ['#ECF0F1', '#95A5A6', '#3498DB', '#2ECC71', '#E74C3C']
      };
      
      const scheme = baseColorSchemes[theme as keyof typeof baseColorSchemes] || ['#3498DB', '#2ECC71', '#F1C40F', '#E74C3C', '#9B59B6'];
      setColorScheme(scheme);
      
      // 模拟色彩搭配建议
      const advice = `基于${theme}主题的色彩搭配建议：\n1. 主色调：${scheme[0]} - 代表主题核心精神\n2. 辅助色：${scheme[1]}、${scheme[2]} - 增强视觉层次\n3. 强调色：${scheme[3]} - 用于突出重点内容\n4. 中性色：${scheme[4]} - 平衡整体视觉效果\n\n建议使用场景：\n- 品牌标识和包装设计\n- 网页和移动端UI设计\n- 海报和宣传物料`;
      setColorAdvice(advice);
      
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI智能配色助手</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
            主题
          </label>
          <input
            type="text"
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例如：国潮、天津、春节、自然"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
            风格（可选）
          </label>
          <input
            type="text"
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="例如：传统、现代、简约"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateColors}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成配色方案'}
        </motion.button>
      </div>
      
      {colorScheme.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">生成的色彩方案</h3>
            <div className="grid grid-cols-5 gap-4">
              {colorScheme.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-full h-32 rounded-lg shadow-md mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{color}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">色彩搭配建议</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{colorAdvice}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorAssistant;