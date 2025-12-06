import React, { useEffect, useState } from 'react';

const FirstLaunchGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 检查是否是首次启动
    const isFirstLaunch = localStorage.getItem('firstLaunch') === null;
    const hasSeenGuide = localStorage.getItem('hasSeenGuide') === 'true';
    
    // 检查是否是从主屏幕启动的PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    if (isFirstLaunch || !hasSeenGuide) {
      // 延迟显示引导，让应用有时间加载
      setTimeout(() => {
        setShowGuide(true);
      }, 1000);
    }
  }, []);

  const steps = [
    {
      title: '欢迎使用津脉智坊',
      content: '感谢您安装津脉智坊应用！这是一个专注于津门老字号传承与创新的共创平台。',
      image: '/icons/icon-192x192.svg'
    },
    {
      title: '探索优质内容',
      content: '浏览津门老字号的精彩作品，发现传统文化的现代魅力。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=探索'
    },
    {
      title: '参与共创',
      content: '发挥您的创意，参与到津门老字号的创新发展中来。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=共创'
    },
    {
      title: '离线使用',
      content: '应用支持离线使用，即使没有网络也能浏览已缓存的内容。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=离线'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setShowGuide(false);
    localStorage.setItem('firstLaunch', 'false');
    localStorage.setItem('hasSeenGuide', 'true');
  };

  if (!showGuide) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* 引导内容 */}
        <div className="p-6">
          {/* 步骤指示器 */}
          <div className="flex justify-center mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${index === currentStep ? 'bg-blue-600 w-8' : 'bg-gray-300 dark:bg-gray-600'}`}
              ></div>
            ))}
          </div>

          {/* 步骤内容 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src={steps[currentStep].image}
                alt={steps[currentStep].title}
                className="w-32 h-32 object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {steps[currentStep].content}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
              跳过
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-300"
            >
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLaunchGuide;
