import React, { useCallback, memo } from 'react'
import { Post } from '../services/postService'
import LazyImage from './LazyImage'

interface PostGridProps {
  posts: Post[]
  onPostClick: (post: Post) => void
  onLike: (postId: string) => void
  onComment: (postId: string, text: string) => void
  isDark: boolean
}

// 单个帖子项组件
interface PostItemProps {
  post: Post
  index: number
  onPostClick: (post: Post) => void
  isDark: boolean
}

const PostItem = memo(({ post, index, onPostClick, isDark }: PostItemProps) => {
  // 使用useCallback优化点击事件
  const handlePostClick = useCallback(() => {
    onPostClick(post)
  }, [onPostClick, post])

  // 预先计算样式类名，避免每次渲染都重新计算
  const cardClassName = isDark 
    ? 'bg-gray-800 hover:bg-gray-700' 
    : 'bg-white hover:bg-gray-50'

  return (
    <div 
      className={`${cardClassName} rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105`}
      onClick={handlePostClick}
    >
      <div className="relative aspect-square">
        <LazyImage 
          src={post.thumbnail} 
          alt={post.title}
          className="w-full h-full object-cover"
          priority={index < 3} // 前3张图片优先加载
          quality={index < 6 ? 'high' : 'medium'} // 前6张图片使用高质量
          ratio="square"
          fit="cover"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {post.likes} ❤️
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{post.category}</span>
          <span>{post.likes} ❤️</span>
        </div>
      </div>
    </div>
  )
})

const PostGrid: React.FC<PostGridProps> = ({ 
  posts, 
  onPostClick, 
  onLike, 
  onComment, 
  isDark 
}) => {
  // 使用useCallback优化回调函数
  const handlePostClick = useCallback((post: Post) => {
    onPostClick(post)
  }, [onPostClick])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {posts.map((post, index) => (
        <PostItem 
          key={post.id} 
          post={post}
          index={index}
          onPostClick={handlePostClick}
          isDark={isDark}
        />
      ))}
    </div>
  )
}

export default memo(PostGrid)