import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import CulturalKnowledge from '../pages/CulturalKnowledge';
import '@testing-library/jest-dom';

// Mock problematic components first
jest.mock('../components/LazyImage', () => ({
  __esModule: true,
  default: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="lazy-image-mock" />
  ),
}));

jest.mock('../components/TianjinStyleComponents', () => ({
  __esModule: true,
  TianjinImage: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="tianjin-image-mock" />
  ),
  TianjinAvatar: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="tianjin-avatar-mock" />
  ),
}));

// Mock external dependencies
jest.mock('../components/GradientHero', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="gradient-hero-mock" {...props}>{children}</div>
  ),
}));

jest.mock('../components/CulturalKnowledgeBase', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-knowledge-base-mock">Cultural Knowledge Base Mock</div>,
}));

jest.mock('../components/CulturalNews', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-news-mock">Cultural News Mock</div>,
}));

jest.mock('../components/CulturalMemoryGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-memory-game-mock">Cultural Memory Game Mock</div>,
}));

jest.mock('../components/CulturalQuizGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-quiz-game-mock">Cultural Quiz Game Mock</div>,
}));

jest.mock('../components/CulturalPuzzleGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-puzzle-game-mock">Cultural Puzzle Game Mock</div>,
}));

jest.mock('../components/CulturalMatchingGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-matching-game-mock">Cultural Matching Game Mock</div>,
}));

jest.mock('../components/CulturalPairMatchingGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-pair-matching-game-mock">Cultural Pair Matching Game Mock</div>,
}));

jest.mock('../components/CulturalSortingGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-sorting-game-mock">Cultural Sorting Game Mock</div>,
}));

jest.mock('../components/CulturalSpotTheDifferenceGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-spot-the-difference-game-mock">Cultural Spot The Difference Game Mock</div>,
}));

jest.mock('../components/CulturalTimelineGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-timeline-game-mock">Cultural Timeline Game Mock</div>,
}));

jest.mock('../components/CulturalRiddleGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-riddle-game-mock">Cultural Riddle Game Mock</div>,
}));

jest.mock('../components/CulturalWordChainGame', () => ({
  __esModule: true,
  default: () => <div data-testid="cultural-word-chain-game-mock">Cultural Word Chain Game Mock</div>,
}));

// Mock services
jest.mock('../services/knowledgeBaseService', () => ({
  __esModule: true,
  default: {
    getArticles: jest.fn().mockResolvedValue({ articles: [], total: 0 }),
    getArticleById: jest.fn().mockResolvedValue({}),
    searchArticles: jest.fn().mockResolvedValue({ articles: [], total: 0 }),
  }
}));

jest.mock('../services/culturalMemoryGameService', () => ({
  __esModule: true,
  default: {
    getGameData: jest.fn().mockResolvedValue({}),
    saveGameScore: jest.fn().mockResolvedValue({}),
  }
}));

jest.mock('../services/culturalQuizGameService', () => ({
  __esModule: true,
  default: {
    getQuestions: jest.fn().mockResolvedValue([]),
    submitAnswers: jest.fn().mockResolvedValue({}),
  }
}));

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

// Mock vite environment variables
globalThis.import = {
  ...globalThis.import,
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api',
      VITE_ENV: 'test',
    },
  },
};

describe('Cultural Knowledge Page', () => {
  test('should render without errors', async () => {
    render(
      <Router>
        <CulturalKnowledge />
      </Router>
    );
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 简单检查页面是否包含基本结构
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  test('should render gradient hero component', async () => {
    render(
      <Router>
        <CulturalKnowledge />
      </Router>
    );
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查gradient hero是否被渲染
    expect(screen.getByTestId('gradient-hero-mock')).toBeInTheDocument();
  });

  test('should have expected page structure', async () => {
    render(
      <Router>
        <CulturalKnowledge />
      </Router>
    );
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查页面基本结构
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    
    // 检查是否有内容区域
    expect(mainElement?.querySelector('.grid')).toBeInTheDocument();
    
    // 检查是否有导航按钮
    expect(mainElement?.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  test('should render with correct title', async () => {
    render(
      <Router>
        <CulturalKnowledge />
      </Router>
    );
    
    // 等待页面加载完成
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
    
    // 检查gradient hero是否显示正确的标题
    const gradientHero = screen.getByTestId('gradient-hero-mock');
    expect(gradientHero).toHaveAttribute('title', '文化知识库');
  });
});
