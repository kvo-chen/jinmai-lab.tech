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
      onClose();
    } catch (error) {
      toast.error('提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    if (errorType.includes('NETWORK')) return 'bg-red-100 text-red-600';
    if (errorType.includes('PERMISSION')) return 'bg-yellow-100 text-yellow-600';
    if (errorType.includes('MODEL')) return 'bg-blue-100 text-blue-600';
    if (errorType.includes('VALIDATION')) return 'bg-green-100 text-green-600';
    return 'bg-gray-100 text-gray-600';
  };

  const toggleDetails = () => {
    setErrorDetails(!errorDetails ? (errorInfo || null) : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-2xl w-full mx-4 overflow-hidden`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold flex items-center">
            <i className="fas fa-bug text-red-600 mr-2"></i>
            问题反馈
          </h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6">
          {/* 错误信息展示 */}
          {errorDetails && (
            <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full ${getErrorTypeColor(errorDetails.errorType)} flex items-center justify-center mr-3`}>
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <h4 className="font-medium">{errorDetails.message}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    错误类型: {errorDetails.errorType}
                  </p>
                </div>
              </div>
              
              {/* 错误详情展开/收起 */}
              <div className="text-xs">
                <details>
                  <summary className="cursor-pointer text-blue-600 hover:underline">查看详细信息</summary>
                  <div className={`mt-3 p-3 rounded-md ${isDark ? 'bg-gray-600' : 'bg-gray-100'} whitespace-pre-wrap text-xs overflow-auto max-h-40`}>
                    <div className="mb-1">时间: {new Date(errorDetails.timestamp).toLocaleString()}</div>
                    <div className="mb-1">URL: {errorDetails.url}</div>
                    <div className="mb-1">设备: {errorDetails.deviceInfo.device} / {errorDetails.deviceInfo.os}</div>
                    <div className="mb-1">浏览器: {errorDetails.deviceInfo.browser} v{errorDetails.deviceInfo.browserVersion}</div>
                    {errorDetails.stackTrace && (
                      <div className="mt-2">堆栈: {errorDetails.stackTrace}</div>
                    )}
                    {errorDetails.context && Object.keys(errorDetails.context).length > 0 && (
                      <div className="mt-2">上下文: {JSON.stringify(errorDetails.context, null, 2)}</div>
                    )}
                  </div>
                </details>
              </div>
              
              {/* 修复建议 */}
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">推荐解决方案:</h5>
                <ul className="space-y-1 text-sm">
                  {errorService.getErrorFixSuggestions(errorDetails.errorType).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* 反馈表单 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">问题描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题，以便我们更好地解决..."
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-32 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
                }`}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">联系方式 (可选)</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="请留下您的邮箱或手机号，方便我们联系您"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
                }`}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeLogs"
                defaultChecked
                className="mr-2 rounded text-red-600 focus:ring-red-500"
              />
              <label htmlFor="includeLogs" className="text-sm">
                包含错误日志信息（有助于我们更快定位问题）
              </label>
            </div>
          </div>
        </div>
        
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isSubmitting || !description.trim()
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                提交中...
              </>
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