import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import taskService, { Task } from '@/services/taskService';
import { toast } from 'sonner';

interface TaskCenterProps {
  userId?: string;
}

export default React.memo(function TaskCenter({ userId = 'default-user' }: TaskCenterProps) {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载任务数据
  useEffect(() => {
    const allTasks = taskService.getAllTasks();
    setTasks(allTasks);
    setFilteredTasks(allTasks);
  }, []);

  // 筛选任务
  useEffect(() => {
    let result = [...tasks];

    // 按标签筛选
    if (activeTab !== 'all') {
      if (activeTab === 'active' || activeTab === 'completed') {
        result = taskService.getTasksByStatus(activeTab);
      } else {
        result = taskService.getTasksByType(activeTab);
      }
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      result = taskService.searchTasks(searchQuery);
    }

    setFilteredTasks(result);
  }, [tasks, activeTab, searchQuery]);

  // 处理任务选择
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  // 处理任务完成
  const handleCompleteTask = (task: Task) => {
    try {
      // 更新任务进度
      const progress = taskService.updateTaskProgress(task.id, userId, task.requirements.count);
      toast.success(`任务已完成：${task.title}`);
      // 刷新任务列表
      const allTasks = taskService.getAllTasks();
      setTasks(allTasks);
      setFilteredTasks(allTasks);
      setShowDetail(false);
    } catch (error) {
      toast.error('任务完成失败，请重试');
    }
  };

  // 处理任务进度更新
  const handleUpdateProgress = (task: Task, progress: number) => {
    try {
      taskService.updateTaskProgress(task.id, userId, progress);
      toast.success(`任务进度已更新：${task.title}`);
      // 刷新任务列表
      const allTasks = taskService.getAllTasks();
      setTasks(allTasks);
      setFilteredTasks(allTasks);
    } catch (error) {
      toast.error('进度更新失败，请重试');
    }
  };

  // 获取任务进度
  const getTaskProgress = (taskId: string) => {
    const progress = taskService.getTaskProgress(taskId, userId);
    return progress?.progress || 0;
  };

  // 计算任务完成百分比
  const calculateProgressPercentage = (task: Task) => {
    const progress = getTaskProgress(task.id);
    return Math.min(Math.round((progress / task.requirements.count) * 100), 100);
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  // 渲染任务卡片
  const renderTaskCard = (task: Task) => {
    const progress = getTaskProgress(task.id);
    const progressPercentage = calculateProgressPercentage(task);
    const isCompleted = progress >= task.requirements.count;

    return (
      <motion.div
        key={task.id}
        className={`rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border cursor-pointer`}
        whileHover={{ y: -4 }}
        onClick={() => handleTaskSelect(task)}
      >
        {/* 任务类型标签 */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {task.type === 'daily' && '每日任务'}
            {task.type === 'weekly' && '每周任务'}
            {task.type === 'monthly' && '月度任务'}
            {task.type === 'event' && '活动任务'}
            {task.type === 'achievement' && '成就任务'}
          </span>
        </div>

        {/* 任务图片 */}
        {task.thumbnail && (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={task.thumbnail}
              alt={task.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}

        {/* 任务信息 */}
        <div className="p-4">
          <h3 className="font-semibold text-base mb-2">{task.title}</h3>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
            {task.description}
          </p>

          {/* 任务进度条 */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>进度</span>
              <span>{progress}/{task.requirements.count}</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
          </div>

          {/* 任务奖励 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <i className="fas fa-gift text-yellow-500"></i>
              <span className="text-sm font-medium">{task.reward.points} 积分</span>
              {task.reward.badge && (
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {task.reward.badge}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {task.startDate && `开始：${formatDate(task.startDate)}`}
              {task.endDate && ` · 结束：${formatDate(task.endDate)}`}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">创作者任务中心</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            完成任务获得积分和奖励，提升你的创作等级
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6">
          {/* 搜索框 */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          {/* 标签筛选 */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '全部任务' },
              { key: 'active', label: '进行中' },
              { key: 'completed', label: '已完成' },
              { key: 'daily', label: '每日任务' },
              { key: 'weekly', label: '每周任务' },
              { key: 'monthly', label: '月度任务' },
              { key: 'event', label: '活动任务' },
              { key: 'achievement', label: '成就任务' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${activeTab === tab.key ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        {filteredTasks.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-tasks text-4xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">未找到任务</h3>
            <p>尝试调整筛选条件或搜索词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => renderTaskCard(task))}
          </div>
        )}
      </div>

      {/* 任务详情模态框 */}
      {showDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className={`rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 模态框头部 */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedTask.title}</h3>
              <button
                onClick={() => setShowDetail(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-4">
              {/* 任务图片 */}
              {selectedTask.imageUrl && (
                <div className="mb-4">
                  <img
                    src={selectedTask.imageUrl}
                    alt={selectedTask.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* 任务描述 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">任务描述</h4>
                <div className={`whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedTask.description}
                </div>
              </div>

              {/* 任务要求 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">任务要求</h4>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span>
                      {selectedTask.requirements.type === 'create' && `完成 ${selectedTask.requirements.count} 次创作`}
                      {selectedTask.requirements.type === 'share' && `分享 ${selectedTask.requirements.count} 次作品`}
                      {selectedTask.requirements.type === 'like' && `点赞 ${selectedTask.requirements.count} 次作品`}
                      {selectedTask.requirements.type === 'comment' && `评论 ${selectedTask.requirements.count} 次`}
                      {selectedTask.requirements.type === 'follow' && `关注 ${selectedTask.requirements.count} 位创作者`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 任务进度 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">任务进度</h4>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>当前进度</span>
                    <span>{getTaskProgress(selectedTask.id)}/{selectedTask.requirements.count}</span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateProgressPercentage(selectedTask)}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                </div>
              </div>

              {/* 任务奖励 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">任务奖励</h4>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-coins text-yellow-500"></i>
                    <span className="font-medium">{selectedTask.reward.points} 积分</span>
                  </div>
                  {selectedTask.reward.badge && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-award text-yellow-500"></i>
                      <span>{selectedTask.reward.badge}</span>
                    </div>
                  )}
                  {selectedTask.reward.description && (
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedTask.reward.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 任务时间 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">任务时间</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">开始时间</p>
                    <p>{selectedTask.startDate && formatDate(selectedTask.startDate)}</p>
                  </div>
                  {selectedTask.endDate && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className="text-xs text-gray-500 mb-1">结束时间</p>
                      <p>{formatDate(selectedTask.endDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowDetail(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                关闭
              </button>
              {getTaskProgress(selectedTask.id) < selectedTask.requirements.count && (
                <button
                  onClick={() => handleCompleteTask(selectedTask)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  立即完成
                </button>
              )}
              {getTaskProgress(selectedTask.id) >= selectedTask.requirements.count && (
                <button
                  disabled
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white opacity-60 cursor-not-allowed"
                >
                  已完成
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
