import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import CulturalQuizGame from '@/components/CulturalQuizGame';
import CulturalMemoryGame from '@/components/CulturalMemoryGame';
import GradientHero from '@/components/GradientHero';

const Games: React.FC = () => {
  const { isDark } = useTheme();
  const [showQuizGame, setShowQuizGame] = useState(false);
  const [showMemoryGame, setShowMemoryGame] = useState(false);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* 显示游戏组件 */}
      {showQuizGame ? (
        <CulturalQuizGame 
          isOpen={showQuizGame} 
          onClose={() => setShowQuizGame(false)} 
        />
      ) : showMemoryGame ? (
        <CulturalMemoryGame 
          isOpen={showMemoryGame} 
          onClose={() => setShowMemoryGame(false)} 
        />
      ) : (
        // 显示游戏介绍
        <div className="container mx-auto px-4 py-8">
          {/* 返回按钮 */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              <i className="fas fa-arrow-left"></i>
              <span>返回</span>
            </button>
          </div>
          
          <GradientHero 
            title="文化知识游戏" 
            subtitle="通过游戏学习天津地方文化和中国传统文化" 
            theme="indigo"
            stats={[
              { label: '游戏类型', value: '多样化' },
              { label: '难度级别', value: '分关卡' },
              { label: '学习方式', value: '互动式' },
              { label: '挑战模式', value: '计时赛' }
            ]}
            pattern={true}
            size="lg"
          />

          {/* 游戏列表 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 grid md:grid-cols-2 gap-8 mb-12"
          >
            {/* 文化知识挑战 */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Cultural%20quiz%20game%20interface%20with%20traditional%20Chinese%20elements"
                  alt="文化知识挑战"
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-bold mb-3">文化知识挑战</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                测试你对天津地方文化和中国传统文化的了解，包含多种题型和难度级别。
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>多种题型：单选题、多选题、判断题</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>关卡制：包含3个不同难度的关卡</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>计时挑战：记录你的答题时间</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>提示系统：提供提示帮助你解题</span>
                </li>
              </ul>
              <button
                onClick={() => setShowQuizGame(true)}
                className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
              >
                <i className="fas fa-question-circle mr-2"></i>开始挑战
              </button>
            </div>

            {/* 文化记忆游戏 */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Memory%20card%20game%20with%20Chinese%20cultural%20elements%20flip%20cards"
                  alt="文化记忆游戏"
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-bold mb-3">文化记忆游戏</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                翻牌匹配相同的文化元素，挑战你的记忆力和文化知识，包含多种难度级别。
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>多种难度：4x4、6x6、8x8网格</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>精美的卡片设计：包含文化元素图片和介绍</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>计时挑战：记录你的完成时间</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>进度保存：记录你的游戏成就</span>
                </li>
              </ul>
              <button
                onClick={() => setShowMemoryGame(true)}
                className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
              >
                <i className="fas fa-gamepad mr-2"></i>开始游戏
              </button>
            </div>
          </motion.div>

          {/* 游戏特色介绍 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} mb-12`}
          >
            <h2 className="text-2xl font-bold mb-4">游戏特色</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <i className="fas fa-book-open text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">文化学习</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  通过游戏了解天津地方文化和中国传统文化的丰富内涵
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <i className="fas fa-user-friends text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">互动体验</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  丰富的互动设计，让学习变得更加有趣和生动
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <i className="fas fa-trophy text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">挑战成就</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  完成关卡获得奖励，解锁新的游戏内容和成就
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Games;