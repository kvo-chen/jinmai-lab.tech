import React, { useEffect, useState } from 'react';

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // 阻止 Chrome 67 及更早版本自动显示安装提示
      e.preventDefault();
      // 保存事件，以便稍后触发安装
      setDeferredPrompt(e);
      // 显示安装按钮
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      // 应用已安装，隐藏安装按钮
      setDeferredPrompt(null);
      setShowInstallButton(false);
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

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

    // 无论结果如何，我们都不能再次使用该事件
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-blue-600 text-white font-medium py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
      >
        <i className="fas fa-download"></i>
        <span>安装到主屏幕</span>
      </button>
    </div>
  );
};

export default PWAInstallButton;