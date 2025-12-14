import React from 'react';
import MembershipBadge from './MembershipBadge';
import { User } from '@/contexts/authContext';

interface MembershipCardProps {
  user: User;
  className?: string;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ user, className = '' }) => {
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '无';
    return new Date(dateString).toLocaleDateString();
  };

  // 检查会员是否有效
  const isActive = () => {
    if (user.membershipLevel === 'free') return true;
    if (user.membershipStatus !== 'active') return false;
    if (!user.membershipEnd) return true;
    const now = new Date();
    const endDate = new Date(user.membershipEnd);
    return now <= endDate;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}>
      {/* 会员等级徽章 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">我的会员</h3>
          <MembershipBadge level={user.membershipLevel} size="md" />
        </div>
        <div className={`text-sm font-medium px-3 py-1 rounded-full ${isActive() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isActive() ? '有效' : '已过期'}
        </div>
      </div>

      {/* 会员信息 */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">会员等级</span>
          <span className="font-medium">
            {user.membershipLevel === 'free' ? '免费会员' : 
             user.membershipLevel === 'premium' ? '高级会员' : 'VIP会员'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">会员状态</span>
          <span className="font-medium">{user.membershipStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">开始时间</span>
          <span className="font-medium">{formatDate(user.membershipStart)}</span>
        </div>
        {user.membershipLevel !== 'free' && (
          <div className="flex justify-between">
            <span className="text-gray-600">到期时间</span>
            <span className={`font-medium ${!isActive() ? 'text-red-600' : ''}`}>
              {formatDate(user.membershipEnd)}
            </span>
          </div>
        )}
      </div>

      {/* 会员权益概览 */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">会员权益</h4>
        <div className="grid grid-cols-2 gap-2">
          {user.membershipLevel === 'free' && (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>基础AI创作</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>100个作品存储</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>基础模板库</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>社区参与</span>
              </div>
            </>
          )}
          {user.membershipLevel === 'premium' && (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>无限AI生成</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>高级AI模型</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>高清作品导出</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>优先处理队列</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>专属模板库</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>去除水印</span>
              </div>
            </>
          )}
          {user.membershipLevel === 'vip' && (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>包含高级会员所有权益</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>专属AI训练模型</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>一对一设计师服务</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>商业授权</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>专属活动邀请</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-green-500">✓</div>
                <span>无限作品存储</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
