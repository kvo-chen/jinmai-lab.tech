import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import llmService from '../services/llmService';

interface LLMCommandPanelProps {
  onCommandExecuted?: (response: string) => void;
}

const LLMCommandPanel: React.FC<LLMCommandPanelProps> = ({ onCommandExecuted }) => {
  const { isDark } = useTheme();
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamEnabled, setStreamEnabled] = useState(() => llmService.getConfig().stream);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预设的快速指令
  const quickCommands = [
    '生成融合青花瓷纹样的中秋海报',
    '把红色调改为靛蓝色',
    '添加传统云纹元素',
    '优化整体布局使其更加平衡',
    '增加文化元素的识别度',
  ];

  // 创意方向建议
  const [creativeDirections, setCreativeDirections] = useState<string[]>([]);
  const [culturalElements, setCulturalElements] = useState<string[]>([]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSendCommand = async () => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    
    // 添加用户消息到对话历史
    const newUserMessage = { role: 'user' as const, content: command };
    setConversation(prev => [...prev, newUserMessage]);
    
    try {
      const cfg = llmService.getConfig();
      if (cfg.stream) {
        let last = '';
        await llmService.generateResponse(command, {
          onDelta: (full) => {
            last = full;
            setConversation(prev => {
              const copy = [...prev];
              const lastMsg = copy[copy.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                copy[copy.length - 1] = { role: 'assistant', content: full };
              } else {
                copy.push({ role: 'assistant', content: full });
              }
              return copy;
            });
          }
        });
        if (onCommandExecuted) onCommandExecuted(last);
      } else {
        const response = await llmService.generateResponse(command);
        const newAiMessage = { role: 'assistant' as const, content: response };
        setConversation(prev => [...prev, newAiMessage]);
        if (onCommandExecuted) onCommandExecuted(response);
      }
      generateRecommendations(command);
    } catch (error) {
      toast.error('生成响应失败，请重试');
    } finally {
      setCommand('');
      setIsProcessing(false);
    }
  };

  const handleQuickCommandClick = (quickCommand: string) => {
    setCommand(quickCommand);
  };

  const handleCreativeDirectionClick = (direction: string) => {
    setCommand(`按照"${direction}"的方向优化设计`);
  };

  const handleCulturalElementClick = (element: string) => {
    setCommand(`在设计中添加${element}元素`);
  };

  const generateRecommendations = (prompt: string) => {
    // 获取创意方向建议
    const directions = llmService.generateCreativeDirections(prompt);
    setCreativeDirections(directions);
    
    // 获取文化元素推荐
    const elements = llmService.recommendCulturalElements(prompt);
    setCulturalElements(elements);
  };

  const clearConversation = () => {
    setConversation([]);
    llmService.clearHistory();
    toast.success('对话历史已清空');
  };

  const exportConversation = () => {
    try {
      const data = JSON.stringify(conversation, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conversation.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('已导出对话为 conversation.json');
    } catch {
      toast.error('导出失败');
    }
  };

  const importConversation = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const arr = JSON.parse(text) as Array<{ role: 'user' | 'assistant'; content: string }>;
        const valid = Array.isArray(arr) ? arr.filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [];
        setConversation(valid);
        const msgs = valid.map(v => ({ role: v.role, content: v.content, timestamp: Date.now() }));
        llmService.importHistory(msgs);
        toast.success('已导入对话');
      } catch {
        toast.error('导入失败，文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const toggleStream = () => {
    const next = !streamEnabled;
    setStreamEnabled(next);
    llmService.updateConfig({ stream: next });
    toast.success(next ? '已开启流式输出' : '已关闭流式输出');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center">
          <i className="fas fa-magic text-red-600 mr-2"></i>
          AI对话创作
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="显示对话历史"
          >
            <i className="fas fa-history"></i>
          </button>
          <button
            onClick={clearConversation}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="清空对话"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
          <button
            onClick={exportConversation}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="导出对话"
          >
            <i className="fas fa-download"></i>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="导入对话"
          >
            <i className="fas fa-upload"></i>
          </button>
          <button
            onClick={toggleStream}
            className={`p-2 rounded-full ${streamEnabled ? 'bg-green-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="切换流式输出"
          >
            <i className={`fas ${streamEnabled ? 'fa-wave-square' : 'fa-square'}`}></i>
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importConversation(f); }} />

      {/* 对话历史 */}
      {showHistory && conversation.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 max-h-60 overflow-y-auto space-y-3"
        >
          {conversation.map((message, index) => (
            <div key={index} className="flex">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <i className={`fas ${message.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
              </div>
              <div className="flex-1">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </motion.div>
      )}

      {/* 输入区域 */}
      <div className="space-y-3">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的创作指令，例如：生成融合青花瓷纹样的中秋海报..."
          className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-24 transition-colors ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' 
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
          }`}
        />
        
        {/* 快速指令 */}
        <div className="flex flex-wrap gap-2">
          {quickCommands.map((quickCommand, index) => (
            <motion.button
              key={index}
              onClick={() => handleQuickCommandClick(quickCommand)}
              className={`text-xs px-3 py-1 rounded-full ${
                selectedCommand === quickCommand
                  ? 'bg-red-100 text-red-600'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {quickCommand}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSendCommand}
            disabled={isProcessing || !command.trim()}
            className={`px-5 py-2.5 rounded-lg transition-colors flex items-center ${
              isProcessing
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                处理中...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                发送指令
              </>
            )}
          </button>
          
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            当前模型: {llmService.getCurrentModel().name}
          </span>
        </div>
      </div>

      {/* 创意方向和文化元素推荐 */}
      {(creativeDirections.length > 0 || culturalElements.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 space-y-4"
        >
          {creativeDirections.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                创意方向建议
              </h4>
              <div className="flex flex-wrap gap-2">
                {creativeDirections.map((direction, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleCreativeDirectionClick(direction)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      isDark
                        ? 'bg-blue-900 bg-opacity-30 text-blue-300 hover:bg-opacity-50'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    } transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {direction}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {culturalElements.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <i className="fas fa-gem text-purple-500 mr-2"></i>
                文化元素推荐
              </h4>
              <div className="flex flex-wrap gap-2">
                {culturalElements.map((element, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleCulturalElementClick(element)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      isDark
                        ? 'bg-purple-900 bg-opacity-30 text-purple-300 hover:bg-opacity-50'
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    } transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {element}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LLMCommandPanel;
