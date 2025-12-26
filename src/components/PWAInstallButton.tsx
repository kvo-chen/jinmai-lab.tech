import React, { useEffect, useState } from 'react';

// 为BeforeInstallPromptEvent添加类型声明
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }

  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'appinstalled': Event;
  }
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止 Chrome 67 及更早版本自动显示安装提示
      e.preventDefault();
      // 保存事件，以便稍后触发安装
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 显示安装按钮
      setShowInstallButton(true);
      // 显示安装引导
      setShowGuide(true);
    };

    const handleAppInstalled = () => {
      // 应用已安装，隐藏安装按钮
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setShowGuide(false);
      setInstallStatus('installed');
      // 3秒后隐藏安装状态
      setTimeout(() => setInstallStatus('idle'), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // 显示安装状态
    setInstallStatus('installing');
    setShowGuide(false);

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallStatus('installed');
    } else {
      setInstallStatus('dismissed');
      // 如果用户拒绝，3秒后恢复显示安装按钮
      setTimeout(() => {
        setInstallStatus('idle');
        setShowInstallButton(true);
      }, 3000);
    }

    // 无论结果如何，我们都不能再次使用该事件
    setDeferredPrompt(null);
    setShowInstallButton(false);
    
    // 3秒后隐藏安装状态
    setTimeout(() => setInstallStatus('idle'), 3000);
  };

  const handleGuideClose = () => {
    setShowGuide(false);
  };

  // 检查是否支持PWA安装
  const isPWASupported = () => {
    return 'BeforeInstallPromptEvent' in window;
  };

  if (!showInstallButton && !showGuide && installStatus === 'idle') {
    return null;
  }

  return (
    <>
      {/* 安装引导 */}
      {showGuide && isPWASupported() && (
        <div className="fixed bottom-20 right-6 z-40 max-w-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">安装应用到主屏幕</h3>
              <button 
                onClick={handleGuideClose} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              点击下方按钮，将应用安装到主屏幕，获得更好的使用体验。
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>支持离线使用</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>更快的加载速度</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>类似原生应用的体验</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 安装按钮 */}
      {showInstallButton && isPWASupported() && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <i className="fas fa-download text-lg"></i>
            <span>安装应用</span>
          </button>
        </div>
      )}

      {/* 安装状态提示 */}
      {installStatus !== 'idle' && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 ${installStatus === 'installing' ? 'bg-yellow-100 text-yellow-800' : installStatus === 'installed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {installStatus === 'installing' && (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>正在安装...</span>
              </>
            )}
            {installStatus === 'installed' && (
              <>
                <i className="fas fa-check-circle"></i>
                <span>安装成功！</span>
              </>
            )}
            {installStatus === 'dismissed' && (
              <>
                <i className="fas fa-times-circle"></i>
                <span>已取消安装</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;