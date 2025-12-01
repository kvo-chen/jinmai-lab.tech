/**
 * 创作者任务系统服务
 * 提供任务的创建、读取、更新、删除等功能
 */

// 任务类型定义
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement';
  status: 'active' | 'completed' | 'expired' | 'draft';
  reward: {
    points: number;
    badge?: string;
    description?: string;
  };
  requirements: {
    type: 'create' | 'share' | 'like' | 'comment' | 'follow';
    count: number;
  };
  progress: number;
  startDate: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  isOfficial: boolean;
  tags?: string[];
  thumbnail?: string;
}

// 任务进度类型定义
export interface TaskProgress {
  taskId: string;
  userId: string;
  progress: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// 任务服务类
class TaskService {
  private tasks: Task[] = [];
  private taskProgress: TaskProgress[] = [];
  private readonly TASKS_KEY = 'CREATIVE_TASKS';
  private readonly PROGRESS_KEY = 'TASK_PROGRESS';

  constructor() {
    this.loadTasks();
    this.loadProgress();
    this.initOfficialTasks();
  }

  /**
   * 初始化官方任务
   */
  private initOfficialTasks() {
    const officialTasks: Task[] = [
      {
        id: 'official-daily-1',
        title: '每日创作',
        description: '每天完成一次创作，获得创作积分',
        type: 'daily',
        status: 'active',
        reward: {
          points: 10,
          description: '每日创作奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务', '创作'],
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Daily%20creative%20task%2C%20inspiring%20design%2C%20colorful%2C%20high%20detail'
      },
      {
        id: 'official-weekly-1',
        title: '每周分享',
        description: '每周分享3次作品，获得分享积分',
        type: 'weekly',
        status: 'active',
        reward: {
          points: 30,
          description: '每周分享奖励'
        },
        requirements: {
          type: 'share',
          count: 3
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每周任务', '分享'],
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Weekly%20sharing%20task%2C%20social%20media%20sharing%2C%20modern%20design%2C%20high%20detail'
      },
      {
        id: 'official-monthly-1',
        title: '月度创作挑战',
        description: '每月完成10次创作，获得月度创作奖励',
        type: 'monthly',
        status: 'active',
        reward: {
          points: 100,
          badge: '月度创作达人',
          description: '月度创作挑战奖励'
        },
        requirements: {
          type: 'create',
          count: 10
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['月度任务', '创作挑战'],
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Monthly%20creative%20challenge%2C%20trophy%20and%20awards%2C%20premium%20design%2C%20high%20detail'
      },
      {
        id: 'official-event-1',
        title: '天津文化创作大赛',
        description: '参与天津文化创作大赛，获得丰厚奖励',
        type: 'event',
        status: 'active',
        reward: {
          points: 500,
          badge: '天津文化创作大师',
          description: '天津文化创作大赛奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['活动任务', '天津文化'],
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20cultural%20creative%20competition%2C%20traditional%20Chinese%20elements%2C%20modern%20design%2C%20high%20detail'
      },
      {
        id: 'official-achievement-1',
        title: '创作新手',
        description: '完成首次创作，获得创作新手称号',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 50,
          badge: '创作新手',
          description: '首次创作奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['成就任务', '新手'],
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Creative%20beginner%20achievement%2C%20colorful%20badge%2C%20modern%20design%2C%20high%20detail'
      }
    ];

    // 检查并添加官方任务（如果不存在）
    officialTasks.forEach(officialTask => {
      const exists = this.tasks.some(t => t.id === officialTask.id);
      if (!exists) {
        this.tasks.push(officialTask);
      }
    });

    this.saveTasks();
  }

  /**
   * 从本地存储加载任务
   */
  private loadTasks() {
    try {
      const stored = localStorage.getItem(this.TASKS_KEY);
      if (stored) {
        this.tasks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.tasks = [];
    }
  }

  /**
   * 从本地存储加载任务进度
   */
  private loadProgress() {
    try {
      const stored = localStorage.getItem(this.PROGRESS_KEY);
      if (stored) {
        this.taskProgress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load task progress:', error);
      this.taskProgress = [];
    }
  }

  /**
   * 保存任务到本地存储
   */
  private saveTasks() {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  /**
   * 保存任务进度到本地存储
   */
  private saveProgress() {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.taskProgress));
    } catch (error) {
      console.error('Failed to save task progress:', error);
    }
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * 根据ID获取任务
   */
  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  /**
   * 根据类型获取任务
   */
  getTasksByType(type: Task['type']): Task[] {
    return this.tasks.filter(t => t.type === type);
  }

  /**
   * 根据状态获取任务
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return this.tasks.filter(t => t.status === status);
  }

  /**
   * 获取用户任务进度
   */
  getTaskProgress(taskId: string, userId: string): TaskProgress | undefined {
    return this.taskProgress.find(p => p.taskId === taskId && p.userId === userId);
  }

  /**
   * 获取用户所有任务进度
   */
  getUserTaskProgress(userId: string): TaskProgress[] {
    return this.taskProgress.filter(p => p.userId === userId);
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId: string, userId: string, progress: number): TaskProgress {
    let progressItem = this.taskProgress.find(p => p.taskId === taskId && p.userId === userId);
    const task = this.getTaskById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // 计算实际进度，不超过任务要求
    const actualProgress = Math.min(progress, task.requirements.count);
    const isCompleted = actualProgress >= task.requirements.count;
    const wasCompleted = progressItem?.completedAt !== undefined;

    if (progressItem) {
      // 更新现有进度
      progressItem.progress = actualProgress;
      progressItem.updatedAt = Date.now();
      if (isCompleted && !progressItem.completedAt) {
        progressItem.completedAt = Date.now();
        // 更新任务状态
        this.updateTask(taskId, { status: 'completed' });
        // 触发任务完成事件（可以在这里添加积分奖励和成就更新逻辑）
        this.onTaskCompleted(task, userId);
      }
    } else {
      // 创建新进度
      progressItem = {
        taskId,
        userId,
        progress: actualProgress,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (isCompleted) {
        progressItem.completedAt = Date.now();
        // 更新任务状态
        this.updateTask(taskId, { status: 'completed' });
        // 触发任务完成事件（可以在这里添加积分奖励和成就更新逻辑）
        this.onTaskCompleted(task, userId);
      }
      this.taskProgress.push(progressItem);
    }

    this.saveProgress();
    return progressItem;
  }

  /**
   * 任务完成时的处理逻辑
   */
  private onTaskCompleted(task: Task, userId: string): void {
    // 这里可以添加任务完成后的逻辑，例如：
    // 1. 给用户添加积分
    // 2. 更新用户成就进度
    // 3. 发送通知
    // 4. 其他自定义逻辑
    
    console.log(`Task completed: ${task.title} by user ${userId}`);
    console.log(`Reward: ${task.reward.points} points`);
    
    // 这里可以通过事件或直接调用其他服务来实现积分和成就的更新
    // 例如：achievementService.addPoints(userId, task.reward.points);
  }

  /**
   * 创建任务
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  /**
   * 更新任务
   */
  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      return undefined;
    }

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveTasks();
    return this.tasks[index];
  }

  /**
   * 删除任务
   */
  deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id || t.isOfficial);
    const deleted = this.tasks.length < initialLength;
    
    if (deleted) {
      this.saveTasks();
      // 删除相关进度
      this.taskProgress = this.taskProgress.filter(p => p.taskId !== id);
      this.saveProgress();
    }
    
    return deleted;
  }

  /**
   * 搜索任务
   */
  searchTasks(query: string): Task[] {
    const lowerQuery = query.toLowerCase();
    return this.tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 获取用户完成的任务
   */
  getUserCompletedTasks(userId: string): Task[] {
    const completedProgress = this.taskProgress.filter(p => p.userId === userId && p.completedAt);
    return completedProgress
      .map(p => this.getTaskById(p.taskId))
      .filter((t): t is Task => t !== undefined);
  }

  /**
   * 获取用户活跃任务
   */
  getUserActiveTasks(userId: string): Task[] {
    const activeTasks = this.getTasksByStatus('active');
    return activeTasks.filter(task => {
      const progress = this.getTaskProgress(task.id, userId);
      return !progress?.completedAt;
    });
  }

  /**
   * 重置每日任务
   */
  resetDailyTasks(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    this.tasks.forEach(task => {
      if (task.type === 'daily' && task.status === 'completed') {
        const endDate = task.endDate || 0;
        if (now > endDate + oneDay) {
          // 重置任务状态和进度
          this.updateTask(task.id, {
            status: 'active',
            progress: 0,
            startDate: now,
            endDate: now + oneDay
          });
          // 重置所有用户的任务进度
          this.taskProgress = this.taskProgress.filter(p => p.taskId !== task.id);
        }
      }
    });
    
    this.saveTasks();
    this.saveProgress();
  }
}

// 导出单例实例
const service = new TaskService();
export default service;
