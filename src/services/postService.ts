// 评论反应类型
export type CommentReaction = 'like' | 'love' | 'laugh' | 'surprise' | 'sad' | 'angry';

// 评论接口
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

// 作品分类类型
export type PostCategory = 'design' | 'writing' | 'audio' | 'video' | 'other';

// 作品接口
export interface Post {
  id: string;
  title: string;
  thumbnail: string;
  likes: number;
  comments: Comment[];
  date: string;
  author?: string;
  isLiked?: boolean;
  // 作品集扩展字段
  category: PostCategory;
  tags: string[];
  description: string;
  views: number;
  shares: number;
  isFeatured: boolean;
  isDraft: boolean;
  completionStatus: 'draft' | 'completed' | 'published';
  creativeDirection: string;
  culturalElements: string[];
  colorScheme: string[];
  toolsUsed: string[];
  resolution?: string;
  fileSize?: string;
  downloadCount?: number;
  license?: string;
}

const KEY = 'jmzf_posts';

/**
 * 获取所有帖子
 */
export function getPosts(): Post[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 添加作品
 */
export function addPost(p: Omit<Post, 'id' | 'likes' | 'comments' | 'date' | 'isLiked' | 'views' | 'shares' | 'isFeatured' | 'isDraft' | 'completionStatus'>): Post {
  const post: Post = {
    id: `p-${Date.now()}`,
    likes: 0,
    comments: [],
    date: new Date().toISOString().slice(0, 10),
    isLiked: false,
    views: 0,
    shares: 0,
    isFeatured: false,
    isDraft: false,
    completionStatus: 'completed',
    ...p
  };
  const posts = getPosts();
  posts.unshift(post);
  localStorage.setItem(KEY, JSON.stringify(posts));
  return post;
}

/**
 * 点赞帖子
 */
export function likePost(id: string): Post | undefined {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) {
    posts[idx].likes += 1;
    posts[idx].isLiked = true;
    localStorage.setItem(KEY, JSON.stringify(posts));
    return posts[idx];
  }
  return undefined;
}

/**
 * 取消点赞帖子
 */
export function unlikePost(id: string): Post | undefined {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0 && posts[idx].likes > 0) {
    posts[idx].likes -= 1;
    posts[idx].isLiked = false;
    localStorage.setItem(KEY, JSON.stringify(posts));
    return posts[idx];
  }
  return undefined;
}

/**
 * 递归查找评论
 */
function findComment(comments: Comment[], commentId: string): { comment: Comment; parent?: Comment; index: number } | null {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === commentId) {
      return { comment: comments[i], index: i };
    }
    const result = findComment(comments[i].replies, commentId);
    if (result) {
      return result.parent ? result : { ...result, parent: comments[i] };
    }
  }
  return null;
}

/**
 * 添加评论
 */
export function addComment(postId: string, content: string, parentId?: string): Post | undefined {
  const posts = getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      content,
      date: new Date().toISOString(),
      likes: 0,
      reactions: {
        like: 0,
        love: 0,
        laugh: 0,
        surprise: 0,
        sad: 0,
        angry: 0
      },
      replies: [],
      userReactions: []
    };

    if (parentId) {
      const result = findComment(posts[postIdx].comments, parentId);
      if (result) {
        result.comment.replies.push(newComment);
      }
    } else {
      posts[postIdx].comments.push(newComment);
    }

    localStorage.setItem(KEY, JSON.stringify(posts));
    return posts[postIdx];
  }
  return undefined;
}

/**
 * 点赞评论
 */
export function likeComment(postId: string, commentId: string): Post | undefined {
  const posts = getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result) {
      result.comment.likes += 1;
      result.comment.isLiked = true;
      localStorage.setItem(KEY, JSON.stringify(posts));
      return posts[postIdx];
    }
  }
  return undefined;
}

/**
 * 取消点赞评论
 */
export function unlikeComment(postId: string, commentId: string): Post | undefined {
  const posts = getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result && result.comment.likes > 0) {
      result.comment.likes -= 1;
      result.comment.isLiked = false;
      localStorage.setItem(KEY, JSON.stringify(posts));
      return posts[postIdx];
    }
  }
  return undefined;
}

/**
 * 添加评论反应
 */
export function addCommentReaction(postId: string, commentId: string, reaction: CommentReaction): Post | undefined {
  const posts = getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result) {
      // 如果用户已经添加了该反应，则移除
      const userReactionIndex = result.comment.userReactions.indexOf(reaction);
      if (userReactionIndex > -1) {
        result.comment.userReactions.splice(userReactionIndex, 1);
        result.comment.reactions[reaction] -= 1;
      } else {
        // 添加新反应
        result.comment.userReactions.push(reaction);
        result.comment.reactions[reaction] += 1;
      }
      localStorage.setItem(KEY, JSON.stringify(posts));
      return posts[postIdx];
    }
  }
  return undefined;
}

/**
 * 删除评论
 */
export function deleteComment(postId: string, commentId: string): Post | undefined {
  const posts = getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const removeComment = (comments: Comment[]): boolean => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
          comments.splice(i, 1);
          return true;
        }
        if (removeComment(comments[i].replies)) {
          return true;
        }
      }
      return false;
    };

    if (removeComment(posts[postIdx].comments)) {
      localStorage.setItem(KEY, JSON.stringify(posts));
      return posts[postIdx];
    }
  }
  return undefined;
}

export default {
  getPosts,
  addPost,
  likePost,
  unlikePost,
  addComment,
  likeComment,
  unlikeComment,
  addCommentReaction,
  deleteComment
};
