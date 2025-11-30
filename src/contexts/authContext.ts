import React from "react";
import { createContext, useState, ReactNode } from "react";

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
}

// AuthContext 类型定义
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  quickLogin: (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo') => Promise<boolean>;
  // 中文注释：更新用户信息（例如更换头像），会自动持久化
  updateUser: (partial: Partial<User>) => void;
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
});

// 模拟用户数据
const mockUsers: Array<User & { password: string }> = [
  {
    id: "1",
    username: "管理员",
    email: "admin@example.com",
    password: "Admin123",
    avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Admin%20avatar",
    isAdmin: true
  },
  {
    id: "2",
    username: "设计师小明",
    email: "user@example.com",
    password: "User123",
    avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoming"
  }
];

// AuthProvider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 从本地存储获取用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // 从本地存储获取用户信息
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  // 登录方法
  const login = async (email: string, password: string): Promise<boolean> => {
    // 模拟API请求延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        // 查找匹配的用户
        const foundUser = mockUsers.find(
          (user) => user.email === email && user.password === password
        );
        
        if (foundUser) {
          // 移除密码字段
          const { password, ...userWithoutPassword } = foundUser;
          
          // 更新状态
          setIsAuthenticated(true);
          setUser(userWithoutPassword);
          
          // 存储到本地存储
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify(userWithoutPassword));
          
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  };

  // 注册方法
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    // 模拟API请求延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        // 检查邮箱是否已存在
        const emailExists = mockUsers.some((user) => user.email === email);
        
        if (emailExists) {
          resolve(false);
        } else {
          // 创建新用户
          const newUser: User = {
            id: `user-${Date.now()}`,
            username,
            email,
            avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=New%20user%20avatar"
          };
          
          // 添加到模拟用户数组
          mockUsers.push({ ...newUser, password });
          
          resolve(true);
        }
      }, 800);
    });
  };

  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo'): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseUser: User = {
          id: `quick-${provider}-${Date.now()}`,
          username: provider === 'wechat' ? '微信用户' : provider === 'phone' ? '手机号用户' : '第三方用户',
          email: `${provider}-${Date.now()}@example.com`,
          avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar",
          tags: ['国潮爱好者'],
        };
        setIsAuthenticated(true);
        setUser(baseUser);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(baseUser));
        resolve(true);
      }, 500);
    });
  };

  // 登出方法
  const logout = () => {
    // 重置状态
    setIsAuthenticated(false);
    setUser(null);
    
    // 清除本地存储
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // 中文注释：更新用户信息并写入本地存储
  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      const next = { ...(prev || {} as User), ...partial } as User;
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {}
      return next;
    });
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
    updateUser
  };

  // 返回Provider组件
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};
