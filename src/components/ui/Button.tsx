// src/components/ui/Button.tsx

import { ReactNode, ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';

// 按钮大小类型
export type ButtonSize = 'small' | 'medium' | 'large';

// 按钮属性接口
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  rippleEffect?: boolean;
}

// 按钮组件
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  rippleEffect = true,
  className,
  disabled,
  onClick,
  ...props
}, ref) => {
  const [rippleStyle, setRippleStyle] = useState({ display: 'none', left: '0px', top: '0px', width: '0px', height: '0px' });

  // 处理点击涟漪效果
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (rippleEffect) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      setRippleStyle({ display: 'block', left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });

      setTimeout(() => {
        setRippleStyle({ display: 'none', left: '0px', top: '0px', width: '0px', height: '0px' });
      }, 600);
    }

    // 调用原始点击事件
    if (onClick) {
      onClick(e);
    }
  };

  // 变体样式映射
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90 border-transparent shadow-md hover:shadow-lg',
    secondary: 'bg-secondary text-primary hover:bg-secondary/80 border-transparent',
    danger: 'bg-danger text-white hover:bg-danger/90 border-transparent shadow-md hover:shadow-lg',
    success: 'bg-success text-white hover:bg-success/90 border-transparent shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-primary hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10'
  };

  // 大小样式映射
  const sizeClasses = {
    small: 'text-sm px-3 py-1.5 h-8',
    medium: 'text-base px-4 py-2 h-10',
    large: 'text-lg px-6 py-3 h-12'
  };

  // 构建完整的类名
  const buttonClasses = clsx(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    loading && 'opacity-70 cursor-not-allowed',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* 涟漪效果元素 */}
      {rippleEffect && (
        <span
          className="absolute rounded-full bg-white/30 pointer-events-none transform scale-0 animate-ripple"
          style={rippleStyle}
        ></span>
      )}

      {/* 加载状态指示器 */}
      {loading && (
        <i className="fas fa-spinner animate-spin mr-2"></i>
      )}

      {/* 图标 */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}

      {/* 按钮文本 */}
      <span>{children}</span>

      {/* 右侧图标 */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;