import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

// 类型定义
export type CommentReaction = 'like' | 'love' | 'laugh' | 'surprise' | 'sad' | 'angry';

export interface Comment {
  id: string;
  content: string;
  date: string;
  author?: string;
  likes: number;
  reactions: Record<CommentReaction, number>;
  parentId?: string;
  replies: Comment[];
  isLiked?: boolean;
  userReactions: CommentReaction[];
}

interface EnhancedCommentProps {
  comment: Comment;
  postId: string;
  onCommentUpdate: () => void;
  depth?: number;
  maxDepth?: number;
}

const REACTION_ICONS: Record<CommentReaction, string> = {
  like: 'fa-thumbs-up',
  love: 'fa-heart',
  laugh: 'fa-face-laugh',
  surprise: 'fa-face-surprise',
  sad: 'fa-face-sad-tear',
  angry: 'fa-face-angry'
};

const REACTION_COLORS: Record<CommentReaction, string> = {
  like: 'text-blue-500',
  love: 'text-red-500',
  laugh: 'text-yellow-500',
  surprise: 'text-purple-500',
  sad: 'text-gray-500',
  angry: 'text-orange-500'
};

export default React.memo(function EnhancedComment({
  comment,
  postId,
  onCommentUpdate,
  depth = 0,
  maxDepth = 3
}: EnhancedCommentProps) {
  const { isDark } = useTheme();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // 处理评论点赞
  const handleLikeComment = async () => {
    try {
      const postService = await import('@/services/postService');
      if (comment.isLiked) {
        postService.unlikeComment(postId, comment.id);
      } else {
        postService.likeComment(postId, comment.id);
      }
      onCommentUpdate();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  // 处理评论反应
  const handleReaction = async (reaction: CommentReaction) => {
    try {
      const postService = await import('@/services/postService');
      postService.addCommentReaction(postId, comment.id, reaction);
      onCommentUpdate();
      setShowReactions(false);
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  // 处理回复评论
  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.warning('回复内容不能为空');
      return;
    }

    try {
      setIsReplying(true);
      const postService = await import('@/services/postService');
      postService.addComment(postId, replyContent, comment.id);
      setReplyContent('');
      setShowReplyInput(false);
      onCommentUpdate();
      toast.success('回复成功');
    } catch (error) {
      toast.error('回复失败，请重试');
    } finally {
      setIsReplying(false);
    }
  };

  // 处理删除评论
  const handleDelete = async () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      try {
        const postService = await import('@/services/postService');
        postService.deleteComment(postId, comment.id);
        onCommentUpdate();
        toast.success('评论已删除');
      } catch (error) {
        toast.error('删除失败，请重试');
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染反应按钮
  const renderReactionButtons = () => {
    return (
      <div className="flex gap-1 mt-2">
        {Object.entries(comment.reactions).map(([reaction, count]) => {
          const reactionKey = reaction as CommentReaction;
          const isActive = comment.userReactions.includes(reactionKey);
          return (
            <button
              key={reactionKey}
              onClick={() => handleReaction(reactionKey)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} ${isActive ? REACTION_COLORS[reactionKey] : 'text-gray-500'}`}
              title={reactionKey}
            >
              <i className={`fas ${REACTION_ICONS[reactionKey]} ${isActive ? REACTION_COLORS[reactionKey] : ''}`}></i>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-4">
      {/* 评论内容 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border ${depth > 0 ? `ml-${depth * 4}` : ''}`}
      >
        {/* 评论头部 */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <i className="fas fa-user text-gray-500"></i>
            </div>
            <div>
              <div className="font-medium text-sm">{comment.author || '匿名用户'}</div>
              <div className="text-xs text-gray-500">{formatDate(comment.date)}</div>
            </div>
          </div>
          <button
            onClick={() => handleDelete()}
            className={`p-1 rounded-full text-xs transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
            title="删除评论"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>

        {/* 评论正文 */}
        <div className="mb-3 text-sm">{comment.content}</div>

        {/* 评论操作 */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleLikeComment}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${comment.isLiked ? 'text-blue-500' : 'text-gray-500'} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <i className={`fas fa-thumbs-up ${comment.isLiked ? 'text-blue-500' : ''}`}></i>
            <span>{comment.likes}</span>
          </button>

          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors text-gray-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <i className="fas fa-face-smile"></i>
            <span>反应</span>
          </button>

          {depth < maxDepth && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors text-gray-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <i className="fas fa-reply"></i>
              <span>回复</span>
            </button>
          )}
        </div>

        {/* 反应按钮 */}
        {showReactions && renderReactionButtons()}

        {/* 回复输入框 */}
        {showReplyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              rows={2}
              className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            ></textarea>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyContent('');
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                取消
              </button>
              <button
                onClick={handleReply}
                disabled={isReplying || !replyContent.trim()}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${(isReplying || !replyContent.trim()) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isReplying ? '回复中...' : '回复'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 回复列表 */}
      {comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <EnhancedComment
              key={reply.id}
              comment={reply}
              postId={postId}
              onCommentUpdate={onCommentUpdate}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
