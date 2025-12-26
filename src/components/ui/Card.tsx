// src/components/ui/Card.tsx

import { ReactNode } from 'react';
import { clsx } from 'clsx';

// 卡片属性接口
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'small' | 'medium' | 'large';
}

// 卡片头部属性接口
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

// 卡片标题属性接口
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

// 卡片正文属性接口
interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

// 卡片底部属性接口
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

// 卡片组件
const Card = ({ children, className, variant = 'default', padding = 'medium' }: CardProps) => {
  // 变体样式映射
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300',
    outlined: 'bg-transparent rounded-xl border border-gray-300 dark:border-gray-600'
  };

  // 内边距样式映射
  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={clsx(variantClasses[variant], paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

// 卡片头部组件
const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={clsx('flex flex-col space-y-2', className)}>
      {children}
    </div>
  );
};

// 卡片标题组件
const CardTitle = ({ children, className, level = 'h3' }: CardTitleProps) => {
  const Tag = level;
  return (
    <Tag className={clsx('text-xl font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </Tag>
  );
};

// 卡片正文组件
const CardBody = ({ children, className }: CardBodyProps) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {children}
    </div>
  );
};

// 卡片底部组件
const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={clsx('flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
      {children}
    </div>
  );
};

// 导出卡片组件及其子组件
export { Card, CardHeader, CardTitle, CardBody, CardFooter };

export default Card;