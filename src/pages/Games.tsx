import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import CulturalQuizGame from '@/components/CulturalQuizGame';
import GradientHero from '@/components/GradientHero';

const Games: React.FC = () => {
  const { isDark } = useTheme();
  const [showGame, setShowGame] = useState(false);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {showGame ? (
        // 显示游戏组件
        <CulturalQuizGame 
          isOpen={showGame} 
          onClose={() => setShowGame(false)} 
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
            title="文化知识挑战"
            subtitle="测试你对天津地方文化和中国传统文化的了解"
            theme="indigo"
            stats={[
              { label: '题型', value: '多样化' },
              { label: '难度', value: '分关卡' },
              { label: '挑战', value: '计时赛' },
              { label: '互动', value: '趣味强' }
            ]}
            pattern={true}
            size="lg"
          />

          {/* 游戏介绍 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`mt-8 grid md:grid-cols-2 gap-8 mb-12 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-8 rounded-xl shadow-lg`}
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">游戏特色</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <span>多种题型：单选题、多选题、判断题</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <span>关卡制：包含3个不同难度的关卡</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <span>计时挑战：记录你的答题时间</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <span>提示系统：提供提示帮助你解题</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <span>成绩排名：记录你的最佳成绩</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">游戏主题</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                  <h3 className="font-bold mb-2">天津地方文化</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    了解天津的历史、传统艺术、美食和方言等特色文化
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                  <h3 className="font-bold mb-2">中国传统文化</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    探索中国传统节日、绘画、哲学、工艺和医学等文化知识
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 开始游戏按钮 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => setShowGame(true)}
              className="px-8 py-4 text-xl font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              <i className="fas fa-gamepad mr-2"></i>开始游戏
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Games;