// 文化元素解谜游戏服务，用于管理游戏关卡和谜题

// 谜题类型定义
export interface Puzzle {
  id: string;
  title: string;
  description: string;
  culturalElement: string;
  question: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
}

// 关卡类型定义
export interface Level {
  id: string;
  name: string;
  description: string;
  puzzles: Puzzle[];
  unlockCondition?: { type: 'score' | 'level'; value: number };
  reward: string;
  culturalTheme: string;
  imageUrl?: string;
}

// 游戏进度类型定义
export interface GameProgress {
  userId: string;
  currentLevel: string;
  completedLevels: string[];
  totalScore: number;
  levelScores: Record<string, number>;
  unlockedHints: number;
  lastPlayed: Date;
}

// 文化元素解谜游戏服务类
class CulturalPuzzleService {
  private puzzles: Puzzle[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextPuzzleId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initPuzzles();
    this.initLevels();
  }

  // 初始化谜题
  private initPuzzles(): void {
    this.puzzles = [
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '杨柳青年画',
        description: '识别这幅杨柳青年画的主题',
        culturalElement: '杨柳青年画',
        question: '以下哪项是杨柳青年画的主要特点？',
        options: [
          '以水墨画为主',
          '色彩鲜艳，构图饱满',
          '抽象艺术风格',
          '以西方绘画技法为主'
        ],
        correctAnswer: 1,
        hint: '杨柳青年画是中国传统民间木版年画之一',
        explanation: '杨柳青年画以色彩鲜艳、构图饱满、题材丰富、寓意吉祥为主要特点，是中国传统民间木版年画的代表之一。',
        difficulty: 'easy',
        tags: ['天津', '杨柳青', '年画', '传统艺术'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yangliuqing%20New%20Year%20Painting%20traditional%20Chinese%20art'
      },
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '泥人张彩塑',
        description: '识别泥人张彩塑的制作材料',
        culturalElement: '泥人张彩塑',
        question: '泥人张彩塑主要使用什么材料制作？',
        options: [
          '陶瓷',
          '黏土',
          '木材',
          '金属'
        ],
        correctAnswer: 1,
        hint: '泥人张彩塑是天津著名的民间艺术',
        explanation: '泥人张彩塑主要使用黏土制作，经过塑造、晾干、烧制、彩绘等多道工序完成，具有造型生动、色彩丰富的特点。',
        difficulty: 'easy',
        tags: ['天津', '泥人张', '彩塑', '传统艺术'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Nirenzhang%20clay%20sculpture%20traditional%20Chinese%20art'
      },
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '京剧脸谱',
        description: '识别京剧脸谱的颜色含义',
        culturalElement: '京剧脸谱',
        question: '京剧中红色脸谱通常代表什么性格？',
        options: [
          '忠勇正义',
          '阴险狡诈',
          '刚正不阿',
          '勇猛暴躁'
        ],
        correctAnswer: 0,
        hint: '关羽的脸谱是红色的',
        explanation: '在京剧中，红色脸谱通常代表忠勇正义的人物形象，如关羽、赵匡胤等。',
        difficulty: 'medium',
        tags: ['京剧', '脸谱', '传统戏曲', '文化符号'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Beijing%20Opera%20face%20paint%20red%20color%20traditional%20Chinese%20art'
      },
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '中国传统色彩',
        description: '识别中国传统色彩名称',
        culturalElement: '传统色彩',
        question: '以下哪项是中国传统色彩名称？',
        options: [
          '珊瑚红',
          '天青色',
          '柠檬黄',
          '宝石蓝'
        ],
        correctAnswer: 1,
        hint: '天青色等烟雨，而我在等你',
        explanation: '天青色是中国传统色彩之一，源自宋代汝窑青瓷的釉色，代表着清新、典雅的审美意境。',
        difficulty: 'medium',
        tags: ['传统色彩', '中国文化', '美学'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20color%20sky%20blue%20aesthetic'
      },
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '传统纹样',
        description: '识别传统纹样的名称',
        culturalElement: '传统纹样',
        question: '以下哪项是中国传统云纹的特点？',
        options: [
          '几何图形组成',
          '流畅的曲线构成',
          '直线和折线构成',
          '点状图案组成'
        ],
        correctAnswer: 1,
        hint: '云纹常出现在中国传统建筑和服饰中',
        explanation: '中国传统云纹以流畅的曲线为主要特征，象征着吉祥如意、高升和祥瑞，常用于传统建筑、服饰、陶瓷等领域。',
        difficulty: 'medium',
        tags: ['传统纹样', '云纹', '中国文化', '装饰艺术'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20cloud%20pattern%20decorative%20art'
      },
      {
        id: `puzzle-${this.nextPuzzleId++}`,
        title: '书法艺术',
        description: '识别书法字体类型',
        culturalElement: '书法',
        question: '以下哪项是楷书的特点？',
        options: [
          '笔画流畅，连绵不断',
          '结构严谨，笔画规整',
          '自由奔放，变化多端',
          '笔画简约，形态古朴'
        ],
        correctAnswer: 1,
        hint: '唐代书法家颜真卿以楷书著称',
        explanation: '楷书是中国书法的主要字体之一，以结构严谨、笔画规整、端庄秀丽为主要特点，适合正式场合使用。',
        difficulty: 'hard',
        tags: ['书法', '楷书', '传统艺术', '文化遗产'],
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20calligraphy%20regular%20script%20art'
      }
    ];
  }

  // 初始化关卡
  private initLevels(): void {
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化之旅',
        description: '探索天津的传统文化元素',
        puzzles: [this.puzzles[0], this.puzzles[1]],
        reward: '解锁杨柳青年画素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20heritage%20tourism'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统艺术',
        description: '了解中国传统艺术形式',
        puzzles: [this.puzzles[2], this.puzzles[3]],
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁传统色彩配色方案',
        culturalTheme: '传统艺术',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20art%20collection'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化符号解密',
        description: '解密中国传统符号的含义',
        puzzles: [this.puzzles[4], this.puzzles[5]],
        unlockCondition: { type: 'level', value: 2 },
        reward: '解锁传统纹样素材包',
        culturalTheme: '文化符号',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20symbols%20mystery'
      }
    ];
  }

  // 获取所有关卡
  getLevels(): Level[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): Level | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取所有谜题
  getPuzzles(): Puzzle[] {
    return [...this.puzzles];
  }

  // 根据ID获取谜题
  getPuzzleById(puzzleId: string): Puzzle | undefined {
    return this.puzzles.find(puzzle => puzzle.id === puzzleId);
  }

  // 根据关卡ID获取谜题
  getPuzzlesByLevelId(levelId: string): Puzzle[] {
    const level = this.getLevelById(levelId);
    return level?.puzzles || [];
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): GameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: GameProgress = {
        userId,
        currentLevel: 'level-1',
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        unlockedHints: 3,
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
    }
    return this.gameProgress.get(userId)!;
  }

  // 更新用户游戏进度
  updateGameProgress(userId: string, progress: Partial<GameProgress>): GameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 检查答案是否正确
  checkAnswer(puzzleId: string, answer: number): { isCorrect: boolean; explanation: string } {
    const puzzle = this.getPuzzleById(puzzleId);
    if (!puzzle) {
      return { isCorrect: false, explanation: '谜题不存在' };
    }
    return {
      isCorrect: puzzle.correctAnswer === answer,
      explanation: puzzle.explanation
    };
  }

  // 计算关卡得分
  calculateLevelScore(correctAnswers: number, totalPuzzles: number, timeTaken?: number): number {
    const baseScore = (correctAnswers / totalPuzzles) * 100;
    // 时间奖励（如果提供了时间）
    const timeBonus = timeTaken ? Math.max(0, 20 - (timeTaken / 60)) : 0;
    return Math.round(baseScore + timeBonus);
  }

  // 完成关卡
  completeLevel(userId: string, levelId: string, score: number): GameProgress {
    const progress = this.getGameProgress(userId);
    const updatedProgress: GameProgress = {
      ...progress,
      completedLevels: [...progress.completedLevels, levelId],
      totalScore: progress.totalScore + score,
      levelScores: {
        ...progress.levelScores,
        [levelId]: score
      },
      lastPlayed: new Date()
    };
    
    // 解锁下一关
    const currentLevelIndex = this.levels.findIndex(level => level.id === levelId);
    if (currentLevelIndex < this.levels.length - 1) {
      const nextLevel = this.levels[currentLevelIndex + 1];
      updatedProgress.currentLevel = nextLevel.id;
    }
    
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 使用提示
  useHint(userId: string): boolean {
    const progress = this.getGameProgress(userId);
    if (progress.unlockedHints > 0) {
      this.updateGameProgress(userId, {
        unlockedHints: progress.unlockedHints - 1
      });
      return true;
    }
    return false;
  }

  // 解锁新提示
  unlockHint(userId: string): void {
    const progress = this.getGameProgress(userId);
    this.updateGameProgress(userId, {
      unlockedHints: progress.unlockedHints + 1
    });
  }

  // 根据难度获取谜题
  getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
    return this.puzzles.filter(puzzle => puzzle.difficulty === difficulty);
  }

  // 根据标签获取谜题
  getPuzzlesByTag(tag: string): Puzzle[] {
    return this.puzzles.filter(puzzle => puzzle.tags.includes(tag));
  }

  // 搜索谜题
  searchPuzzles(query: string): Puzzle[] {
    const lowerQuery = query.toLowerCase();
    return this.puzzles.filter(puzzle => 
      puzzle.title.toLowerCase().includes(lowerQuery) ||
      puzzle.description.toLowerCase().includes(lowerQuery) ||
      puzzle.culturalElement.toLowerCase().includes(lowerQuery) ||
      puzzle.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// 创建单例实例
const culturalPuzzleService = new CulturalPuzzleService();

export default culturalPuzzleService;