import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Link } from 'react-router-dom';

const MembershipBenefits: React.FC = () => {
  const [benefits, setBenefits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取会员权益
    const fetchBenefits = async () => {
      try {
        const response = await apiClient.get<{ benefits: any }>('/api/membership/benefits');
        if (response.ok && response.data) {
          setBenefits(response.data.benefits);
        }
      } catch (err) {
        console.error('获取会员权益失败:', err);
        setError('获取会员权益失败');
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !benefits) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 会员等级配置
  const membershipLevels = [
    {
      id: 'free',
      name: '免费会员',
      description: '基础AI创作体验',
      color: 'bg-gray-100',
      textColor: 'text-gray-800'
    },
    {
      id: 'premium',
      name: '高级会员',
      description: '高级AI创作功能',
      color: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    {
      id: 'vip',
      name: 'VIP会员',
      description: '顶级AI创作体验',
      color: 'bg-purple-100',
      textColor: 'text-purple-800'
    }
  ];

  // 所有权益列表（去重）
  const allBenefits = Array.from(
    new Map(
      [...(benefits.free || []), ...(benefits.premium || []), ...(benefits.vip || [])]
        .map(item => [item.id, item])
    ).values()
  );

  return (
    <div className="container mx-auto py-10">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">会员权益</h1>
        <p className="text-gray-600">选择适合您的会员等级，解锁更多AI创作功能</p>
      </div>

      {/* 会员等级概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {membershipLevels.map((level) => (
          <div 
            key={level.id} 
            className={`rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl ${level.color}`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${level.textColor}`}>{level.name}</h2>
            <p className="text-gray-600 mb-4">{level.description}</p>
            <div className="space-y-2">
              {(benefits[level.id as keyof typeof benefits] || []).slice(0, 3).map((benefit: any) => (
                <div key={benefit.id} className="flex items-start space-x-3">
                  <div className="text-green-500 mt-1">✓</div>
                  <div className="text-sm">{benefit.name}</div>
                </div>
              ))}
              {(benefits[level.id as keyof typeof benefits] || []).length > 3 && (
                <div className="text-sm text-gray-500 mt-2">
                  +{(benefits[level.id as keyof typeof benefits] || []).length - 3} 项更多权益
                </div>
              )}
            </div>
            <div className="mt-6">
              <Link 
                to="/membership" 
                className={`inline-block px-6 py-3 rounded-full font-medium transition-colors ${level.id === 'free' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}
              >
                {level.id === 'free' ? '立即注册' : '立即升级'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 详细权益对比 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">详细权益对比</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-4 px-6 text-left font-medium text-gray-500">权益</th>
                {membershipLevels.map((level) => (
                  <th key={level.id} className="py-4 px-6 text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${level.color} ${level.textColor}`}>
                      {level.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allBenefits.map((benefit: any) => (
                <tr key={benefit.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium">{benefit.name}</div>
                    <div className="text-sm text-gray-600">{benefit.description}</div>
                  </td>
                  {membershipLevels.map((level) => {
                    const hasBenefit = (benefits[level.id as keyof typeof benefits] || []).some((b: any) => b.id === benefit.id);
                    return (
                      <td key={level.id} className="py-4 px-6 text-center">
                        {hasBenefit ? (
                          <div className="text-green-500 text-xl">✓</div>
                        ) : (
                          <div className="text-gray-300 text-xl">✗</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
        <h2 className="text-2xl font-bold mb-6">常见问题</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-2">会员到期后会怎样？</h3>
            <p className="text-gray-600">
              会员到期后，您的账户将自动降级为免费会员，无法继续使用高级功能。您可以随时续费恢复会员权益。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">如何升级或降级会员？</h3>
            <p className="text-gray-600">
              您可以在会员中心页面随时升级会员等级。降级将在当前会员周期结束后生效。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">会员权益可以退款吗？</h3>
            <p className="text-gray-600">
              会员购买后7天内可以申请退款，超过7天不支持退款。退款将按照剩余会员天数比例计算。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">商业授权是什么意思？</h3>
            <p className="text-gray-600">
              VIP会员享有商业授权，可以将AI生成的作品用于商业用途，包括广告、产品设计、出版物等。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">专属AI训练模型是什么？</h3>
            <p className="text-gray-600">
              VIP会员可以使用专属AI训练模型，根据自己的需求训练个性化AI模型，生成更符合自己风格的作品。
            </p>
          </div>
        </div>
      </div>

      {/* 行动号召 */}
      <div className="bg-primary rounded-xl shadow-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">准备好解锁更多AI创作功能了吗？</h2>
        <p className="mb-6">选择适合您的会员等级，开始创作之旅</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/membership" 
            className="inline-block bg-white text-primary px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            查看会员套餐
          </Link>
          <Link 
            to="/register" 
            className="inline-block border-2 border-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
          >
            免费注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MembershipBenefits;
