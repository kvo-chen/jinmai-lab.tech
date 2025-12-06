import { useState, useEffect } from 'react';
import { ParticleModelType } from '@/lib/particleModels';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import ParticleSystemContainer from '@/components/ParticleSystem';

// 津门老字号主题配置
const tianjinThemes = [
  {
    name: '泥人张',
    description: '天津传统彩塑，形神兼备的艺术风格',
    color: '#d4a574',
    model: 'buddha' as ParticleModelType,
    icon: '🗿',
    behavior: 'default' as const
  },
  {
    name: '杨柳青年画',
    description: '中国著名民间木版年画，色彩鲜艳',
    color: '#ff6b6b',
    model: 'flower' as ParticleModelType,
    icon: '🖼️',
    behavior: 'wave' as const
  },
  {
    name: '风筝魏',
    description: '天津特色风筝，精巧工艺',
    color: '#4ecdc4',
    model: 'firework' as ParticleModelType,
    icon: '🪁',
    behavior: 'spiral' as const
  },
  {
    name: '狗不理包子',
    description: '天津传统美食，皮薄馅大',
    color: '#f7b733',
    model: 'baozi' as ParticleModelType,
    icon: '🥟',
    behavior: 'orbit' as const
  },
  {
    name: '桂发祥麻花',
    description: '天津特色小吃，酥脆香甜',
    color: '#ff9f43',
    model: 'saturn' as ParticleModelType,
    icon: '🥨',
    behavior: 'explosion' as const
  }
];

// 粒子效果预设类型
interface ParticlePreset {
  id: string;
  name: string;
  icon: string;
  controls: ParticleControls;
}

// 粒子效果控制选项
interface ParticleControls {
  showTrails: boolean;
  particleCount: number;
  animationSpeed: number;
  colorVariation: number;
  particleSize: number;
  rotationSpeed: number;
  gestureSensitivity: number;
}

// 粒子效果预设
const particlePresets: ParticlePreset[] = [
  {
    id: 'default',
    name: '默认效果',
    icon: '✨',
    controls: {
      showTrails: true,
      particleCount: 300, // 增加粒子数量，使形状更清晰
      animationSpeed: 1.0,
      colorVariation: 0.3, // 减少颜色变化，保持形状一致性
      particleSize: 1.0, // 调整粒子大小
      rotationSpeed: 0.8, // 降低旋转速度，便于观察形状
      gestureSensitivity: 1.2
    }
  },
  {
    id: 'dense',
    name: '密集效果',
    icon: '🌊',
    controls: {
      showTrails: true,
      particleCount: 500, // 增加粒子数量
      animationSpeed: 0.8,
      colorVariation: 0.4,
      particleSize: 0.7,
      rotationSpeed: 0.6,
      gestureSensitivity: 1.0
    }
  },
  {
    id: 'shaped',
    name: '形状效果',
    icon: '🎯',
    controls: {
      showTrails: true,
      particleCount: 400, // 充足的粒子数量展示形状
      animationSpeed: 0.6, // 慢速动画，便于观察形状
      colorVariation: 0.2, // 低颜色变化，保持形状清晰
      particleSize: 1.1,
      rotationSpeed: 0.5, // 低旋转速度
      gestureSensitivity: 1.0
    }
  },
  {
    id: 'fast',
    name: '快速效果',
    icon: '⚡',
    controls: {
      showTrails: true,
      particleCount: 200,
      animationSpeed: 2.0,
      colorVariation: 0.5,
      particleSize: 1.0,
      rotationSpeed: 1.5,
      gestureSensitivity: 1.0
    }
  },
  {
    id: 'slow',
    name: '慢速效果',
    icon: '🐌',
    controls: {
      showTrails: true,
      particleCount: 350,
      animationSpeed: 0.4,
      colorVariation: 0.3,
      particleSize: 1.3,
      rotationSpeed: 0.4,
      gestureSensitivity: 1.2
    }
  }
];

export default function ParticleArt() {
  const { isDark, theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [model, setModel] = useState<ParticleModelType>(tianjinThemes[0].model);
  const [color, setColor] = useState(tianjinThemes[0].color);
  const [controls, setControls] = useState<ParticleControls>({
    showTrails: true,
    particleCount: 200,
    animationSpeed: 1.0,
    colorVariation: 0.4,
    particleSize: 1.2,
    rotationSpeed: 1.0,
    gestureSensitivity: 1.2
  });
  const [showControls, setShowControls] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [customPresets, setCustomPresets] = useState<ParticlePreset[]>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetIcon, setNewPresetIcon] = useState('🎨');
  const [particleSystemError, setParticleSystemError] = useState(false);
  
  // 组件挂载后强制触发一次状态更新，确保Framer Motion动画能正常触发
  useEffect(() => {
    setIsMounted(true);
    
    // 延迟100ms后强制更新一个状态，触发组件重新渲染，确保Framer Motion动画能正常触发
    const timer = setTimeout(() => {
      // 强制组件重新渲染，触发所有Framer Motion动画
      setShowControls(prev => prev);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 错误处理：粒子系统渲染失败时显示友好信息
  const handleParticleSystemError = () => {
    setParticleSystemError(true);
  };

  // 主题切换处理
  const handleThemeChange = (index: number) => {
    setSelectedTheme(index);
    setModel(tianjinThemes[index].model);
    setColor(tianjinThemes[index].color);
  };

  // 控制选项变化处理
  const handleControlChange = (key: keyof ParticleControls, value: number | boolean) => {
    setControls(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 保存自定义预设
  const saveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: ParticlePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      icon: newPresetIcon,
      controls: { ...controls }
    };
    
    setCustomPresets(prev => [...prev, newPreset]);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetIcon('🎨');
  };
  
  // 全屏模式处理
  const handleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // 删除自定义预设
  const deleteCustomPreset = (presetId: string) => {
    setCustomPresets(prev => prev.filter(preset => preset.id !== presetId));
  };
  
  // 合并所有预设（内置预设 + 自定义预设）
  const allPresets = [...particlePresets, ...customPresets];

  // 动态样式类
  const containerClasses = `relative overflow-hidden min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e17] via-[#1a1f2e] to-[#0a0e17]' : theme === 'pink' ? 'bg-gradient-to-br from-pink-50 to-purple-50' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`;

  return (
    <div className={containerClasses}>
      {/* 粒子系统容器 - 添加错误处理，确保在粒子系统渲染失败时显示友好信息 */}
        <div className="absolute inset-0 z-0">
          {particleSystemError ? (
            // 粒子系统渲染失败时的回退内容
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm">
              <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-4">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    粒子系统加载失败
                  </span>
                </h3>
                <p className="text-gray-300 mb-6">
                  很抱歉，粒子系统暂时无法加载。这可能是由于浏览器兼容性问题或资源加载失败导致的。
                </p>
                <button
                  onClick={() => setParticleSystemError(false)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  重试加载
                </button>
              </div>
            </div>
          ) : (
            // 正常渲染粒子系统
            <div onError={handleParticleSystemError}>
              <ParticleSystemContainer 
                model={model} 
                color={color} 
                behavior={tianjinThemes[selectedTheme].behavior}
                particleCount={controls.particleCount}
                particleSize={controls.particleSize}
                animationSpeed={controls.animationSpeed}
                rotationSpeed={controls.rotationSpeed}
                colorVariation={controls.colorVariation}
                showTrails={controls.showTrails}
              />
            </div>
          )}
        </div>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 动态渐变光环 */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[150vw] h-[150vw] rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-[100px] transform -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.1, 1], 
            opacity: [0.5, 0.8, 0.5],
            rotate: [0, 90, 0]
          }} 
          transition={{ 
            duration: 15, 
            ease: "easeInOut", 
            repeat: Infinity, 
            repeatType: "reverse"
          }} 
        />
        {/* 辅助光环 */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[120vw] h-[120vw] rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-[80px] transform -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, -60, 0]
          }} 
          transition={{ 
            duration: 12, 
            ease: "easeInOut", 
            repeat: Infinity, 
            repeatType: "reverse"
          }} 
        />
        {/* 粒子网格背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30"></div>
        {/* 动态线条装饰 */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ 
              top: `${20 + i * 15}%`,
              opacity: 0.3
            }}
            animate={{ 
              x: [0, 50, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 8 + i * 2, 
              ease: "easeInOut", 
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col min-h-screen" data-mounted={isMounted}>
        {/* 顶部标题区 */}
        <header className="py-8 px-6 text-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              津门老字号 · 粒子艺术
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              探索天津传统文化与现代科技的完美融合
            </p>
          </div>
        </header>

        {/* 主题选择区 */}
        <main className="flex-1 px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-6 text-center">选择一个津门老字号品牌</h2>
              
              {/* 主题选择卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
                {tianjinThemes.map((theme, index) => (
                  <motion.div
                    key={index}
                    className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-400 ${selectedTheme === index 
                      ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border-2 border-white shadow-xl shadow-purple-500/30 scale-105' 
                      : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10'}`}
                    onClick={() => handleThemeChange(index)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 品牌图标 - 动态旋转效果 */}
                    <div className="text-4xl mb-4 text-center relative z-10 transition-transform duration-500 group-hover:rotate-12">
                      {theme.icon}
                    </div>
                    
                    {/* 品牌名称 */}
                    <h3 className="text-xl font-bold text-white mb-2 text-center relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">{theme.name}</h3>
                    
                    {/* 品牌描述 */}
                    <p className="text-sm text-gray-300 mb-4 text-center line-clamp-2 relative z-10 transition-all duration-300 group-hover:text-gray-100">{theme.description}</p>
                    
                    {/* 颜色条 */}
                    <div 
                      className="h-2 rounded-full overflow-hidden bg-white/20 relative z-10"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: theme.color }}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    
                    {/* 选中状态指示器 */}
                    {selectedTheme === index && (
                      <motion.div 
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        <i className="fas fa-check"></i>
                      </motion.div>
                    )}
                    
                    {/* 悬停效果 - 多层次 */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div 
                      className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-75 blur-sm transition-opacity duration-300"
                    ></div>
                    {/* 底部光效 */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                    
                    {/* 粒子装饰效果 */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{ 
                            backgroundColor: theme.color,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.5, 0],
                            x: [0, (Math.random() - 0.5) * 20],
                            y: [0, (Math.random() - 0.5) * 20],
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 控制区域 */}
            <div className="mb-12">
              {/* 控制开关 */}
              <div className="flex items-center justify-center mb-6">
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/20 hover:scale-105 transition-all duration-300"
                >
                  <i className={`fas ${showControls ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  <span>{showControls ? '隐藏控制面板' : '显示控制面板'}</span>
                </button>
              </div>
              
              {/* 控制面板 */}
              {showControls && (
                <div className="overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
                  {/* 面板顶部装饰 */}
                  <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">
                      <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                        粒子效果控制
                      </span>
                    </h3>
                    
                    {/* 预设选择 */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">效果预设</h4>
                        <button
                          onClick={() => setShowSavePresetModal(true)}
                          className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <i className="fas fa-save"></i>
                          <span>保存预设</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {allPresets.map((preset) => (
                          <motion.button
                            key={preset.id}
                            onClick={() => setControls(preset.controls)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${JSON.stringify(preset.controls) === JSON.stringify(controls) 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/30' 
                              : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-md'}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>{preset.icon}</span>
                            <span>{preset.name}</span>
                            {preset.id.startsWith('custom-') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomPreset(preset.id);
                                }}
                                className="ml-1 text-red-500 hover:text-red-400 transition-colors"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 保存预设模态框 */}
                    <AnimatePresence>
                      {showSavePresetModal && (
                        <motion.div
                          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <h3 className="text-xl font-bold text-white mb-4 text-center">保存自定义预设</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-white font-medium mb-2">预设名称</label>
                                <input
                                  type="text"
                                  value={newPresetName}
                                  onChange={(e) => setNewPresetName(e.target.value)}
                                  placeholder="输入预设名称"
                                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-white font-medium mb-2">预设图标</label>
                                <input
                                  type="text"
                                  value={newPresetIcon}
                                  onChange={(e) => setNewPresetIcon(e.target.value)}
                                  placeholder="输入表情符号作为图标"
                                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setShowSavePresetModal(false)}
                                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={saveCustomPreset}
                                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {/* 拖尾效果 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="flex items-center justify-between mb-3">
                          <span className="text-white font-medium">拖尾效果</span>
                          <button
                            onClick={() => handleControlChange('showTrails', !controls.showTrails)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${controls.showTrails ? 'bg-green-600' : 'bg-gray-600'}`}
                          >
                            <span 
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-out ${controls.showTrails ? 'translate-x-[28px]' : 'translate-x-[4px]'}`}
                            />
                          </button>
                        </label>
                        <p className="text-xs text-gray-400">{controls.showTrails ? '开启粒子拖尾' : '关闭粒子拖尾'}</p>
                      </div>
                       
                      {/* 粒子数量 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          粒子数量: <span className="text-purple-400">{controls.particleCount}</span>
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="500"
                          step="20"
                          value={controls.particleCount}
                          onChange={(e) => handleControlChange('particleCount', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>50</span>
                          <span>500</span>
                        </div>
                      </div>
                       
                      {/* 粒子大小 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          粒子大小: <span className="text-cyan-400">{controls.particleSize.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={controls.particleSize}
                          onChange={(e) => handleControlChange('particleSize', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>小</span>
                          <span>大</span>
                        </div>
                      </div>
                       
                      {/* 动画速度 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          动画速度: <span className="text-blue-400">{controls.animationSpeed.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={controls.animationSpeed}
                          onChange={(e) => handleControlChange('animationSpeed', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>慢</span>
                          <span>快</span>
                        </div>
                      </div>
                       
                      {/* 旋转速度 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          旋转速度: <span className="text-orange-400">{controls.rotationSpeed.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.1"
                          value={controls.rotationSpeed}
                          onChange={(e) => handleControlChange('rotationSpeed', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>静态</span>
                          <span>快速</span>
                        </div>
                      </div>
                       
                      {/* 颜色变化 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          颜色变化: <span className="text-pink-400">{controls.colorVariation.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={controls.colorVariation}
                          onChange={(e) => handleControlChange('colorVariation', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>统一</span>
                          <span>丰富</span>
                        </div>
                      </div>
                       
                      {/* 手势灵敏度 */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium mb-3">
                          手势灵敏度: <span className="text-green-400">{controls.gestureSensitivity.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={controls.gestureSensitivity}
                          onChange={(e) => handleControlChange('gestureSensitivity', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>迟钝</span>
                          <span>灵敏</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 使用说明 */}
            <div>
              <div className="max-w-3xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* 装饰背景 */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                  <div className="text-6xl">
                    🖐️
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6 text-center md:text-left">
                      <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        使用说明
                      </span>
                    </h3>
                    <div className="space-y-4 text-gray-300">
                      {[
                        { icon: 'fa-hand-sparkles', color: 'text-pink-500', text: '使用手势控制粒子的缩放与扩散' },
                        { icon: 'fa-expand-alt', color: 'text-blue-500', text: '张开双手：放大粒子，增加扩散范围' },
                        { icon: 'fa-compress-alt', color: 'text-purple-500', text: '握拳：缩小粒子，减少扩散范围' },
                        { icon: 'fa-palette', color: 'text-yellow-500', text: '选择不同的津门老字号品牌，体验不同风格的粒子效果' }
                      ].map((item, index) => (
                        <p 
                          key={index}
                          className="flex items-center gap-3 hover:translate-x-2.5 transition-transform duration-300 hover:text-white"
                        >
                          <i className={`fas ${item.icon} ${item.color} text-lg`}></i>
                          <span>{item.text}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="py-8 px-6 text-center text-gray-400 text-sm bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <p className="text-lg font-medium text-white">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  津脉智坊 · 3D粒子艺术展示
                </span>
              </p>
            </div>
            
            <div className="space-y-3">
              <p>结合传统津门文化与现代科技，打造沉浸式视觉体验</p>
              
              {/* 品牌标签 */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {tianjinThemes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-110 transition-all duration-300"
                  >
                    {theme.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto my-6"></div>
            
            <p className="text-xs text-gray-500">© 2024 津脉智坊. 保留所有权利.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
