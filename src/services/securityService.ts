/**
 * 安全服务模块 - 提供数据加密、防作弊和安全验证功能
 */

// 数据加密类型
export interface EncryptedData {
  data: string;
  timestamp: number;
  signature: string;
}

// 安全服务类
class SecurityService {
  private readonly ENCRYPTION_KEY = 'j9kL2pQ5rT8wZ1cV4xY7mU3tR6nH9bE2'; // 加密密钥
  private readonly SALT = 'f3s6v9yB2e5h8k0n3q6t9w2z5C8r1V4x7'; // 盐值
  private readonly MAX_CACHE_AGE = 3600000; // 缓存最大年龄（1小时）

  /**
   * 简单的加密算法（用于本地存储数据保护）
   */
  encrypt(data: any): EncryptedData {
    const jsonData = JSON.stringify(data);
    const timestamp = Date.now();
    
    // 简单的XOR加密
    let encrypted = '';
    for (let i = 0; i < jsonData.length; i++) {
      const charCode = jsonData.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // Base64编码
    const base64Data = btoa(encrypted);
    
    // 生成签名
    const signature = this.generateSignature(base64Data, timestamp);
    
    return {
      data: base64Data,
      timestamp,
      signature
    };
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: EncryptedData): any {
    const { data, timestamp, signature } = encryptedData;
    
    // 验证签名
    if (!this.verifySignature(data, timestamp, signature)) {
      throw new Error('数据已被篡改');
    }
    
    // 验证数据时效性
    if (Date.now() - timestamp > this.MAX_CACHE_AGE) {
      throw new Error('数据已过期');
    }
    
    // Base64解码
    const encrypted = atob(data);
    
    // XOR解密
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return JSON.parse(decrypted);
  }

  /**
   * 生成数据签名
   */
  private generateSignature(data: string, timestamp: number): string {
    const signatureData = `${data}${timestamp}${this.SALT}`;
    return this.hash(signatureData);
  }

  /**
   * 验证数据签名
   */
  private verifySignature(data: string, timestamp: number, signature: string): boolean {
    const expectedSignature = this.generateSignature(data, timestamp);
    return expectedSignature === signature;
  }

  /**
   * 简单的哈希算法
   */
  private hash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 验证数据完整性
   */
  verifyDataIntegrity(data: any, expectedType: string): boolean {
    if (typeof data !== expectedType) {
      return false;
    }
    
    // 添加更多数据完整性验证逻辑
    return true;
  }

  /**
   * 检测作弊行为
   */
  detectCheating(userId: string): boolean {
    // 检查本地存储数据是否被篡改
    try {
      // 验证积分记录
      const pointsRecords = localStorage.getItem('POINTS_RECORDS');
      if (pointsRecords) {
        const parsedRecords = JSON.parse(pointsRecords);
        if (!Array.isArray(parsedRecords)) {
          return true;
        }
        
        // 验证每条记录的完整性
        for (const record of parsedRecords) {
          if (!record.id || !record.source || !record.type || record.points === undefined) {
            return true;
          }
        }
      }
      
      // 验证任务记录
      const tasks = localStorage.getItem('CREATIVE_TASKS');
      if (tasks) {
        const parsedTasks = JSON.parse(tasks);
        if (!Array.isArray(parsedTasks)) {
          return true;
        }
      }
      
      // 验证签到记录
      const checkinRecords = localStorage.getItem('CHECKIN_RECORDS');
      if (checkinRecords) {
        const parsedCheckins = JSON.parse(checkinRecords);
        if (!Array.isArray(parsedCheckins)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Cheating detection error:', error);
      return true; // 解析错误也视为作弊
    }
  }

  /**
   * 获取安全的本地存储项
   */
  getSecureItem(key: string): any | null {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const encryptedData: EncryptedData = JSON.parse(stored);
        return this.decrypt(encryptedData);
      }
      return null;
    } catch (error) {
      console.error('Failed to get secure item:', error);
      localStorage.removeItem(key); // 删除损坏的数据
      return null;
    }
  }

  /**
   * 设置安全的本地存储项
   */
  setSecureItem(key: string, data: any): void {
    try {
      const encryptedData = this.encrypt(data);
      localStorage.setItem(key, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Failed to set secure item:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    
    // 清理所有安全存储项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('SECURE_') || key.includes('_SECURE'))) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const encryptedData: EncryptedData = JSON.parse(stored);
            if (now - encryptedData.timestamp > this.MAX_CACHE_AGE) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key); // 删除损坏的数据
        }
      }
    }
  }

  /**
   * 生成唯一标识符
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 验证UUID格式
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// 导出单例实例
const service = new SecurityService();
export default service;
