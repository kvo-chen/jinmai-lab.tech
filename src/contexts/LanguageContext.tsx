import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import i18n from '../i18n/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  languages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'zh');

  // 可用语言列表
  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' }
  ];

  // 当i18n语言变化时更新状态
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };

    // 监听语言变化
    i18n.on('languageChanged', handleLanguageChange);

    // 清理监听器
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // 切换语言
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    languages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义钩子，方便组件使用
const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default useLanguage;