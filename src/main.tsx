// 移除控制台日志增强代码，减少可能的错误

// 移除全局three.js引入，改为在需要的组件中按需引入

// 导入国际化配置
import './i18n/i18n';

import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext.tsx';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import { FriendProvider } from './contexts/friendContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import "./index.css";
// 恢复全局Font Awesome CSS，解决图标不显示问题
import '@fortawesome/fontawesome-free/css/all.min.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';

// 确保只在浏览器环境中执行渲染代码
if (typeof window !== 'undefined') {
  // 简化的全局对象初始化
  // 使用类型断言来避免TypeScript错误
  (window as any).knowledge = (window as any).knowledge || {};
  (window as any).lazilyLoaded = (window as any).lazilyLoaded || {};

  // Service Worker注册由Vite PWA插件自动处理
  // 移除手动注册，避免与自动注册冲突

  // 应用渲染
  const root = document.getElementById("root");
  if (root) {
    // 使用createRoot直接渲染，不进行hydration
    createRoot(root).render(
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                  <FriendProvider>
                    <WorkflowProvider>
                      <App />
                      <Toaster />
                    </WorkflowProvider>
                  </FriendProvider>
                </AuthProvider>
              </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  }
}
