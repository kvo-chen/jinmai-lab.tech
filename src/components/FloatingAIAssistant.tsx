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
            className={`w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            {/* 聊天头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white`}>
                  <i className="fas fa-robot"></i>
                </div>
                <h3 className="font-semibold text-lg">AI助手</h3>
              </div>
              <button
                onClick={toggleAssistant}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="关闭"
              >
                <i className="fas fa-times"></i>
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
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 
                      (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                      (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* 正在生成指示器 */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] p-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  disabled={isGenerating}
                  className={`flex-1 px-4 py-2 rounded-full border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  className={`p-2 rounded-full transition-all ${isGenerating || !inputMessage.trim() ? 
                    (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                    (isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                  }`}
                  aria-label="发送"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={toggleAssistant}
        className={`fixed ${positionClasses[position]} w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 transition-all duration-300 transform hover:scale-110 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        aria-label="AI助手"
      >
        <i className={`fas fa-robot text-xl ${isOpen ? 'rotate-90' : ''}`}></i>
      </motion.button>
    </div>
  );
};

export default FloatingAIAssistant;