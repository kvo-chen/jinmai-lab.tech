import { Post, Comment } from './postService';

// 离线数据存储接口
export interface OfflineData {
  posts: Post[];
  drafts: Post[];
  comments: Comment[];
  lastSync: number;
  syncQueue: SyncOperation[];
}

// 同步操作类型
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'post' | 'comment' | 'like';
  data: any;
  timestamp: number;
  attempts: number;
}

// 离线状态管理
export class OfflineService {
  private dbName = 'jinmai-offline-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB is not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('date', 'date', { unique: false });
          postsStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentsStore.createIndex('postId', 'postId', { unique: false });
          commentsStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 检查网络状态
  isOnline(): boolean {
    return navigator.onLine;
  }

  // 添加网络状态监听
  addNetworkListener(callback: (online: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // 保存草稿
  async saveDraft(post: Post): Promise<void> {
    if (!this.db) await this.init();
    
    const draft = {
      ...post,
      lastModified: Date.now(),
      isDraft: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有草稿
  async getDrafts(): Promise<Post[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 删除草稿
  async deleteDraft(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 缓存作品数据
  async cachePosts(posts: Post[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');

      // 清空现有数据
      store.clear();

      // 添加新数据
      posts.forEach(post => {
        store.add(post);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 获取缓存的帖子
  async getCachedPosts(): Promise<Post[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 添加同步操作到队列
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
    if (!this.db) await this.init();

    const syncOp: SyncOperation = {
      ...operation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncOp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取同步队列
  async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 处理同步队列
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline()) return;

    const queue = await this.getSyncQueue();
    
    for (const operation of queue) {
      try {
        // 这里应该调用实际的API
        // 例如：await apiService.syncOperation(operation);
        
        // 同步成功后从队列中删除
        await this.removeFromSyncQueue(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        await this.incrementAttempts(operation.id);
      }
    }
  }

  // 从同步队列中删除操作
  private async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 增加尝试次数
  private async incrementAttempts(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation && operation.attempts < 5) {
          operation.attempts += 1;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // 超过最大尝试次数，删除操作
          store.delete(id);
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 获取存储使用情况
  async getStorageInfo(): Promise<{
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
  }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        total: 0,
        used: 0,
        available: 0,
        usagePercentage: 0
      };
    }

    const estimate = await navigator.storage.estimate();
    
    return {
      total: estimate.quota || 0,
      used: estimate.usage || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0),
      usagePercentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
    };
  }
}

// 导出单例实例
export const offlineService = new OfflineService();