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
        <section className="bg-white rounded-2xl shadow-md p-6 mb-12" aria-labelledby="member-status-title">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 id="member-status-title" className="text-2xl font-bold mb-2 text-gray-900">
                您当前是 {user.membershipLevel === 'free' ? '免费会员' : 
                           user.membershipLevel === 'premium' ? '高级会员' : 'VIP会员'}
              </h2>
              <p className="text-gray-600 mb-4">
                会员状态: {isActive ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">有效</span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">已过期</span>
                )}
              </p>
              
              {user.membershipEnd && (
                <p className="text-gray-600">
                  到期时间: <span className="font-medium">{new Date(user.membershipEnd).toLocaleDateString()}</span>
                </p>
              )}
            </div>
            
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4">
              {user.membershipLevel !== 'free' && (
                <button
                  className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto font-medium"
                  onClick={handleRenew}
                  aria-label="续费会员"
                >
                  续费
                </button>
              )}
              {user.membershipLevel !== 'vip' && (
                <button
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto font-medium hover:shadow-lg"
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
        <section className="bg-white rounded-2xl shadow-md p-6 mb-12" aria-labelledby="member-benefits-title">
          <h2 id="member-benefits-title" className="text-2xl font-bold mb-6 text-center text-gray-900">您的权益</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {userBenefits.map((benefit: string, index: number) => (
              <li key={index} className="flex items-center space-x-3 bg-gray-50 px-4 py-3 rounded-lg">
                <span className="text-primary">✓</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 会员套餐 */}
        <section className="mb-12" aria-labelledby="upgrade-title">
          <h2 id="upgrade-title" className="text-3xl font-bold mb-8 text-center text-gray-900">升级会员</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {membershipPlans.map((plan) => (
              <article 
                key={plan.id} 
                className={`rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${plan.id === 'vip' ? 'border-2 border-purple-500 shadow-lg hover:shadow-xl bg-gradient-to-b from-white to-purple-50' : plan.popular ? 'border-2 border-primary shadow-md hover:shadow-lg bg-white' : 'border border-gray-200 shadow-sm hover:shadow-md bg-white'}`}
                aria-labelledby={`plan-title-${plan.id}`}
              >
                {plan.popular && plan.id === 'premium' && (
                  <div className="bg-primary text-white text-center py-1.5 font-medium" aria-label="最受欢迎套餐">
                    最受欢迎
                  </div>
                )}
                {plan.id === 'vip' && (
                  <div className="bg-purple-600 text-white text-center py-1.5 font-medium" aria-label="顶级会员">
                    顶级会员
                  </div>
                )}
                <div className="p-6 flex-1">
                  <h3 id={`plan-title-${plan.id}`} className="text-xl font-bold mb-2 text-center text-gray-900">{plan.name}</h3>
                  <div className="flex items-end justify-center mb-4">
                    <span className={`text-3xl font-bold ${plan.id === 'vip' ? 'text-purple-600' : 'text-primary'}`}>¥{plan.price}</span>
                    <span className="text-sm font-medium text-gray-500 ml-1">/{plan.period}</span>
                  </div>
                  <p className={`text-center mb-4 ${plan.id === 'vip' ? 'text-purple-600' : 'text-primary'}`}>{plan.description}</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center space-x-3 py-1">
                        <span className={`flex-shrink-0 ${plan.id === 'vip' ? 'text-purple-600' : 'text-primary'}`}>✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-4">
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] ${user.membershipLevel === plan.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : plan.id === 'vip' ? 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg' : 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg'}`}
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
        <section className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto mb-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-bold mb-8 text-center text-gray-900">常见问题</h2>
          <div className="space-y-5 max-w-3xl mx-auto">
            <details className="group border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:border-gray-200">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>如何升级会员？</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-primary">▼</span>
              </summary>
              <p className="text-gray-600 pt-3">点击上方的升级按钮，选择您想要的会员套餐，完成支付即可升级。</p>
            </details>
            <details className="group border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:border-gray-200">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>会员到期后会自动续费吗？</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-primary">▼</span>
              </summary>
              <p className="text-gray-600 pt-3">目前不会自动续费，到期前我们会提醒您手动续费。</p>
            </details>
            <details className="group border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:border-gray-200">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>可以退款吗？</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-primary">▼</span>
              </summary>
              <p className="text-gray-600 pt-3">会员购买后7天内可以申请退款，超过7天不支持退款。</p>
            </details>
            <details className="group border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:border-gray-200">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center text-gray-800">
                <span>如何使用会员权益？</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-primary">▼</span>
              </summary>
              <p className="text-gray-600 pt-3">升级会员后，您可以直接使用所有会员权益，无需额外操作。</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Membership;
