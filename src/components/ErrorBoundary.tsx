import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorService from '@/services/errorService';
import { toast } from 'sonner';
import { withTranslation, WithTranslation } from 'react-i18next';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  t: (key: string) => string;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
    this.t = props.t;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下一次渲染时显示降级UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      componentName: this.constructor.name,
      props: this.props
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 显示错误提示
    toast.error(
      this.t('error.message'),
      {
        duration: 5000,
        action: {
          label: this.t('error.refreshButton'),
          onClick: () => window.location.reload()
        }
      }
    );
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认降级UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">{this.t('error.title')}</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {this.t('error.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                {this.t('error.refreshButton')}
              </button>
              <button
                onClick={() => {
                  const feedbackButton = document.querySelector('[title="用户反馈"]') as HTMLElement;
                  feedbackButton?.click();
                }}
                className="px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {this.t('error.contactSupportButton')}
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 p-4 rounded-lg text-left bg-gray-100 dark:bg-gray-800">
                <summary className="cursor-pointer font-medium">{this.t('error.detailsTitle')}</summary>
                <pre className="mt-2 whitespace-pre-wrap text-sm">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br />
                      {this.t('error.componentStack')}
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
