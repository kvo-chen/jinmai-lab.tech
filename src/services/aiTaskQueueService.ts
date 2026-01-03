/**
 * AI任务队列服务
 * 管理AI生成任务的队列，支持优先级、并发控制和错误处理
 */

// 任务状态类型
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 任务优先级类型
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// AI任务类型定义
export interface AITask {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | '3d';
  prompt: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
  onProgress?: (progress: number, data?: any) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

// 任务队列配置类型
export interface TaskQueueConfig {
  maxConcurrentTasks: number;
  defaultPriority: TaskPriority;
  retryAttempts: number;
  retryDelay: number;
}

// 任务执行器回调类型
export type TaskExecutor = (task: AITask) => Promise<any>;

// 默认配置
const DEFAULT_CONFIG: TaskQueueConfig = {
  maxConcurrentTasks: 3,
  defaultPriority: 'medium',
  retryAttempts: 2,
  retryDelay: 1000
};

/**
 * AI任务队列服务类
 */
export class AITaskQueueService {
  private queue: AITask[] = [];
  private runningTasks: Set<string> = new Set();
  private config: TaskQueueConfig;
  private taskIdCounter: number = 0;
  private isProcessing: boolean = false;
  
  // 任务执行器映射
  private taskExecutors: Record<string, TaskExecutor> = {};

  constructor(config?: Partial<TaskQueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 创建任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${this.taskIdCounter++}`;
  }

  /**
   * 添加任务到队列
   */
  addTask(
    type: AITask['type'],
    prompt: string,
    options?: {
      priority?: TaskPriority;
      metadata?: Record<string, any>;
      onProgress?: (progress: number, data?: any) => void;
      onComplete?: (result: any) => void;
      onError?: (error: string) => void;
    }
  ): AITask {
    const task: AITask = {
      id: this.generateTaskId(),
      type,
      prompt,
      priority: options?.priority || this.config.defaultPriority,
      status: 'pending',
      createdAt: Date.now(),
      metadata: options?.metadata,
      onProgress: options?.onProgress,
      onComplete: options?.onComplete,
      onError: options?.onError
    };

    // 添加到队列
    this.queue.push(task);
    
    // 按优先级排序队列
    this.queue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || a.createdAt - b.createdAt;
    });

    // 开始处理队列
    this.processQueue();

    return task;
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    // 如果已经在处理或者没有任务，直接返回
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    // 如果正在运行的任务数量达到最大值，返回
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    this.isProcessing = true;

    try {
      // 获取下一个任务
      const task = this.queue.find(t => t.status === 'pending');
      if (!task) {
        this.isProcessing = false;
        return;
      }

      // 更新任务状态为运行中
      task.status = 'running';
      task.startedAt = Date.now();
      this.runningTasks.add(task.id);

      // 从队列中移除（任务完成后会重新添加如果需要重试）
      this.queue = this.queue.filter(t => t.id !== task.id);

      // 处理任务
      await this.executeTask(task);
    } finally {
      this.isProcessing = false;
      // 继续处理下一个任务
      this.processQueue();
    }
  }

  /**
   * 注册任务执行器
   * @param type 任务类型
   * @param executor 任务执行器函数
   */
  registerTaskExecutor(type: AITask['type'], executor: TaskExecutor): void {
    this.taskExecutors[type] = executor;
  }
  
  /**
   * 执行单个任务
   */
  private async executeTask(task: AITask): Promise<void> {
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts <= this.config.retryAttempts) {
      try {
        // 获取任务执行器
        const executor = this.taskExecutors[task.type];
        if (!executor) {
          throw new Error(`No executor registered for task type: ${task.type}`);
        }
        
        // 执行任务
        const result = await executor(task);
        
        // 任务完成
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = { success: true, data: result };
        
        // 调用完成回调
        if (task.onComplete) {
          task.onComplete(task.result);
        }
        
        // 从运行任务集合中移除
        this.runningTasks.delete(task.id);
        
        return;
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // 如果还有重试次数，等待后重试
        if (attempts <= this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempts - 1); // 指数退避
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重试都失败
    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = lastError;
    
    // 调用错误回调
    if (task.onError) {
      task.onError(lastError || 'Unknown error');
    }
    
    // 从运行任务集合中移除
    this.runningTasks.delete(task.id);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | undefined {
    // 先在队列中查找
    const queuedTask = this.queue.find(t => t.id === taskId);
    if (queuedTask) {
      return queuedTask.status;
    }
    
    // 检查是否在运行中
    if (this.runningTasks.has(taskId)) {
      return 'running';
    }
    
    return undefined;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): AITask[] {
    // 只返回队列中的任务，运行中的任务暂时无法获取详细信息
    return [...this.queue];
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const taskIndex = this.queue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      // 取消队列中的任务
      this.queue[taskIndex].status = 'cancelled';
      this.queue.splice(taskIndex, 1);
      return true;
    }

    // 取消运行中的任务（需要实际实现）
    if (this.runningTasks.has(taskId)) {
      // 实际实现中，需要发送取消信号给正在运行的任务
      this.runningTasks.delete(taskId);
      return true;
    }

    return false;
  }

  /**
   * 获取队列统计信息
   */
  getQueueStats() {
    return {
      totalTasks: this.queue.length + this.runningTasks.size,
      pendingTasks: this.queue.length,
      runningTasks: this.runningTasks.size,
      // 计算不同状态的任务数量
      byStatus: {
        pending: this.queue.filter(t => t.status === 'pending').length,
        running: this.runningTasks.size,
        completed: this.queue.filter(t => t.status === 'completed').length,
        failed: this.queue.filter(t => t.status === 'failed').length,
        cancelled: this.queue.filter(t => t.status === 'cancelled').length
      },
      // 计算不同优先级的任务数量
      byPriority: {
        low: this.queue.filter(t => t.priority === 'low').length,
        medium: this.queue.filter(t => t.priority === 'medium').length,
        high: this.queue.filter(t => t.priority === 'high').length,
        urgent: this.queue.filter(t => t.priority === 'urgent').length
      }
    };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = [];
    // 取消所有运行中的任务
    this.runningTasks.clear();
  }

  /**
   * 设置最大并发任务数
   */
  setMaxConcurrentTasks(max: number): void {
    this.config.maxConcurrentTasks = max;
    // 应用新的并发限制，继续处理队列
    this.processQueue();
  }
}

// 导出单例实例
export const aiTaskQueueService = new AITaskQueueService();
