/**
 * 离线创作服务
 * 提供离线数据的存储、同步和管理功能
 */

// 离线数据类型定义
export interface OfflineData {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

// 离线配置类型定义
export interface OfflineConfig {
  autoSync: boolean;
  syncInterval: number;
  maxOfflineData: number;
  retryDelay: number;
}

// 离线状态类型定义
export interface OfflineStatus {
  isOnline: boolean;
  pendingSync: number;
  lastSync: number;
  syncing: boolean;
}

// 离线服务类
class OfflineService {
  private offlineData: OfflineData[] = [];
  private config: OfflineConfig = {
    autoSync: true,
    syncInterval: 30000, // 30秒
    maxOfflineData: 100,
    retryDelay: 5000 // 5秒
  };
  private status: OfflineStatus = {
    isOnline: navigator.onLine,
    pendingSync: 0,
    lastSync: 0,
    syncing: false
  };
  private syncTimeout: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'OFFLINE_DATA';
  private readonly CONFIG_KEY = 'OFFLINE_CONFIG';
  private readonly STATUS_KEY = 'OFFLINE_STATUS';
  private listeners: Array<(status: OfflineStatus) => void> = [];

  constructor() {
    this.loadData();
    this.loadConfig();
    this.loadStatus();
    this.setupEventListeners();
    this.startAutoSync();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.saveStatus();
      this.notifyListeners();
      if (this.config.autoSync) {
        this.syncData();
      }
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.saveStatus();
      this.notifyListeners();
    });
  }

  /**
   * 从本地存储加载离线数据
   */
  private loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.offlineData = JSON.parse(stored);
        this.status.pendingSync = this.offlineData.filter(d => d.status === 'pending' || d.status === 'failed').length;
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
      this.offlineData = [];
    }
  }

  /**
   * 保存离线数据到本地存储
   */
  private saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData));
      this.status.pendingSync = this.offlineData.filter(d => d.status === 'pending' || d.status === 'failed').length;
      this.saveStatus();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  /**
   * 从本地存储加载配置
   */
  private loadConfig() {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load offline config:', error);
    }
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig() {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save offline config:', error);
    }
  }

  /**
   * 从本地存储加载状态
   */
  private loadStatus() {
    try {
      const stored = localStorage.getItem(this.STATUS_KEY);
      if (stored) {
        this.status = { ...this.status, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load offline status:', error);
    }
  }

  /**
   * 保存状态到本地存储
   */
  private saveStatus() {
    try {
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(this.status));
    } catch (error) {
      console.error('Failed to save offline status:', error);
    }
  }

  /**
   * 开始自动同步
   */
  private startAutoSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    if (this.config.autoSync) {
      this.syncTimeout = setTimeout(() => {
        this.syncData();
        this.startAutoSync();
      }, this.config.syncInterval);
    }
  }

  /**
   * 注册状态监听器
   */
  addStatusListener(listener: (status: OfflineStatus) => void) {
    this.listeners.push(listener);
    // 立即通知初始状态
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * 获取当前离线状态
   */
  getStatus(): OfflineStatus {
    return { ...this.status };
  }

  /**
   * 获取离线配置
   */
  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  /**
   * 更新离线配置
   */
  updateConfig(config: Partial<OfflineConfig>) {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.startAutoSync();
  }

  /**
   * 保存离线数据
   */
  saveOfflineData(type: OfflineData['type'], data: any): OfflineData {
    const offlineItem: OfflineData = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending'
    };

    // 限制离线数据数量
    if (this.offlineData.length >= this.config.maxOfflineData) {
      // 删除最旧的已同步数据
      const syncedData = this.offlineData.filter(d => d.status === 'synced');
      if (syncedData.length > 0) {
        const oldestSynced = syncedData.reduce((oldest, current) => {
          return current.syncedAt! < oldest.syncedAt! ? current : oldest;
        });
        this.offlineData = this.offlineData.filter(d => d.id !== oldestSynced.id);
      } else {
        // 如果没有已同步数据，删除最旧的数据
        this.offlineData.shift();
      }
    }

    this.offlineData.push(offlineItem);
    this.saveData();
    return offlineItem;
  }

  /**
   * 获取所有离线数据
   */
  getAllOfflineData(): OfflineData[] {
    return [...this.offlineData];
  }

  /**
   * 获取待同步的离线数据
   */
  getPendingSyncData(): OfflineData[] {
    return this.offlineData.filter(d => d.status === 'pending' || d.status === 'failed');
  }

  /**
   * 同步离线数据
   */
  async syncData(): Promise<boolean> {
    if (!navigator.onLine || this.status.syncing) {
      return false;
    }

    this.status.syncing = true;
    this.saveStatus();
    this.notifyListeners();

    const pendingData = this.getPendingSyncData();
    if (pendingData.length === 0) {
      this.status.syncing = false;
      this.saveStatus();
      this.notifyListeners();
      return true;
    }

    try {
      // 这里应该实现与服务器的同步逻辑
      // 由于是模拟环境，我们直接将数据标记为已同步
      for (const data of pendingData) {
        // 模拟同步延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        data.status = 'synced';
        data.syncedAt = Date.now();
        data.updatedAt = Date.now();
      }

      this.status.lastSync = Date.now();
      this.status.pendingSync = 0;
      this.saveData();
      this.saveStatus();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      // 将失败的数据标记为failed
      pendingData.forEach(data => {
        data.status = 'failed';
        data.error = error instanceof Error ? error.message : 'Sync failed';
        data.updatedAt = Date.now();
      });
      this.saveData();
      return false;
    } finally {
      this.status.syncing = false;
      this.saveStatus();
      this.notifyListeners();
    }
  }

  /**
   * 删除已同步的离线数据
   */
  clearSyncedData(): void {
    this.offlineData = this.offlineData.filter(d => d.status !== 'synced');
    this.saveData();
  }

  /**
   * 删除特定的离线数据
   */
  deleteOfflineData(id: string): boolean {
    const initialLength = this.offlineData.length;
    this.offlineData = this.offlineData.filter(d => d.id !== id);
    const deleted = this.offlineData.length < initialLength;
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  /**
   * 重试同步失败的数据
   */
  retryFailedData(): void {
    this.offlineData.forEach(data => {
      if (data.status === 'failed') {
        data.status = 'pending';
        data.error = undefined;
        data.updatedAt = Date.now();
      }
    });
    this.saveData();
    if (navigator.onLine) {
      this.syncData();
    }
  }

  /**
   * 检查是否支持离线功能
   */
  isOfflineSupported(): boolean {
    return 'serviceWorker' in navigator && 'SyncManager' in window && 'indexedDB' in window;
  }
}

// 导出单例实例
const service = new OfflineService();
export default service;
