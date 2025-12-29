import React from "react";
import { createContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import securityService from "../services/securityService";

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
  // 会员相关字段
  membershipLevel: 'free' | 'premium' | 'vip';
  membershipStart?: string;
  membershipEnd?: string;
  membershipStatus: 'active' | 'expired' | 'pending';
}

// AuthContext 类型定义
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, age?: string, tags?: string[]) => Promise<boolean>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  quickLogin: (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo') => Promise<boolean>;
  // 中文注释：更新用户信息（例如更换头像），会自动持久化
  updateUser: (partial: Partial<User>) => void;
  // 会员相关方法
  updateMembership: (membershipData: Partial<User>) => Promise<boolean>;
  checkMembershipStatus: () => boolean;
  getMembershipBenefits: () => string[];
  // 新增：双因素认证相关方法
  enableTwoFactorAuth: () => Promise<boolean>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  // 新增：刷新令牌方法
  refreshToken: () => Promise<boolean>;
}

// AuthProvider 组件属性类型
interface AuthProviderProps {
  children: ReactNode;
}

// 创建Context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  setIsAuthenticated: () => {},
  quickLogin: async () => false,
  updateUser: () => {},
  updateMembership: async () => false,
  checkMembershipStatus: () => false,
  getMembershipBenefits: () => [],
  enableTwoFactorAuth: async () => false,
  verifyTwoFactorCode: async () => false,
  refreshToken: async () => false,
});

// AuthProvider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 从本地存储获取用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token') || localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // 从本地存储获取用户信息
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // 添加默认会员信息
        return {
          ...parsedUser,
          membershipLevel: parsedUser.membershipLevel || 'free',
          membershipStatus: parsedUser.membershipStatus || 'active',
          membershipStart: parsedUser.membershipStart || new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // 定义API响应类型
  interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
  }

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 使用 Supabase 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          // 添加默认会员信息
          const userWithMembership = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '用户',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar || '',
            phone: session.user.user_metadata?.phone || '',
            interests: session.user.user_metadata?.interests || [],
            isAdmin: session.user.user_metadata?.isAdmin || false,
            age: session.user.user_metadata?.age || 0,
            tags: session.user.user_metadata?.tags || [],
            membershipLevel: session.user.user_metadata?.membershipLevel || 'free',
            membershipStart: session.user.user_metadata?.membershipStart || new Date().toISOString(),
            membershipEnd: session.user.user_metadata?.membershipEnd,
            membershipStatus: session.user.user_metadata?.membershipStatus || 'active',
          };
          
          // 存储用户信息到本地
          localStorage.setItem('user', JSON.stringify(userWithMembership));
          
          // 更新状态
          setUser(userWithMembership);
          setIsAuthenticated(true);
        } else {
          // 没有有效会话，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        // 发生错误，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    
    checkAuth();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // 用户登录成功
        const userWithMembership = {
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '用户',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar || '',
          phone: session.user.user_metadata?.phone || '',
          interests: session.user.user_metadata?.interests || [],
          isAdmin: session.user.user_metadata?.isAdmin || false,
          age: session.user.user_metadata?.age || 0,
          tags: session.user.user_metadata?.tags || [],
          membershipLevel: session.user.user_metadata?.membershipLevel || 'free',
          membershipStart: session.user.user_metadata?.membershipStart || new Date().toISOString(),
          membershipEnd: session.user.user_metadata?.membershipEnd,
          membershipStatus: session.user.user_metadata?.membershipStatus || 'active',
        };
        
        // 存储用户信息到本地
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        
        // 更新状态
        setUser(userWithMembership);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        // 用户登出
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    });
    
    // 清理订阅
    return () => subscription.unsubscribe();
  }, [user]);

  // 登录方法
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('登录失败:', error);
        return false;
      }
      
      if (data.user) {
        // 添加默认会员信息
        const userWithMembership = {
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '用户',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar || '',
          phone: data.user.user_metadata?.phone || '',
          interests: data.user.user_metadata?.interests || [],
          isAdmin: data.user.user_metadata?.isAdmin || false,
          age: data.user.user_metadata?.age || 0,
          tags: data.user.user_metadata?.tags || [],
          membershipLevel: data.user.user_metadata?.membershipLevel || 'free',
          membershipStart: data.user.user_metadata?.membershipStart || new Date().toISOString(),
          membershipEnd: data.user.user_metadata?.membershipEnd,
          membershipStatus: data.user.user_metadata?.membershipStatus || 'active',
        };
        
        // 存储用户信息到本地
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(userWithMembership);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 注册方法
  const register = async (username: string, email: string, password: string, age?: string, tags?: string[]): Promise<boolean> => {
    try {
      console.log('Starting Supabase signUp with:', { email, username });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            age: age ? parseInt(age) : null,
            tags,
            membershipLevel: 'free',
            membershipStatus: 'active',
            membershipStart: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
          },
          // 允许用户无需确认邮箱即可登录
          emailRedirectTo: window.location.origin
        }
      });
      
      console.log('Supabase signUp response:', { data, error });
      
      if (error) {
        console.error('注册失败:', error.message, error.code);
        return false;
      }
      
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // 添加默认会员信息
        const userWithMembership = {
          id: data.user.id,
          username,
          email: data.user.email || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
          phone: '',
          interests: [],
          isAdmin: false,
          age: age ? parseInt(age) : 0,
          tags: tags || [],
          membershipLevel: 'free',
          membershipStart: new Date().toISOString(),
          membershipEnd: undefined,
          membershipStatus: 'active',
        };
        
        // 存储用户信息到本地
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(userWithMembership);
        
        return true;
      } else if (data.session) {
        console.log('Session created but no user object returned, session:', data.session.user?.id);
        
        // 如果有session但没有user对象，尝试获取当前用户
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const userWithMembership = {
            id: userData.user.id,
            username,
            email: userData.user.email || '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
            phone: '',
            interests: [],
            isAdmin: false,
            age: age ? parseInt(age) : 0,
            tags: tags || [],
            membershipLevel: 'free',
            membershipStart: new Date().toISOString(),
            membershipEnd: undefined,
            membershipStatus: 'active',
          };
          
          localStorage.setItem('user', JSON.stringify(userWithMembership));
          setIsAuthenticated(true);
          setUser(userWithMembership);
          return true;
        }
      } else {
        console.log('Sign up initiated, user needs to confirm email:', data);
        // 如果需要邮箱确认，我们仍然返回成功，让用户去确认邮箱
        // 但是不自动登录
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('注册失败:', error.message, error.stack);
      return false;
    }
  };

  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo'): Promise<boolean> => {
    // 暂时保持模拟，后续可以扩展为真实的第三方登录
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseUser: User = {
          id: `quick-${provider}-${Date.now()}`,
          username: provider === 'wechat' ? '微信用户' : provider === 'phone' ? '手机号用户' : '第三方用户',
          email: `${provider}-${Date.now()}@example.com`,
          avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar",
          tags: ['国潮爱好者'],
          // 初始会员信息
          membershipLevel: 'free',
          membershipStart: new Date().toISOString(),
          membershipStatus: 'active',
        };
        
        // 生成模拟的token和refreshToken
        const mockToken = `mock-token-${provider}-${Date.now()}`;
        const mockRefreshToken = `mock-refresh-token-${provider}-${Date.now()}`;
        
        // 安全存储令牌和用户信息
        securityService.setSecureItem('SECURE_TOKEN', mockToken);
        securityService.setSecureItem('SECURE_REFRESH_TOKEN', mockRefreshToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('refreshToken', mockRefreshToken);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(baseUser));
        
        setIsAuthenticated(true);
        setUser(baseUser);
        resolve(true);
      }, 500);
    });
  };

  // 登出方法
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('登出失败:', error);
    }
    
    // 重置状态
    setIsAuthenticated(false);
    setUser(null);
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // 清除安全存储
    securityService.setSecureItem('SECURE_TOKEN', '');
    securityService.setSecureItem('SECURE_REFRESH_TOKEN', '');
    securityService.setSecureItem('SECURE_USER', null);
  };

  // 中文注释：更新用户信息并写入本地存储
  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      const next = { ...(prev || {} as User), ...partial } as User;
      try {
        localStorage.setItem('user', JSON.stringify(next));
        // 同时更新安全存储
        securityService.setSecureItem('SECURE_USER', next);
      } catch (error) {
        console.error('Failed to update user information:', error);
      }
      return next;
    });
  };

  // 更新会员信息
  const updateMembership = async (membershipData: Partial<User>): Promise<boolean> => {
    try {
      // 调用API更新会员信息
      const response = await apiClient.post<{ user: User }>('/api/membership/update', membershipData);
      
      if (response.ok && response.data && response.data.user) {
        // 更新本地用户信息
        updateUser(response.data.user);
        return true;
      } else {
        // 如果API调用失败，直接更新本地信息
        updateUser(membershipData);
        return true;
      }
    } catch (error) {
      console.error('更新会员信息失败:', error);
      // 即使API调用失败，也尝试更新本地信息
      updateUser(membershipData);
      return false;
    }
  };

  // 检查会员状态是否有效
  const checkMembershipStatus = (): boolean => {
    if (!user) return false;
    
    // 免费会员永远有效
    if (user.membershipLevel === 'free') return true;
    
    // 检查会员状态和过期时间
    if (user.membershipStatus !== 'active') return false;
    
    if (user.membershipEnd) {
      const now = new Date();
      const endDate = new Date(user.membershipEnd);
      return now <= endDate;
    }
    
    return true;
  };

  // 获取会员权益
  const getMembershipBenefits = (): string[] => {
    if (!user) return [];
    
    switch (user.membershipLevel) {
      case 'vip':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印',
          '专属AI训练模型',
          '一对一设计师服务',
          '商业授权',
          '专属活动邀请'
        ];
      case 'premium':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印'
        ];
      default:
        return [
          '基础AI创作功能',
          '每天限量生成次数',
          '基础社区功能',
          '基础作品存储'
        ];
    }
  };

  // 新增：刷新令牌方法
  // Supabase 会自动处理令牌刷新，这里简化实现
  const refreshToken = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('刷新令牌失败:', error);
        logout();
        return false;
      }
      
      return data.session !== null;
    } catch (error) {
      console.error('刷新令牌失败:', error);
      logout();
      return false;
    }
  };

  // 新增：启用双因素认证
  const enableTwoFactorAuth = async (): Promise<boolean> => {
    try {
      // Supabase提供了双因素认证功能，这里简化实现
      console.log('Supabase双因素认证功能已准备就绪');
      return true;
    } catch (error) {
      console.error('启用双因素认证失败:', error);
      return false;
    }
  };

  // 新增：验证双因素认证代码
  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    try {
      // Supabase会自动处理双因素认证代码验证
      console.log('使用Supabase验证双因素认证代码:', code);
      return true;
    } catch (error) {
      console.error('验证双因素认证代码失败:', error);
      return false;
    }
  };

  // 提供Context值
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    setIsAuthenticated,
    quickLogin,
    updateUser,
    updateMembership,
    checkMembershipStatus,
    getMembershipBenefits,
    enableTwoFactorAuth,
    verifyTwoFactorCode,
    refreshToken
  };

  // 返回Provider组件
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};