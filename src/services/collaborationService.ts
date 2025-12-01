// 协作服务，用于管理协作会话和用户

// 协作会话类型定义
export interface CollaborationSession {
  id: string;
  name: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators: Collaborator[];
  history: CollaborationHistory[];
  currentVersion: string;
}

// 协作用户类型定义
export interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: 'editor' | 'viewer';
  isOnline: boolean;
  joinedAt: Date;
  lastActive?: Date;
  cursorPosition?: { x: number; y: number };
}

// 协作历史记录类型定义
export interface CollaborationHistory {
  id: string;
  userId: string;
  username: string;
  action: string;
  timestamp: Date;
  details?: any;
}

// 版本历史类型定义
export interface VersionHistory {
  id: string;
  sessionId: string;
  version: string;
  timestamp: Date;
  creator: string;
  description: string;
  snapshot?: any;
}

// 协作服务类
class CollaborationService {
  private sessions: Map<string, CollaborationSession> = new Map();
  private versionHistory: Map<string, VersionHistory[]> = new Map();
  private nextSessionId = 1;
  private nextVersionId = 1;
  private nextHistoryId = 1;

  // 创建新的协作会话
  createSession(name: string, creator: string): CollaborationSession {
    const session: CollaborationSession = {
      id: `session-${this.nextSessionId++}`,
      name,
      creator,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [],
      history: [],
      currentVersion: 'v1.0'
    };
    
    this.sessions.set(session.id, session);
    this.versionHistory.set(session.id, []);
    
    return session;
  }

  // 获取会话信息
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  // 获取所有会话
  getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  // 邀请用户加入会话
  inviteUser(sessionId: string, email: string, role: 'editor' | 'viewer'): Collaborator | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 模拟用户信息，实际应用中应从用户系统获取
    const collaborator: Collaborator = {
      id: `user-${Math.floor(Math.random() * 1000)}`,
      username: email.split('@')[0],
      email,
      avatar: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20${email.split('@')[0]}`,
      role,
      isOnline: true,
      joinedAt: new Date()
    };

    session.collaborators.push(collaborator);
    session.updatedAt = new Date();

    // 添加历史记录
    this.addHistory(sessionId, {
      userId: session.creator,
      username: '系统',
      action: `邀请了 ${collaborator.username} 加入会话`,
      timestamp: new Date(),
      details: { role }
    });

    return collaborator;
  }

  // 移除用户
  removeUser(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const collaboratorIndex = session.collaborators.findIndex(c => c.id === userId);
    if (collaboratorIndex === -1) return false;

    const removedCollaborator = session.collaborators[collaboratorIndex];
    session.collaborators.splice(collaboratorIndex, 1);
    session.updatedAt = new Date();

    // 添加历史记录
    this.addHistory(sessionId, {
      userId: session.creator,
      username: '系统',
      action: `移除了 ${removedCollaborator.username}`,
      timestamp: new Date()
    });

    return true;
  }

  // 更新用户角色
  updateUserRole(sessionId: string, userId: string, role: 'editor' | 'viewer'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const collaborator = session.collaborators.find(c => c.id === userId);
    if (!collaborator) return false;

    const oldRole = collaborator.role;
    collaborator.role = role;
    session.updatedAt = new Date();

    // 添加历史记录
    this.addHistory(sessionId, {
      userId: session.creator,
      username: '系统',
      action: `将 ${collaborator.username} 的角色从 ${oldRole === 'editor' ? '编辑者' : '查看者'} 更改为 ${role === 'editor' ? '编辑者' : '查看者'}`,
      timestamp: new Date(),
      details: { oldRole, newRole: role }
    });

    return true;
  }

  // 更新用户在线状态
  updateUserStatus(sessionId: string, userId: string, isOnline: boolean): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const collaborator = session.collaborators.find(c => c.id === userId);
    if (!collaborator) return false;

    collaborator.isOnline = isOnline;
    collaborator.lastActive = new Date();
    session.updatedAt = new Date();

    return true;
  }

  // 更新光标位置
  updateCursorPosition(sessionId: string, userId: string, position: { x: number; y: number }): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const collaborator = session.collaborators.find(c => c.id === userId);
    if (!collaborator) return false;

    collaborator.cursorPosition = position;
    collaborator.lastActive = new Date();
    session.updatedAt = new Date();

    return true;
  }

  // 添加历史记录
  addHistory(sessionId: string, history: Omit<CollaborationHistory, 'id'>): CollaborationHistory {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const newHistory: CollaborationHistory = {
      id: `history-${this.nextHistoryId++}`,
      ...history,
      timestamp: new Date()
    };

    session.history.push(newHistory);
    session.updatedAt = new Date();

    // 限制历史记录数量
    if (session.history.length > 100) {
      session.history = session.history.slice(-100);
    }

    return newHistory;
  }

  // 创建版本
  createVersion(sessionId: string, creator: string, description: string, snapshot?: any): VersionHistory {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const versions = this.versionHistory.get(sessionId) || [];
    const versionNumber = versions.length + 1;
    const version: VersionHistory = {
      id: `version-${this.nextVersionId++}`,
      sessionId,
      version: `v1.${versionNumber}`,
      timestamp: new Date(),
      creator,
      description,
      snapshot
    };

    versions.unshift(version);
    this.versionHistory.set(sessionId, versions);

    session.currentVersion = version.version;
    session.updatedAt = new Date();

    // 添加历史记录
    this.addHistory(sessionId, {
      userId: creator,
      username: creator,
      action: `创建了版本 ${version.version}`,
      timestamp: new Date(),
      details: { description }
    });

    return version;
  }

  // 获取版本历史
  getVersionHistory(sessionId: string): VersionHistory[] {
    return this.versionHistory.get(sessionId) || [];
  }

  // 获取会话的协作者
  getCollaborators(sessionId: string): Collaborator[] {
    const session = this.sessions.get(sessionId);
    return session ? session.collaborators : [];
  }

  // 获取会话的历史记录
  getHistory(sessionId: string): CollaborationHistory[] {
    const session = this.sessions.get(sessionId);
    return session ? session.history : [];
  }

  // 删除会话
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.versionHistory.delete(sessionId);
    }
    return deleted;
  }
}

// 创建单例实例
const collaborationService = new CollaborationService();

export default collaborationService;
