import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import CollaborativeEditor from '@/components/CollaborativeEditor';

const CollaborationDemo: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [sessionId, setSessionId] = useState('demo-session-1');
  const [userId, setUserId] = useState(`user-${Date.now()}`);
  const [username, setUsername] = useState(`用户${Math.floor(Math.random() * 1000)}`);
  const [content, setContent] = useState('欢迎来到津脉智坊协作编辑器！\n\n这是一个实时协作编辑演示，您可以与其他人同时编辑同一份文档。\n\n功能特性：\n• 实时文本同步\n• 光标位置共享\n• 选择范围可视化\n• 用户状态指示\n• 输入状态显示');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    const newUserId = `user-${Date.now()}`;
    const newUsername = `用户${Math.floor(Math.random() * 1000)}`;
    
    setSessionId(newSessionId);
    setUserId(newUserId);
    setUsername(newUsername);
    setContent('新的协作会话已创建！\n\n开始您的实时协作编辑体验吧！');
    
    toast.success('已创建新的协作会话');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-6"
      style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            津脉智坊 - 实时协作编辑器
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            体验多人实时协作编辑的强大功能
          </p>
        </div>

        {/* 会话信息和控制面板 */}
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow'} border border-gray-200 dark:border-gray-700`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">会话ID:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">{sessionId}</code>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">当前用户:</span>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">{username}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={createNewSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                创建新会话
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  toast.success('会话ID已复制到剪贴板');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                复制会话ID
              </button>
            </div>
          </div>
        </div>

        {/* 协作编辑器 */}
        <div className={`mb-6 rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white shadow'} border border-gray-200 dark:border-gray-700`}>
          <CollaborativeEditor
            sessionId={sessionId}
            userId={userId}
            username={username}
            initialContent={content}
            onContentChange={handleContentChange}
            className="w-full"
          />
        </div>

        {/* 功能说明 */}
        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow'} border border-gray-200 dark:border-gray-700`}>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">功能说明</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-red-600 dark:text-red-400"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">实时协作</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    多人同时编辑同一文档，所有更改实时同步
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-mouse-pointer text-blue-600 dark:text-blue-400"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">光标同步</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    实时显示其他用户的光标位置和选择范围
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bolt text-green-600 dark:text-green-400"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">输入状态</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    显示其他用户的输入状态，了解协作进度
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shield-alt text-purple-600 dark:text-purple-400"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">稳定连接</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    自动重连机制，确保协作过程稳定可靠
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用提示 */}
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border`}>
          <div className="flex items-start space-x-3">
            <i className="fas fa-lightbulb text-yellow-500 mt-1"></i>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">使用提示</h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <li>• 在多个浏览器标签页中打开此页面，模拟多人协作</li>
                <li>• 复制会话ID分享给其他人，邀请他们加入协作</li>
                <li>• 观察光标和选择范围的实时同步效果</li>
                <li>• 尝试同时输入，体验实时同步的流畅性</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollaborationDemo;