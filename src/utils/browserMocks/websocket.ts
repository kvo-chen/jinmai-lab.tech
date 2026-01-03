/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// WebSocket Mock
export class WebSocketMock extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  url: string;
  protocol: string;
  readyState: number;
  bufferedAmount: number;
  extensions: string;
  binaryType: string;

  constructor(url: string, protocols?: string | string[]) {
    super();
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] : protocols || '';
    this.readyState = WebSocketMock.CONNECTING;
    this.bufferedAmount = 0;
    this.extensions = '';
    this.binaryType = 'blob';

    // 模拟连接过程
    setTimeout(() => {
      this.readyState = WebSocketMock.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 100);
  }

  send(data: any) {
    if (this.readyState !== WebSocketMock.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // 模拟发送数据
    this.bufferedAmount += typeof data === 'string' ? data.length : 0;
  }

  close(code?: number, reason?: string) {
    if (this.readyState === WebSocketMock.CLOSED) return;
    
    this.readyState = WebSocketMock.CLOSING;
    
    setTimeout(() => {
      this.readyState = WebSocketMock.CLOSED;
      this.dispatchEvent(new CloseEvent('close', {
        code: code || 1000,
        reason: reason || '',
        wasClean: true
      }));
    }, 50);
  }

  // 模拟接收消息
  simulateMessage(data: any) {
    if (this.readyState === WebSocketMock.OPEN) {
      this.dispatchEvent(new MessageEvent('message', { data }));
    }
  }

  // 模拟错误
  simulateError(error: any) {
    this.dispatchEvent(new ErrorEvent('error', { error }));
  }
}

export const ws = {
  WebSocket: WebSocketMock,
  WebSocketServer: class {
    constructor() {
      throw new Error('WebSocketServer is not available in browser environment');
    }
  }
};

export default ws;