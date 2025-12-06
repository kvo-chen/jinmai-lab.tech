// WebSocket实时协作服务

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onSessionJoin?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
  onTextEdit?: (data: any) => void;
  onCursorUpdate?: (data: any) => void;
  onSelectionUpdate?: (data: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // 连接WebSocket
  connect(sessionId: string, userId: string, username: string) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = `ws://localhost:3007/ws?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onOpen?.();
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket连接已关闭', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.callbacks.onClose?.();
        
        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(sessionId, userId, username);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket消息解析错误:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.isConnecting = false;
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnecting = false;
  }

  // 发送消息
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 发送文本编辑操作
  sendTextEdit(operation: 'insert' | 'delete', position: number, text: string = '', length: number = 0) {
    this.send({
      type: 'text_edit',
      operation,
      position,
      text,
      length
    });
  }

  // 发送光标移动
  sendCursorMove(position: number) {
    this.send({
      type: 'cursor_move',
      position
    });
  }

  // 发送选择变化
  sendSelectionChange(start: number, end: number) {
    this.send({
      type: 'selection_change',
      start,
      end
    });
  }

  // 发送开始输入状态
  sendTypingStart() {
    this.send({
      type: 'typing_start'
    });
  }

  // 发送停止输入状态
  sendTypingStop() {
    this.send({
      type: 'typing_stop'
    });
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage) {
    this.callbacks.onMessage?.(message);

    switch (message.type) {
      case 'session_joined':
        this.callbacks.onSessionJoin?.(message);
        break;
      case 'user_joined':
        this.callbacks.onUserJoined?.(message);
        break;
      case 'user_left':
        this.callbacks.onUserLeft?.(message);
        break;
      case 'text_edit':
        this.callbacks.onTextEdit?.(message);
        break;
      case 'cursor_update':
        this.callbacks.onCursorUpdate?.(message);
        break;
      case 'selection_update':
        this.callbacks.onSelectionUpdate?.(message);
        break;
      case 'error':
        console.error('WebSocket服务器错误:', message.message);
        break;
      default:
        console.warn('未知的WebSocket消息类型:', message.type);
    }
  }

  // 心跳检测
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 设置回调函数
  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // 单独设置回调函数
  onOpen(callback: () => void) {
    this.callbacks.onOpen = callback;
  }

  onClose(callback: () => void) {
    this.callbacks.onClose = callback;
  }

  onError(callback: (error: Event) => void) {
    this.callbacks.onError = callback;
  }

  onMessage(callback: (message: WebSocketMessage) => void) {
    this.callbacks.onMessage = callback;
  }

  onSessionJoin(callback: (data: any) => void) {
    this.callbacks.onSessionJoin = callback;
  }

  onUserJoined(callback: (data: any) => void) {
    this.callbacks.onUserJoined = callback;
  }

  onUserLeft(callback: (data: any) => void) {
    this.callbacks.onUserLeft = callback;
  }

  onTextEdit(callback: (data: any) => void) {
    this.callbacks.onTextEdit = callback;
  }

  onCursorUpdate(callback: (data: any) => void) {
    this.callbacks.onCursorUpdate = callback;
  }

  onSelectionUpdate(callback: (data: any) => void) {
    this.callbacks.onSelectionUpdate = callback;
  }

  // 获取连接状态
  getConnectionState(): 'connecting' | 'open' | 'closed' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'open';
    if (this.ws?.readyState === WebSocket.CLOSED) return 'closed';
    return 'error';
  }
}

// 创建单例实例
export const websocketService = new WebSocketService();
export default websocketService;