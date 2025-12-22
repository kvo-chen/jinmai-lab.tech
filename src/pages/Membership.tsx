import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { apiClient } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';

const Membership: React.FC = () => {
  const { user, checkMembershipStatus, getMembershipBenefits, updateMembership } = useContext(AuthContext);
  const navigate = useNavigate();
  const [benefits, setBenefits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 会员套餐数据
  const membershipPlans = [
    {
      id: 'premium',
      name: '高级会员',
      price: 99,
      period: 'month',
      description: '解锁高级AI创作功能',
      features: [
        '无限AI生成次数',
        '高级AI模型访问',
        '高清作品导出',
        '优先处理队列',
        '专属模板库',
        '去除水印'
      ],
      popular: true
    },
    {
      id: 'vip',
      name: 'VIP会员',
      price: 199,
      period: 'month',
      description: '享受顶级AI创作体验',
      features: [
        '包含高级会员所有权益',
        '专属AI训练模型',
        '一对一设计师服务',
        '商业授权',
        '专属活动邀请',
        '无限作品存储'
      ]
    }
  ];

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

  // 处理升级会员
  const handleUpgrade = async (planId: string) => {
    try {
      // 这里应该跳转到支付页面，传递套餐信息
      navigate('/membership/payment', { state: { plan: planId } });
    } catch (err) {
      console.error('升级会员失败:', err);
      setError('升级会员失败');
    }
  };

  // 处理续费
  const handleRenew = async () => {
    try {
      // 这里应该跳转到支付页面，传递续费信息
      navigate('/membership/payment', { state: { plan: user?.membershipLevel, renew: true } });
    } catch (err) {
      console.error('续费失败:', err);
      setError('续费失败');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <button 
            className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
            onClick={() => navigate('/login')}
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  const isActive = checkMembershipStatus();
  const userBenefits = getMembershipBenefits();

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <header className="text-center mb-10" aria-label="会员中心页面标题">
          <h1 className="text-3xl font-bold mb-2 text-primary">会员中心</h1>
          <p className="text-gray-600 dark:text-gray-300">管理您的会员权益</p>
        </header>

        {/* 会员状态卡片 */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-10" aria-labelledby="member-status-title">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 id="member-status-title" className="text-2xl font-bold mb-2 md:text-2xl text-xl text-primary">
                您当前是 {user.membershipLevel === 'free' ? '免费会员' : 
                           user.membershipLevel === 'premium' ? '高级会员' : 'VIP会员'}
              </h2>
              <p className="text-gray-600 mb-4">
                会员状态: {isActive ? (
                  <span className="text-green-500 font-medium">有效</span>
                ) : (
                  <span className="text-red-500 font-medium">已过期</span>
                )}
              </p>
              
              {user.membershipEnd && (
                <p className="text-gray-600">
                  到期时间: {new Date(user.membershipEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 md:gap-4">
              {user.membershipLevel !== 'free' && (
                <button
                  className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors w-full sm:w-auto"
                  onClick={handleRenew}
                  aria-label="续费会员"
                >
                  续费
                </button>
              )}
              {user.membershipLevel !== 'vip' && (
                <button
                  className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors w-full sm:w-auto"
                  onClick={() => navigate('/membership/upgrade')}
                  aria-label="升级会员"
                >
                  升级会员
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 会员权益 */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-10" aria-labelledby="member-benefits-title">
          <h2 id="member-benefits-title" className="text-2xl font-bold mb-6 text-primary">您的权益</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBenefits.map((benefit: string, index: number) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-primary mt-1">✓</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 会员套餐 */}
        <section className="mb-10" aria-labelledby="upgrade-title">
          <h2 id="upgrade-title" className="text-2xl font-bold mb-6 text-center text-primary">升级会员</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
            {membershipPlans.map((plan) => (
              <article 
                key={plan.id} 
                className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-2 border-primary' : 'border border-gray-200'} w-full`}
                aria-labelledby={`plan-title-${plan.id}`}
              >
                {plan.popular && (
                  <div className="bg-primary text-white text-center py-1.5 font-medium" aria-label="最受欢迎套餐">
                    最受欢迎
                  </div>
                )}
                <div className="p-5">
                  <h3 id={`plan-title-${plan.id}`} className="text-lg font-bold mb-2 text-primary">{plan.name}</h3>
                  <div className="text-2xl font-bold mb-3 text-primary">
                    ¥{plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <ul className="mb-5 space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-full font-medium transition-colors ${user.membershipLevel === plan.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={user.membershipLevel === plan.id}
                    aria-label={`${user.membershipLevel === plan.id ? '当前会员' : '立即升级'}${plan.name}`}
                  >
                    {user.membershipLevel === plan.id ? '当前会员' : '立即升级'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 常见问题 */}
        <section className="bg-white rounded-xl shadow-lg p-6" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-bold mb-6 text-primary">常见问题</h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="font-medium mb-2 cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>如何升级会员？</span>
                <span className="transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <p className="text-gray-600 pl-4">点击上方的升级按钮，选择您想要的会员套餐，完成支付即可升级。</p>
            </details>
            <details className="group">
              <summary className="font-medium mb-2 cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>会员到期后会自动续费吗？</span>
                <span className="transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <p className="text-gray-600 pl-4">目前不会自动续费，到期前我们会提醒您手动续费。</p>
            </details>
            <details className="group">
              <summary className="font-medium mb-2 cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>可以退款吗？</span>
                <span className="transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <p className="text-gray-600 pl-4">会员购买后7天内可以申请退款，超过7天不支持退款。</p>
            </details>
            <details className="group">
              <summary className="font-medium mb-2 cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>如何使用会员权益？</span>
                <span className="transition-transform duration-300 group-open:rotate-180">▼</span>
              </summary>
              <p className="text-gray-600 pl-4">升级会员后，您可以直接使用所有会员权益，无需额外操作。</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Membership;
