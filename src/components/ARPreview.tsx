import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

// AR预览配置类型
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
}

const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  const { isDark } = useTheme();
  const [isARMode, setIsARMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 模拟AR加载过程
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 切换AR模式
  const toggleARMode = () => {
    setIsARMode(!isARMode);
    if (!isARMode) {
      toast.info('已进入AR模式，将设备对准平面查看效果');
    }
  };

  // 重置模型位置
  const resetPosition = () => {
    toast.success('模型位置已重置');
  };

  // 缩放控制
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    // 这里可以添加缩放逻辑
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* 顶部导航栏 */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold">AR预览</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          aria-label="关闭"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* AR预览区域 */}
      <div ref={arContainerRef} className="flex-1 relative overflow-hidden">
        {isLoading ? (
          // 加载状态
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
              <p className="text-lg">正在加载AR预览...</p>
            </div>
          </div>
        ) : (
          // AR预览内容
          <div className="w-full h-full">
            {/* 模拟AR场景 */}
            <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {/* 相机视图（模拟） */}
              <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url('https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=room%20interior%20background')` }}></div>
              
              {/* 放置指示器 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-dashed border-red-600 rounded-full animate-pulse"></div>
              </div>
              
              {/* 预览模型/图片 */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {config.type === '3d' ? (
                  // 3D模型预览（模拟）
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <i className="fas fa-cube text-4xl text-white"></i>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      3D模型
                    </div>
                  </div>
                ) : (
                  // 2D图片预览
                  <div className="relative">
                    <img
                      src={config.imageUrl || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=creative%20design%20work'}
                      alt="AR Preview"
                      className="w-48 h-48 object-cover rounded-lg shadow-lg"
                      style={{ transform: 'rotateY(180deg)' }} // 模拟镜像效果
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      2D图片
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={toggleARMode}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isARMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className={`fas fa-${isARMode ? 'eye-slash' : 'eye'}`}></i>
            {isARMode ? '退出AR模式' : '进入AR模式'}
          </button>
          
          <button
            onClick={resetPosition}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <i className="fas fa-redo"></i>
            重置位置
          </button>
        </div>
        
        {/* 缩放控制 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">缩放</label>
            <span className="text-sm">{config.scale || 1.0}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            defaultValue={config.scale || 1.0}
            onChange={handleScaleChange}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
        
        {/* AR提示信息 */}
        <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <p className="font-medium mb-1">AR预览提示</p>
              <ul className="list-disc list-inside space-y-1">
                <li>确保设备支持AR功能</li>
                <li>在明亮环境中使用效果更佳</li>
                <li>将设备对准平面（如桌面、地面）</li>
                <li>点击屏幕放置模型</li>
                <li>双指缩放调整大小</li>
                <li>单指拖动调整位置</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPreview;
