import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import collaborationService, { Collaborator, CollaborationHistory, VersionHistory } from '@/services/collaborationService';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ isOpen, onClose, sessionId = 'session-1' }) => {
  const { theme, isDark } = useTheme();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [history, setHistory] = useState<CollaborationHistory[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'collaborators' | 'history' | 'versions'>('collaborators');
  const [error, setError] = useState<string | null>(null);
  
  // 加载协作数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      
      try {
        // 模拟API请求延迟
        setTimeout(() => {
          // 检查会话是否存在，如果不存在则创建
          let session = collaborationService.getSession(sessionId);
          if (!session) {
            session = collaborationService.createSession('新协作项目', '当前用户');
          }
          
          // 获取协作成员
          const sessionCollaborators = collaborationService.getCollaborators(sessionId);
          setCollaborators(sessionCollaborators);
          
          // 获取操作历史
          const sessionHistory = collaborationService.getHistory(sessionId);
          setHistory(sessionHistory);

          // 获取版本历史
          const sessionVersions = collaborationService.getVersionHistory(sessionId);
          setVersionHistory(sessionVersions);
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        setError('加载协作数据失败，请稍后再试');
        setIsLoading(false);
      }
    }
  }, [isOpen, sessionId]);
  
  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('请输入邮箱地址');
      return;
    }
    
    try {
      // 使用协作服务邀请用户
      const newCollaborator = collaborationService.inviteUser(sessionId, inviteEmail, inviteRole);
      if (newCollaborator) {
        setCollaborators(prev => [...prev, newCollaborator]);
        toast.success(`已邀请 ${inviteEmail} 加入协作`);
        
        // 清空输入框
        setInviteEmail('');
        setInviteRole('editor');
      } else {
        toast.error('邀请失败，请稍后再试');
      }
    } catch (err) {
      toast.error('邀请失败，请稍后再试');
    }
  };
  
  const handleRemove = (userId: string) => {
    try {
      // 使用协作服务移除成员
      const success = collaborationService.removeUser(sessionId, userId);
      if (success) {
        setCollaborators(prev => prev.filter(user => user.id !== userId));
        toast.success('已移除协作成员');
      } else {
        toast.error('操作失败，请稍后再试');
      }
    } catch (err) {
      toast.error('操作失败，请稍后再试');
    }
  };
  
  const handleChangeRole = (userId: string, role: 'editor' | 'viewer') => {
    try {
      // 使用协作服务修改角色
      const success = collaborationService.updateUserRole(sessionId, userId, role);
      if (success) {
        setCollaborators(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, role } : user
          )
        );
        toast.success('已更新协作成员角色');
      } else {
        toast.error('操作失败，请稍后再试');
      }
    } catch (err) {
      toast.error('操作失败，请稍后再试');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 right-0 w-full max-w-md h-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl z-50 flex flex-col`}
    >
      {/* 面板头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
        <h3 className="text-lg font-bold">协作创作</h3>
        <button 
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          aria-label="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* 标签页导航 */}
      <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex">
          {[
            { id: 'collaborators', name: '协作者' },
            { id: 'history', name: '操作历史' },
            { id: 'versions', name: '版本管理' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 transition-colors font-medium text-sm ${
                activeTab === tab.id 
                  ? 'text-red-600 border-b-2 border-red-600' 
                  : isDark 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 面板内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 错误信息显示 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}
        
        {/* 协作成员标签页 */}
        {activeTab === 'collaborators' && (
          <div>
            {/* 协作成员列表 */}
            <div className="mb-8">
              <h4 className="text-base font-medium mb-4 flex items-center">
                <i className="fas fa-users mr-2"></i>
                协作成员 ({collaborators.length})
              </h4>
              
              {isLoading ? (
                // 加载状态
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // 成员列表
                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
                      <div className="relative mr-4">
                        <img 
                          src={collaborator.avatar} 
                          alt={collaborator.username} 
                          className="h-10 w-10 rounded-full"
                        />
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${collaborator.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </div>
                       
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium">{collaborator.username}</p>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${collaborator.role === 'editor' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {collaborator.role === 'editor' ? '编辑者' : '查看者'}
                          </span>
                        </div>
                        <p className="text-xs opacity-70">
                          {collaborator.isOnline ? '在线' : `最后在线：${collaborator.lastActive ? new Date(collaborator.lastActive).toLocaleString() : '未知'}`}
                        </p>
                      </div>
                       
                      <div className="flex space-x-2">
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleChangeRole(collaborator.id, e.target.value as 'editor' | 'viewer')}
                          className={`text-xs p-1 rounded ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-gray-200 border-gray-300'} border`}
                        >
                          <option value="editor">编辑者</option>
                          <option value="viewer">查看者</option>
                        </select>
                        
                        <button 
                          onClick={() => handleRemove(collaborator.id)}
                          className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} text-red-500 transition-colors`}
                          aria-label="移除"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 邀请协作者 */}
            <div>
              <h4 className="text-base font-medium mb-4 flex items-center">
                <i className="fas fa-user-plus mr-2"></i>
                邀请协作者
              </h4>
              
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">邮箱地址</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="输入协作者邮箱"
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 border' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 border'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">角色</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white border' 
                          : 'bg-white border-gray-300 text-gray-900 border'
                      }`}
                    >
                      <option value="editor">编辑者（可修改内容）</option>
                      <option value="viewer">查看者（仅可查看）</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleInvite}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    发送邀请
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 操作历史标签页 */}
        {activeTab === 'history' && (
          <div>
            <h4 className="text-base font-medium mb-4 flex items-center">
              <i className="fas fa-history mr-2"></i>
              操作历史
            </h4>
            
            {isLoading ? (
              // 加载状态
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 mr-3"></div>
                    <div className="flex-1">
                      <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                      <div className="h-2 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 历史记录
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'} mr-3`}>
                      <i className="fas fa-user text-sm"></i>
                    </div>
                  
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{record.username}</span>
                        <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {record.action}
                        </span>
                      </p>
                      <p className="text-xs opacity-70">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 版本管理标签页 */}
        {activeTab === 'versions' && (
          <div>
            <h4 className="text-base font-medium mb-4 flex items-center">
              <i className="fas fa-code-branch mr-2"></i>
              版本管理
            </h4>
            
            {isLoading ? (
              // 加载状态
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    </div>
                    <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                    <div className="flex justify-end">
                      <div className="h-7 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 版本列表
              <div className="space-y-3">
                {versionHistory.map((version) => (
                  <div key={version.id} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{version.version}</span>
                      <span className="text-xs opacity-70">{new Date(version.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <i className="fas fa-user text-xs"></i>
                      </div>
                      <span className="text-sm">{version.creator}</span>
                    </div>
                    <p className="text-sm mb-3">{version.description}</p>
                    <div className="flex justify-end space-x-2">
                      <button className={`p-1.5 rounded text-sm ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                        查看差异
                      </button>
                      {version.id !== 'version-1' && (
                        <button className={`p-1.5 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors`}>
                          恢复此版本
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 面板底部 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-3">
          <button className={`flex-1 p-2 rounded-lg ${
            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          } transition-colors flex items-center justify-center`}>
            <i className="fas fa-link mr-2"></i>
            <span>复制分享链接</span>
          </button>
          
          <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center">
            <i className="fas fa-bell"></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default CollaborationPanel;
