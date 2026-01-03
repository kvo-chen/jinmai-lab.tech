/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// crypto模块Mock
export const crypto = {
  randomBytes: (size: number) => {
    const array = new Uint8Array(size);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // 降级方案
      for (let i = 0; i < size; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  },
  
  createHash: (algorithm: string) => ({
    update: (data: any) => ({
      digest: (encoding: string) => {
        // 简化的哈希实现（仅用于演示）
        return btoa(String.fromCharCode(...new TextEncoder().encode(String(data))));
      }
    })
  }),
  
  createHmac: (algorithm: string, key: string) => ({
    update: (data: any) => ({
      digest: (encoding: string) => {
        // 简化的HMAC实现（仅用于演示）
        return btoa(String.fromCharCode(...new TextEncoder().encode(String(data) + key)));
      }
    })
  }),
  
  randomUUID: () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    
    // 降级方案
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

export default crypto;