import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { apiClient } from '@/lib/apiClient';
import { useLocation, useNavigate } from 'react-router-dom';

const MembershipPayment: React.FC = () => {
  const { user, updateMembership } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  
  // 获取从会员中心传递过来的套餐信息
  const plan = (location.state as any)?.plan || 'premium';
  const isRenew = (location.state as any)?.renew || false;

  // 会员套餐数据
  const membershipPlans = {
    premium: {
      name: '高级会员',
      price: 99,
      period: 'month',
      duration: 30 * 24 * 60 * 60 * 1000 // 30天
    },
    vip: {
      name: 'VIP会员',
      price: 199,
      period: 'month',
      duration: 30 * 24 * 60 * 60 * 1000 // 30天
    }
  };

  const selectedPlan = membershipPlans[plan as keyof typeof membershipPlans];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || !selectedPlan) {
    return null;
  }

  // 处理支付
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟支付过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 创建订单
      const orderResponse = await apiClient.post('/api/payment/create', {
        plan: plan,
        amount: selectedPlan.price,
        paymentMethod: paymentMethod
      });
      
      if (orderResponse.ok) {
        // 模拟支付成功
        // 在实际项目中，这里应该跳转到支付网关
        
        // 计算会员到期时间
        const now = new Date();
        const endDate = new Date();
        endDate.setTime(now.getTime() + selectedPlan.duration);
        
        // 更新会员信息
        await updateMembership({
          membershipLevel: plan,
          membershipStatus: 'active',
          membershipStart: now.toISOString(),
          membershipEnd: endDate.toISOString()
        });
        
        setSuccess(true);
        
        // 3秒后跳转到会员中心
        setTimeout(() => {
          navigate('/membership');
        }, 3000);
      } else {
        setError('创建订单失败');
      }
    } catch (err) {
      console.error('支付失败:', err);
      setError('支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{isRenew ? '续费会员' : '升级会员'}</h1>
          <p className="text-gray-600">
            {isRenew ? `续费 ${selectedPlan.name}` : `升级到 ${selectedPlan.name}`}
          </p>
        </div>

        {success ? (
          // 支付成功
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">支付成功！</h2>
            <p className="text-gray-600 mb-6">
              {isRenew ? '您的会员已成功续费' : '您已成功升级会员'}
            </p>
            <p className="text-gray-500 mb-8">
              3秒后将自动跳转到会员中心...
            </p>
            <button
              className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
              onClick={() => navigate('/membership')}
            >
              立即前往会员中心
            </button>
          </div>
        ) : (
          // 支付表单
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* 套餐信息 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">套餐信息</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">套餐名称</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">价格</span>
                  <span className="text-2xl font-bold">¥{selectedPlan.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">有效期</span>
                  <span>{selectedPlan.period}</span>
                </div>
              </div>
            </div>

            {/* 支付方式 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">选择支付方式</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`border-2 rounded-lg p-4 flex flex-col items-center justify-center transition-all ${paymentMethod === 'wechat' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
                  onClick={() => setPaymentMethod('wechat')}
                >
                  <div className="text-3xl mb-2">💚</div>
                  <span className="font-medium">微信支付</span>
                </button>
                <button
                  className={`border-2 rounded-lg p-4 flex flex-col items-center justify-center transition-all ${paymentMethod === 'alipay' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
                  onClick={() => setPaymentMethod('alipay')}
                >
                  <div className="text-3xl mb-2">💙</div>
                  <span className="font-medium">支付宝</span>
                </button>
                <button
                  className={`border-2 rounded-lg p-4 flex flex-col items-center justify-center transition-all ${paymentMethod === 'credit' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
                  onClick={() => setPaymentMethod('credit')}
                >
                  <div className="text-3xl mb-2">💳</div>
                  <span className="font-medium">信用卡</span>
                </button>
                <button
                  className={`border-2 rounded-lg p-4 flex flex-col items-center justify-center transition-all ${paymentMethod === 'unionpay' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
                  onClick={() => setPaymentMethod('unionpay')}
                >
                  <div className="text-3xl mb-2">🔴</div>
                  <span className="font-medium">银联支付</span>
                </button>
              </div>
            </div>

            {/* 支付按钮 */}
            <div>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <button
                className="w-full bg-primary text-white py-4 rounded-full font-medium text-lg hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    处理中...
                  </div>
                ) : (
                  `确认支付 ¥${selectedPlan.price}`
                )}
              </button>
              <div className="text-center text-gray-500 mt-4 text-sm">
                点击支付即表示您同意
                <a href="/terms" className="text-primary hover:underline ml-1">
                  《会员服务协议》
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPayment;
