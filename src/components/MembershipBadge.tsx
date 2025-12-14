import React from 'react';

interface MembershipBadgeProps {
  level: 'free' | 'premium' | 'vip';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ 
  level, 
  size = 'md', 
  className = '' 
}) => {
  const badgeConfig = {
    free: {
      name: '免费会员',
      color: 'bg-gray-100 text-gray-800',
      borderColor: 'border-gray-300',
      icon: '👤'
    },
    premium: {
      name: '高级会员',
      color: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-300',
      icon: '⭐'
    },
    vip: {
      name: 'VIP会员',
      color: 'bg-purple-100 text-purple-800',
      borderColor: 'border-purple-300',
      icon: '👑'
    }
  };

  const config = badgeConfig[level];
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full border ${config.color} ${config.borderColor} ${sizeClasses[size]} font-medium ${className}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.name}
    </span>
  );
};

export default MembershipBadge;
