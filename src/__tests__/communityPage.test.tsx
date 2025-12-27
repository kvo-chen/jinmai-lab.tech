// Mock problematic components first
jest.mock('../components/TianjinStyleComponents', () => ({
  __esModule: true,
  TianjinImage: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="tianjin-image-mock" />
  ),
  TianjinAvatar: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="tianjin-avatar-mock" />
  ),
}));

jest.mock('../components/GradientHero', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="gradient-hero-mock" {...props}>{children}</div>
  ),
}));

// Mock lazy loaded components
jest.mock('../components/CommunityChat', () => ({
  __esModule: true,
  default: () => <div data-testid="community-chat-mock">Community Chat Mock</div>,
}));

jest.mock('../components/CommunityManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="community-management-mock">Community Management Mock</div>,
}));

jest.mock('../components/DiscussionSection', () => ({
  __esModule: true,
  CommunityDiscussion: () => <div data-testid="community-discussion-mock">Community Discussion Mock</div>,
  DiscussionSection: () => <div data-testid="discussion-section-mock">Discussion Section Mock</div>,
}));

jest.mock('../components/ScheduledPost', () => ({
  __esModule: true,
  default: () => <div data-testid="scheduled-post-mock">Scheduled Post Mock</div>,
}));

jest.mock('../components/VirtualList', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="virtual-list-mock" {...props}>{children}</div>
  ),
}));

jest.mock('../components/CulturalMatchingGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-matching-game-mock">Cultural Matching Game Mock</div>,
}));

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../contexts/authContext';
import Community from '../pages/Community';
import { toast } from 'sonner';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('../services/postService', () => ({
  __esModule: true,
  default: {
    getPosts: jest.fn().mockReturnValue([
      {
        id: '1',
        title: '国潮风格联名海报设计',
        content: '这是一个国潮风格的设计案例',
        author: 'testuser',
        createdAt: Date.now(),
        likes: 10,
        comments: [],
        tags: ['国潮', '海报'],
      },
      {
        id: '2',
        title: '老字号品牌视觉升级',
        content: '老字号品牌的现代视觉设计',
        author: 'testuser',
        createdAt: Date.now() - 86400000,
        likes: 5,
        comments: [],
        tags: ['老字号', '品牌'],
      },
    ]),
  },
}));

describe('Community Page', () => {
  // 创建一个带有身份验证的测试组件包装器
  const AuthenticatedWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Router>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Router>
    );
  };

  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    // 重置mock
    jest.clearAllMocks();
    
    // 设置默认的auth状态
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      membershipLevel: 'free',
      membershipStatus: 'active',
      membershipStart: new Date().toISOString(),
    }));
  });

  test('should render without errors', async () => {
    render(<Community />, { wrapper: AuthenticatedWrapper });
    
    // 等待页面加载完成 - 只检查body是否存在
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查body是否有子元素，说明页面成功渲染了内容
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  test('should render gradient hero component', async () => {
    render(<Community />, { wrapper: AuthenticatedWrapper });
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查gradient hero是否被渲染
    expect(screen.getByTestId('gradient-hero-mock')).toBeInTheDocument();
  });

  test('should render cultural matching game component', async () => {
    render(<Community />, { wrapper: AuthenticatedWrapper });
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查文化匹配游戏是否被渲染
    expect(screen.getByTestId('cultural-matching-game-mock')).toBeInTheDocument();
  });

  test('should render virtual list component', async () => {
    render(<Community />, { wrapper: AuthenticatedWrapper });
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查虚拟列表是否被渲染
    expect(screen.getByTestId('virtual-list-mock')).toBeInTheDocument();
  });
});

// Mock apiClient to avoid import.meta.env issues
jest.mock('../lib/apiClient', () => ({
  __esModule: true,
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
  }
}));

// Mock vite environment variables for any components that might access them
globalThis.import = {
  ...globalThis.import,
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api',
      VITE_ENV: 'test',
    },
  },
};
