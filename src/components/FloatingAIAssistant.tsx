import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import llmService, { Message } from '@/services/llmService';

interface FloatingAIAssistantProps {
  // 可以添加一些自定义配置属性
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  defaultOpen = false,
  position = 'bottom-right'
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 预设问题列表
  const presetQuestions = [
    '平台上如何创作',
    '如何使用AI生成功能',
    '如何分享我的作品',
    '如何查看创作数据',
    '如何参与社区活动'
  ];

  // 添加初始欢迎消息
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // 调用LLM服务生成响应
      const response = await llmService.generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我暂时无法回答你的问题。请稍后再试。',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 切换AI助手显示/隐藏
  const toggleAssistant = () => {
    setIsOpen(prev => !prev);
  };

  // 位置类
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* 聊天界面 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`w-80 sm:w-96 h-[550px] rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}
          >
            {/* 聊天头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} flex justify-between items-center shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} text-white shadow-md`}>
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI助手</h3>
              </div>
              <button
                onClick={toggleAssistant}
                className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-700 hover:scale-110' : 'hover:bg-gray-100 hover:scale-110'} transform`}
                aria-label="关闭"
              >
                <i className={`fas fa-times ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            {/* 聊天内容 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6'
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-xl ${message.role === 'user' ? 
                      (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg') : 
                      (isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200')
                    } transition-all hover:shadow-xl`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* 正在生成指示器 */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className={`max-w-[85%] p-4 rounded-xl ${isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      ></motion.div>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-purple-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      ></motion.div>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-pink-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 预设问题 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`px-4 pb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快速提问</p>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePresetQuestionClick(question)}
                      className={`px-3 py-1.5 text-xs rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'} transition-all transform hover:scale-105`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入区域 */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} shadow-inner`}>
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题..."
                  disabled={isGenerating}
                  className={`flex-1 px-4 py-3 rounded-full border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm`}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  className={`p-3 rounded-full transition-all shadow-md ${isGenerating || !inputMessage.trim() ? 
                    (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                    (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white')
                  }`}
                  whileHover={{ scale: isGenerating || !inputMessage.trim() ? 1 : 1.1 }}
                  whileTap={{ scale: isGenerating || !inputMessage.trim() ? 1 : 0.95 }}
                  aria-label="发送"
                >
                  <i className="fas fa-paper-plane"></i>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
        onClick={toggleAssistant}
        className={`fixed ${positionClasses[position]} w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-50 transition-all duration-300 transform hover:scale-125 ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white`}
        aria-label="AI助手"
        whileHover={{ scale: 1.25, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)' }}
        whileTap={{ scale: 1.1 }}
      >
        <motion.i 
          className="fas fa-robot text-2xl" 
          animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.i>
        {/* 消息数量提示 */}
        {messages.length > 1 && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {messages.length - 1}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default FloatingAIAssistant;