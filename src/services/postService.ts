export interface Post {
  id: string
  title: string
  thumbnail: string
  likes: number
  comments: Array<{ id: string; content: string; date: string }>
  date: string
}

const KEY = 'jmzf_posts'

export function getPosts(): Post[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

export function addPost(p: Omit<Post, 'id' | 'likes' | 'comments' | 'date'>): Post {
  const post: Post = { id: `p-${Date.now()}`, likes: 0, comments: [], date: new Date().toISOString().slice(0, 10), ...p }
  const posts = getPosts()
  posts.unshift(post)
  localStorage.setItem(KEY, JSON.stringify(posts))
  return post
}

export function likePost(id: string) {
  const posts = getPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx >= 0) posts[idx].likes += 1
  localStorage.setItem(KEY, JSON.stringify(posts))
}

export function addComment(id: string, content: string) {
  const posts = getPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx >= 0) posts[idx].comments.push({ id: `c-${Date.now()}`, content, date: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(posts))
}

export default { getPosts, addPost, likePost, addComment }
