import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import llmService, { AVAILABLE_MODELS, LLMModel } from '../services/llmService';

interface ModelComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  initialModels?: string[];
}

interface ModelResult {
  modelId: string;
  modelName: string;
  response: string;
  success: boolean;
  error?: string;
  loading: boolean;
  responseTime: number;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ isOpen, onClose, initialModels }) => {
  const { isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(initialModels || [llmService.getCurrentModel().id]);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化结果数组
  useEffect(() => {
    setResults(
      selectedModels.map(modelId => {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        return {
          modelId,
          modelName: model?.name || modelId,
          response: '',
          success: false,
          loading: false,
          responseTime: 0
        };
      })
    );
  }, [selectedModels]);

  // 处理模型选择变更
  const handleModelSelect = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        // 取消选择，但确保至少保留一个模型
        const newSelection = prev.filter(id => id !== modelId);
        return newSelection.length > 0 ? newSelection : prev;
      } else {
        // 添加选择
        return [...prev, modelId];
      }
    });
  };

  // 处理生成请求
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    if (selectedModels.length === 0) {
      toast.error('请至少选择一个模型');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // 重置结果
    const initialResults: ModelResult[] = selectedModels.map(modelId => {
      const model = AVAILABLE_MODELS.find(m => m.id === modelId);
      return {
        modelId,
        modelName: model?.name || modelId,
        response: '',
        success: false,
        loading: true,
        responseTime: 0
      };
    });
    setResults(initialResults);

    try {
      // 调用多模型生成方法
      const startTime = Date.now();
      const modelResponses = await llmService.generateResponsesFromMultipleModels(
        prompt,
        selectedModels,
        {
          onModelResponse: (modelId, response, success, error) => {
            const endTime = Date.now();
            setResults(prev => {
              return prev.map(result => {
                if (result.modelId === modelId) {
                  return {
                    ...result,
                    response,
                    success,
                    error,
                    loading: false,
                    responseTime: endTime - startTime
                  };
                }
                return result;
              });
            });
          }
        }
      );

      // 等待所有响应完成
      const endTime = Date.now();
      const finalResults: ModelResult[] = selectedModels.map(modelId => {
        const responseData = modelResponses[modelId];
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        return {
          modelId,
          modelName: model?.name || modelId,
          response: responseData?.response || '',
          success: responseData?.success || false,
          error: responseData?.error,
          loading: false,
          responseTime: endTime - startTime
        };
      });

      setResults(finalResults);
      setIsGenerating(false);
    } catch (err) {
      setIsGenerating(false);
      const errorMessage = err instanceof Error ? err.message : '生成失败，请稍后重试';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // 处理清空结果
  const handleClearResults = () => {
    setResults(
      selectedModels.map(modelId => {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        return {
          modelId,
          modelName: model?.name || modelId,
          response: '',
          success: false,
          loading: false,
          responseTime: 0
        };
      })
    );
    setPrompt('');
    setError(null);
    textareaRef.current?.focus();
  };

  // 处理复制结果
  const handleCopyResult = (modelId: string) => {
    const result = results.find(r => r.modelId === modelId);
    if (result?.response) {
      navigator.clipboard.writeText(result.response)
        .then(() => {
          toast.success(`已复制${result.modelName}的回答`);
        })
        .catch(() => {
          toast.error('复制失败，请手动复制');
        });
    }
  };

  // 自动调整文本域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-5xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 面板头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">模型比较</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 面板内容 */}
        <div ref={containerRef} className="p-6 overflow-y-auto flex-1">
          {/* 错误信息显示 */}
          {error && (
            <div className={`mb-6 p-3 rounded-lg bg-red-100 text-red-600 text-sm flex items-center dark:bg-red-900/20 dark:text-red-400`}>
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {/* 提示词输入 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">输入提示词</h4>
              <button
                type="button"
                onClick={handleClearResults}
                disabled={isGenerating}
                className={`text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors`}
              >
                <i className="fas fa-trash mr-1"></i> 清空
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入要比较的提示词..."
              className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none overflow-hidden`}
              rows={3}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerate();
                }
              }}
            />
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
              <span>按 Ctrl+Enter 快速生成</span>
              <span>{prompt.length} 字符</span>
            </div>
          </div>

          {/* 模型选择 */}
          <div className="mb-6">
            <h4 className="font-medium mb-4">选择要比较的模型</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_MODELS.map((model) => (
                <motion.button
                  key={model.id}
                  type="button"
                  className={`relative text-left p-3 rounded-lg border transition-all ${selectedModels.includes(model.id)
                    ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/20 ring-2 ring-purple-500'
                    : isDark
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModelSelect(model.id)}
                  disabled={isGenerating}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${selectedModels.includes(model.id) ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                      {model.name}
                    </span>
                    <div className={`w-4 h-4 rounded border-2 transition-all ${selectedModels.includes(model.id)
                      ? 'border-purple-600 bg-purple-600'
                      : isDark
                      ? 'border-gray-600'
                      : 'border-gray-300'}`}>
                      {selectedModels.includes(model.id) && (
                        <i className="fas fa-check text-white text-xs flex items-center justify-center w-full h-full"></i>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              已选择 {selectedModels.length} 个模型
            </div>
          </div>

          {/* 生成按钮 */}
          <div className="mb-6 flex justify-center">
            <motion.button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || selectedModels.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-8 py-3 rounded-lg font-medium transition-all ${isGenerating
                ? 'bg-purple-400 dark:bg-purple-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white'}`}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  生成中...
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="fas fa-magic mr-2"></i>
                  开始比较
                </span>
              )}
            </motion.button>
          </div>

          {/* 结果展示 */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h4 className="font-medium">比较结果</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result) => (
                  <motion.div
                    key={result.modelId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * results.indexOf(result) }}
                    className={`rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} overflow-hidden shadow-md`}
                  >
                    {/* 模型头部 */}
                    <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'} flex justify-between items-center`}>
                      <h5 className="font-medium">{result.modelName}</h5>
                      {!result.loading && (
                        <button
                          type="button"
                          onClick={() => handleCopyResult(result.modelId)}
                          className={`text-xs p-1 rounded ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                          aria-label="复制结果"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      )}
                    </div>

                    {/* 响应内容 */}
                    <div className="p-4 h-64 overflow-y-auto">
                      {result.loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">生成中...</p>
                          </div>
                        </div>
                      ) : result.success ? (
                        <div className="whitespace-pre-wrap text-sm">
                          {result.response || '无响应内容'}
                        </div>
                      ) : (
                        <div className="text-sm text-red-500 dark:text-red-400">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          {result.error || '生成失败'}
                        </div>
                      )}
                    </div>

                    {/* 响应信息 */}
                    <div className={`p-3 border-t ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'} text-xs text-gray-500 dark:text-gray-400`}>
                      {!result.loading && (
                        <div className="flex items-center justify-between">
                          <span>
                            {result.success ? (
                              <span className="text-green-500 dark:text-green-400">
                                <i className="fas fa-check-circle mr-1"></i>
                                成功
                              </span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400">
                                <i className="fas fa-times-circle mr-1"></i>
                                失败
                              </span>
                            )}
                          </span>
                          <span>
                            耗时: {result.responseTime}ms
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} text-xs text-gray-500 dark:text-gray-400 text-center`}>
          同时向多个模型发送请求，可能会消耗较多API额度，请谨慎使用
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModelComparison;