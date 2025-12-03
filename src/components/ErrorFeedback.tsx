import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import errorService, { ErrorInfo } from '../services/errorService';

interface ErrorFeedbackProps {
  errorInfo?: ErrorInfo;
  error?: Error;
  onClose: () => void;
  autoShow?: boolean;
}

const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ errorInfo, error, onClose, autoShow = false }) => {
  const { isDark } = useTheme();
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorInfo | null>(errorInfo || null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('功能异常');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [includeLogs, setIncludeLogs] = useState(true);
  
  // 处理直接传递的 Error 对象
  useEffect(() => {
    if (error && !errorDetails) {
      const loggedError = errorService.logError(error);
      setErrorDetails(loggedError);
    }
  }, [error, errorDetails]);
  
  // 自动显示时，尝试从错误服务获取最新错误
  if (autoShow && !errorDetails) {
    const stats = errorService.getErrorStats();
    if (stats.recent.length > 0) {
      setErrorDetails(stats.recent[stats.recent.length - 1]);
    }
  }
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('问题反馈已提交，感谢您的帮助！');
      
      // 清空表单
      setDescription('');
      setContactInfo('');
      setFeedbackType('功能异常');
      setScreenshots([]);
      setIncludeLogs(true);
      onClose();
    } catch (error) {
      toast.error('提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    if (errorType.includes('NETWORK')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (errorType.includes('PERMISSION')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (errorType.includes('MODEL')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (errorType.includes('VALIDATION')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setScreenshots(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900/80' : 'bg-gray-50/80'} backdrop-blur-md transition-opacity duration-300`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-w-2xl w-full mx-4 overflow-hidden`}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-750' : 'from-white to-gray-50'}`}>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 0 }}
            >
              <i className="fas fa-bug text-red-600"></i>
            </motion.div>
            问题反馈
          </h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            aria-label="关闭"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 错误信息展示 */}
          {errorDetails && (
            <motion.div 
              className={`p-5 rounded-xl ${isDark ? 'bg-gray-750/80' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${getErrorTypeColor(errorDetails.errorType)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <i className="fas fa-exclamation-triangle text-lg"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold mb-1">{errorDetails.message}</h4>
                  <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    错误类型: {errorDetails.errorType}
                  </p>
                  
                  {/* 错误详情展开/收起 */}
                  <div className="text-sm">
                    <button
                      onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors duration-200"
                    >
                      <span>{isDetailsOpen ? '隐藏' : '查看'}详细信息</span>
                      <i className={`fas fa-chevron-down transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: isDetailsOpen ? 1 : 0,
                        height: isDetailsOpen ? 'auto' : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={`mt-3 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap text-xs overflow-auto max-h-60 font-mono border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="mb-2 text-gray-500 dark:text-gray-400">📅 时间: {new Date(errorDetails.timestamp).toLocaleString()}</div>
                        <div className="mb-2 text-gray-500 dark:text-gray-400">🌐 URL: {errorDetails.url}</div>
                        <div className="mb-2 text-gray-500 dark:text-gray-400">💻 设备: {errorDetails.deviceInfo.device} / {errorDetails.deviceInfo.os}</div>
                        <div className="mb-2 text-gray-500 dark:text-gray-400">🌍 浏览器: {errorDetails.deviceInfo.browser} v{errorDetails.deviceInfo.browserVersion}</div>
                        {errorDetails.stackTrace && (
                          <div className="mt-3">
                            <div className="text-gray-500 dark:text-gray-400 mb-1">🔍 堆栈:</div>
                            <div className="pl-2 border-l-2 border-gray-400 dark:border-gray-600">{errorDetails.stackTrace}</div>
                          </div>
                        )}
                        {errorDetails.context && Object.keys(errorDetails.context).length > 0 && (
                          <div className="mt-3">
                            <div className="text-gray-500 dark:text-gray-400 mb-1">📋 上下文:</div>
                            <div className="pl-2 border-l-2 border-gray-400 dark:border-gray-600">{JSON.stringify(errorDetails.context, null, 2)}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* 修复建议 */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      推荐解决方案:
                    </h5>
                    <ul className="space-y-2 text-sm">
                      {errorService.getErrorFixSuggestions(errorDetails.errorType).map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-green-500 mt-0.5 flex-shrink-0"></i>
                          <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 反馈表单 */}
          <div className="space-y-5">
            {/* 反馈类型 */}
            <div>
              <label htmlFor="feedbackType" className="block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }">反馈类型</label>
              <select
                id="feedbackType"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border hover:border-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border hover:border-gray-300'
                }`}
                tabIndex={0}
              >
                <option value="功能异常">功能异常</option>
                <option value="界面问题">界面问题</option>
                <option value="性能问题">性能问题</option>
                <option value="建议改进">建议改进</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {/* 问题描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }">问题描述 <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题，以便我们更好地解决..."
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-36 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border hover:border-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border hover:border-gray-300'
                } ${!description.trim() && description.length > 0 ? 'border-red-500' : ''}`}
                required
                tabIndex={0}
                aria-required="true"
              ></textarea>
              {!description.trim() && description.length > 0 && (
                <p className="text-xs text-red-500 mt-1">请输入问题描述</p>
              )}
            </div>
            
            {/* 联系方式 */}
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }">联系方式 (可选)</label>
              <input
                id="contactInfo"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="请留下您的邮箱或手机号，方便我们联系您"
                className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border hover:border-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border hover:border-gray-300'
                }`}
                tabIndex={0}
              />
            </div>

            {/* 截图上传 */}
            <div>
              <label className="block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }">截图上传 (可选)</label>
              <div className="space-y-3">
                {/* 已上传截图 */}
                {screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {screenshots.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <div className="w-24 h-24 rounded-lg border ${
                          isDark ? 'border-gray-600' : 'border-gray-200'
                        } overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`截图 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeScreenshot(index)}
                          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                          aria-label={`删除截图 ${index + 1}`}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {/* 上传按钮 */}
                <label 
                  htmlFor="screenshotUpload"
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 border-2 border-dashed ${
                    isDark 
                      ? 'border-gray-600 hover:border-red-500 hover:bg-gray-700/50' 
                      : 'border-gray-200 hover:border-red-500 hover:bg-gray-50'
                  }`}
                >
                  <i className="fas fa-cloud-upload-alt text-gray-500 dark:text-gray-400"></i>
                  <span className="text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }">点击上传截图或拖拽文件到此处</span>
                  <input
                    id="screenshotUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {/* 包含日志选项 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeLogs"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 transition-all duration-200"
                tabIndex={0}
              />
              <label htmlFor="includeLogs" className="text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }">
                包含错误日志信息（有助于我们更快定位问题）
              </label>
            </div>
          </div>
        </div>
        
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3 bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-750' : 'from-white to-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className={`px-6 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 font-medium ${
              isSubmitting || !description.trim()
                ? 'bg-gray-500 cursor-not-allowed text-gray-200' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
            }`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && description.trim() && handleSubmit()}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <i className="fas fa-spinner fa-spin"></i>
                </motion.div>
                提交中...
              </div>
            ) : (
              '提交反馈'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ErrorFeedback;