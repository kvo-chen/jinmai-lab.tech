import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalPuzzleService, { Level, Puzzle, GameProgress } from '@/services/culturalPuzzleService';

interface CulturalPuzzleGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalPuzzleGame: React.FC<CulturalPuzzleGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const allLevels = culturalPuzzleService.getLevels();
      setLevels(allLevels);
      
      if (user) {
        const progress = culturalPuzzleService.getGameProgress(user.id);
        setGameProgress(progress);
      }
      
      setIsLoading(false);
    }
  }, [isOpen, user]);

  // 当选择关卡时，初始化游戏状态
  useEffect(() => {
    if (selectedLevel) {
      setCurrentPuzzleIndex(0);
      setCurrentPuzzle(selectedLevel.puzzles[0]);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setIsCorrect(false);
      setCorrectAnswers(0);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setShowHint(false);
    }
  }, [selectedLevel]);

  // 当当前谜题索引变化时，更新当前谜题
  useEffect(() => {
    if (selectedLevel && selectedLevel.puzzles[currentPuzzleIndex]) {
      setCurrentPuzzle(selectedLevel.puzzles[currentPuzzleIndex]);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setIsCorrect(false);
      setShowHint(false);
    }
  }, [selectedLevel, currentPuzzleIndex]);

  // 选择关卡
  const handleSelectLevel = (level: Level) => {
    // 检查关卡是否解锁
    if (user && gameProgress) {
      const canUnlock = !level.unlockCondition || 
        (level.unlockCondition.type === 'level' && gameProgress.completedLevels.length >= level.unlockCondition.value) ||
        (level.unlockCondition.type === 'score' && gameProgress.totalScore >= level.unlockCondition.value);
      
      if (canUnlock) {
        setSelectedLevel(level);
      } else {
        toast.error('该关卡尚未解锁');
      }
    } else {
      setSelectedLevel(level);
    }
  };

  // 提交答案
  const handleSubmitAnswer = () => {
    if (!currentPuzzle || selectedAnswer === null) {
      toast.error('请选择一个答案');
      return;
    }

    const result = culturalPuzzleService.checkAnswer(currentPuzzle.id, selectedAnswer);
    setShowAnswer(true);
    setIsCorrect(result.isCorrect);
    
    if (result.isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      toast.success('回答正确！');
    } else {
      toast.error('回答错误');
    }
  };

  // 进入下一题
  const handleNextPuzzle = () => {
    if (!selectedLevel) return;

    if (currentPuzzleIndex < selectedLevel.puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
    } else {
      // 完成关卡
      handleCompleteLevel();
    }
  };

  // 完成关卡
  const handleCompleteLevel = () => {
    if (!selectedLevel || !user) return;

    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);

    const score = culturalPuzzleService.calculateLevelScore(
      correctAnswers,
      selectedLevel.puzzles.length,
      timeDiff
    );

    const updatedProgress = culturalPuzzleService.completeLevel(user.id, selectedLevel.id, score);
    setGameProgress(updatedProgress);
    setGameState('completed');

    toast.success(`关卡完成！得分：${score}`);
  };

  // 使用提示
  const handleUseHint = () => {
    if (!user) return;

    const success = culturalPuzzleService.useHint(user.id);
    if (success) {
      setShowHint(true);
      const updatedProgress = culturalPuzzleService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已使用提示');
    } else {
      toast.error('提示已用完');
    }
  };

  // 返回主菜单
  const handleBackToMenu = () => {
    setGameState('menu');
    setSelectedLevel(null);
    setCurrentPuzzle(null);
    setCurrentPuzzleIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setStartTime(null);
    setTimeTaken(null);
    setShowHint(false);
  };

  // 重新开始关卡
  const handleRestartLevel = () => {
    if (!selectedLevel) return;
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(selectedLevel.puzzles[0]);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setShowHint(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto`}
    >
      <div className={`w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'}`}>
        {/* 游戏头部 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化元素解谜游戏</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 游戏内容 */}
        <div className="p-6">
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
              <p className="text-lg">加载游戏数据...</p>
            </div>
          )}

          {/* 主菜单 */}
          {gameState === 'menu' && !isLoading && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">欢迎来到文化元素解谜游戏</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  通过解谜游戏学习中国传统文化元素
                </p>
              </div>

              {/* 游戏进度 */}
              {gameProgress && (
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="text-lg font-medium mb-2">游戏进度</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前关卡</p>
                      <p className="text-xl font-bold">{gameProgress.completedLevels.length + 1}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已完成关卡</p>
                      <p className="text-xl font-bold">{gameProgress.completedLevels.length}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总得分</p>
                      <p className="text-xl font-bold">{gameProgress.totalScore}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>可用提示</p>
                      <p className="text-xl font-bold">{gameProgress.unlockedHints}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 关卡列表 */}
              <h3 className="text-lg font-medium mb-4">选择关卡</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map((level) => {
                  const isCompleted = gameProgress?.completedLevels.includes(level.id) || false;
                  const canUnlock = !level.unlockCondition || 
                    (level.unlockCondition.type === 'level' && (gameProgress?.completedLevels.length || 0) >= level.unlockCondition.value) ||
                    (level.unlockCondition.type === 'score' && (gameProgress?.totalScore || 0) >= level.unlockCondition.value);

                  return (
                    <motion.div
                      key={level.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'} ${canUnlock ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                      whileHover={canUnlock ? { y: -4 } : {}}
                      onClick={() => canUnlock && handleSelectLevel(level)}
                    >
                      {level.imageUrl && (
                        <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
                          <img
                            src={level.imageUrl}
                            alt={level.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                          {isCompleted && (
                            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                              已完成
                            </div>
                          )}
                          {!canUnlock && (
                            <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                              未解锁
                            </div>
                          )}
                        </div>
                      )}
                      <h4 className="font-medium mb-1">{level.name}</h4>
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {level.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {level.culturalTheme}
                        </span>
                        <span className="text-xs font-medium">
                          {level.puzzles.length} 题
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 游戏界面 */}
          {gameState === 'playing' && selectedLevel && currentPuzzle && !isLoading && (
            <div>
              {/* 关卡信息 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{selectedLevel.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBackToMenu}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      返回菜单
                    </button>
                    <button
                      onClick={handleUseHint}
                      disabled={!gameProgress || gameProgress.unlockedHints <= 0}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <i className="fas fa-lightbulb mr-1"></i>提示 ({gameProgress?.unlockedHints || 0})
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${((currentPuzzleIndex + 1) / selectedLevel.puzzles.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {currentPuzzleIndex + 1} / {selectedLevel.puzzles.length}
                  </span>
                </div>
              </div>

              {/* 谜题内容 */}
              <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {currentPuzzle.imageUrl && (
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src={currentPuzzle.imageUrl}
                      alt={currentPuzzle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h4 className="text-lg font-medium mb-2">{currentPuzzle.title}</h4>
                <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {currentPuzzle.question}
                </p>

                {/* 提示 */}
                {showHint && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                    <div className="flex items-start">
                      <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                      <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                        {currentPuzzle.hint}
                      </p>
                    </div>
                  </div>
                )}

                {/* 答案选项 */}
                <div className="space-y-3">
                  {currentPuzzle.options.map((option, index) => (
                    <motion.button
                      key={index}
                      className={`w-full p-3 rounded-lg text-left transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${selectedAnswer === index ? (showAnswer ? (isCorrect ? 'border-green-500 bg-green-500 bg-opacity-10' : 'border-red-500 bg-red-500 bg-opacity-10') : 'border-blue-500 bg-blue-500 bg-opacity-10') : ''}`}
                      whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                      onClick={() => !showAnswer && setSelectedAnswer(index)}
                      disabled={showAnswer}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border ${selectedAnswer === index ? (showAnswer ? (isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-red-500 bg-red-500 text-white') : 'border-blue-500 bg-blue-500 text-white') : isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 答案解释 */}
                {showAnswer && (
                  <div className={`mt-4 p-3 rounded-lg ${isCorrect ? (isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-100') : (isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-100')} border ${isCorrect ? (isDark ? 'border-green-700' : 'border-green-200') : (isDark ? 'border-red-700' : 'border-red-200')}`}>
                    <h5 className="font-medium mb-2">答案解析</h5>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {currentPuzzle.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* 游戏控制 */}
              <div className="flex justify-end gap-3">
                {!showAnswer ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    onClick={handleNextPuzzle}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                  >
                    {currentPuzzleIndex < selectedLevel.puzzles.length - 1 ? '下一题' : '完成关卡'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 关卡完成界面 */}
          {gameState === 'completed' && selectedLevel && gameProgress && !isLoading && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="mb-6"
              >
                <i className="fas fa-trophy text-6xl text-yellow-500"></i>
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">恭喜完成关卡！</h2>
              <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                你成功完成了「{selectedLevel.name}」关卡
              </p>

              {/* 得分统计 */}
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>得分</p>
                    <p className="text-xl font-bold">{gameProgress.levelScores[selectedLevel.id] || 0}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正确率</p>
                    <p className="text-xl font-bold">{Math.round((correctAnswers / selectedLevel.puzzles.length) * 100)}%</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正确题数</p>
                    <p className="text-xl font-bold">{correctAnswers} / {selectedLevel.puzzles.length}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>用时</p>
                    <p className="text-xl font-bold">{timeTaken ? Math.floor(timeTaken / 60) : 0}m {timeTaken ? timeTaken % 60 : 0}s</p>
                  </div>
                </div>
              </div>

              {/* 奖励信息 */}
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                <h3 className="font-medium mb-2">获得奖励</h3>
                <p className={isDark ? 'text-yellow-200' : 'text-yellow-800'}>
                  {selectedLevel.reward}
                </p>
              </div>

              {/* 游戏控制 */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleRestartLevel}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  重新挑战
                </button>
                <button
                  onClick={handleBackToMenu}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                  返回主菜单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CulturalPuzzleGame;