import { SearchResultType } from '@/components/SearchBar'
import { mockWorks } from '@/mock/works'

// 搜索结果类型
export interface SearchResult {
  id: string
  text: string
  type: SearchResultType
  icon?: string
}

// 搜索分类结果
export interface SearchClassificationResult {
  query: string
  primaryType: SearchResultType
  confidence: number
  suggestedResults: SearchResult[]
}

// 搜索服务类
class SearchService {
  // 模拟用户数据
  private mockUsers = [
    { id: '1', name: '张三', avatar: 'https://example.com/avatar1.jpg', works: 12, followers: 100 },
    { id: '2', name: '李四', avatar: 'https://example.com/avatar2.jpg', works: 8, followers: 80 },
    { id: '3', name: '王五', avatar: 'https://example.com/avatar3.jpg', works: 15, followers: 150 },
    { id: '4', name: '赵六', avatar: 'https://example.com/avatar4.jpg', works: 5, followers: 50 },
    { id: '5', name: '孙七', avatar: 'https://example.com/avatar5.jpg', works: 20, followers: 200 }
  ]

  // 模拟分类数据
  private mockCategories = [
    '全部', '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'
  ]

  // 从作品中提取所有标签
  private getAllTags(): string[] {
    const tagsSet = new Set<string>()
    mockWorks.forEach(work => {
      work.tags.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet)
  }

  // 分析查询意图，确定主要结果类型
  classifyQuery(query: string): SearchClassificationResult {
    const lowerQuery = query.toLowerCase().trim()
    let primaryType = SearchResultType.WORK
    let confidence = 0.5
    const suggestedResults: SearchResult[] = []

    // 1. 检查是否是特殊页面
    const specialPages = [
      { name: '共创向导', path: '/wizard', icon: 'fas fa-magic' },
      { name: '共创广场', path: '/square', icon: 'fas fa-users' },
      { name: '创作中心', path: '/create', icon: 'fas fa-wand-magic-sparkles' },
      { name: '探索作品', path: '/explore', icon: 'fas fa-compass' },
      { name: '工具中心', path: '/tools', icon: 'fas fa-tools' }
    ]
    
    const exactPage = specialPages.find(page => page.name.toLowerCase() === lowerQuery)
    if (exactPage) {
      primaryType = SearchResultType.PAGE
      confidence = 0.99
      suggestedResults.push({
        id: exactPage.path,
        text: exactPage.name,
        type: SearchResultType.PAGE,
        icon: exactPage.icon || 'fas fa-file'
      })
    }

    // 2. 检查是否是精确的用户名
    const exactUser = this.mockUsers.find(user => user.name.toLowerCase() === lowerQuery)
    if (exactUser) {
      primaryType = SearchResultType.USER
      confidence = 0.95
      suggestedResults.push({
        id: exactUser.id,
        text: exactUser.name,
        type: SearchResultType.USER,
        icon: 'fas fa-user'
      })
    }

    // 2. 检查是否是精确的分类名
    const exactCategory = this.mockCategories.find(category => category.toLowerCase() === lowerQuery)
    if (exactCategory) {
      primaryType = SearchResultType.CATEGORY
      confidence = 0.9
      suggestedResults.push({
        id: exactCategory,
        text: exactCategory,
        type: SearchResultType.CATEGORY,
        icon: 'fas fa-folder'
      })
    }

    // 3. 检查是否是精确的标签名
    const exactTag = this.getAllTags().find(tag => tag.toLowerCase() === lowerQuery)
    if (exactTag) {
      primaryType = SearchResultType.TAG
      confidence = 0.85
      suggestedResults.push({
        id: exactTag,
        text: exactTag,
        type: SearchResultType.TAG,
        icon: 'fas fa-tag'
      })
    }

    // 4. 生成搜索建议
    if (suggestedResults.length === 0) {
      // 从作品标题中搜索
      const workSuggestions = mockWorks
        .filter(work => work.title.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map(work => ({
          id: work.id.toString(),
          text: work.title,
          type: SearchResultType.WORK,
          icon: 'fas fa-image'
        }))

      // 从用户名中搜索
      const userSuggestions = this.mockUsers
        .filter(user => user.name.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(user => ({
          id: user.id,
          text: user.name,
          type: SearchResultType.USER,
          icon: 'fas fa-user'
        }))

      // 从标签中搜索
      const tagSuggestions = this.getAllTags()
        .filter(tag => tag.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(tag => ({
          id: tag,
          text: tag,
          type: SearchResultType.TAG,
          icon: 'fas fa-tag'
        }))

      // 从分类中搜索
      const categorySuggestions = this.mockCategories
        .filter(category => category.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(category => ({
          id: category,
          text: category,
          type: SearchResultType.CATEGORY,
          icon: 'fas fa-folder'
        }))

      // 5. 搜索特殊页面
      const specialPages = [
        { name: '共创向导', path: '/wizard', icon: 'fas fa-magic' },
        { name: '共创广场', path: '/square', icon: 'fas fa-users' },
        { name: '创作中心', path: '/create', icon: 'fas fa-wand-magic-sparkles' },
        { name: '探索作品', path: '/explore', icon: 'fas fa-compass' },
        { name: '工具中心', path: '/tools', icon: 'fas fa-tools' }
      ]
      
      const pageSuggestions = specialPages
        .filter(page => page.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map(page => ({
          id: page.path,
          text: page.name,
          type: SearchResultType.PAGE,
          icon: page.icon
        }))

      // 合并所有建议
      suggestedResults.push(...pageSuggestions, ...workSuggestions, ...userSuggestions, ...tagSuggestions, ...categorySuggestions)

      // 确定主要类型
      if (pageSuggestions.length > 0) {
        primaryType = SearchResultType.PAGE
        confidence = 0.8
      } else if (workSuggestions.length > 0) {
        primaryType = SearchResultType.WORK
        confidence = 0.7
      } else if (userSuggestions.length > 0) {
        primaryType = SearchResultType.USER
        confidence = 0.6
      } else if (tagSuggestions.length > 0) {
        primaryType = SearchResultType.TAG
        confidence = 0.6
      } else if (categorySuggestions.length > 0) {
        primaryType = SearchResultType.CATEGORY
        confidence = 0.6
      }
    }

    return {
      query,
      primaryType,
      confidence,
      suggestedResults
    }
  }

  // 生成搜索建议
  generateSuggestions(query: string): SearchResult[] {
    const classification = this.classifyQuery(query)
    return classification.suggestedResults
  }

  // 根据查询和类型生成重定向URL
  generateRedirectUrl(query: string, type: SearchResultType): string {
    const encodedQuery = encodeURIComponent(query)

    switch (type) {
      case SearchResultType.WORK:
        return `/explore?search=${encodedQuery}`
      case SearchResultType.USER:
        return `/user?name=${encodedQuery}`
      case SearchResultType.CATEGORY:
        return `/explore?category=${encodedQuery}`
      case SearchResultType.TAG:
        return `/explore?tag=${encodedQuery}`
      case SearchResultType.PAGE:
        // 特殊页面直接返回路径
        const specialPages = [
          { name: '共创向导', path: '/wizard' },
          { name: '共创广场', path: '/square' },
          { name: '创作中心', path: '/create' },
          { name: '探索作品', path: '/explore' },
          { name: '工具中心', path: '/tools' }
        ]
        const page = specialPages.find(p => p.name.toLowerCase() === query.toLowerCase())
        return page ? page.path : `/search?query=${encodedQuery}`
      default:
        return `/search?query=${encodedQuery}`
    }
  }

  // 搜索所有类型的结果
  searchAll(query: string): {
    works: typeof mockWorks
    users: typeof this.mockUsers
    categories: string[]
    tags: string[]
  } {
    const lowerQuery = query.toLowerCase().trim()

    // 搜索作品
    const works = mockWorks.filter(work => 
      work.title.toLowerCase().includes(lowerQuery) ||
      work.description?.toLowerCase().includes(lowerQuery) ||
      work.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      work.creator.toLowerCase().includes(lowerQuery)
    )

    // 搜索用户
    const users = this.mockUsers.filter(user => 
      user.name.toLowerCase().includes(lowerQuery)
    )

    // 搜索分类
    const categories = this.mockCategories.filter(category => 
      category.toLowerCase().includes(lowerQuery)
    )

    // 搜索标签
    const tags = this.getAllTags().filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    )

    return {
      works,
      users,
      categories,
      tags
    }
  }

  // 跟踪搜索事件（用于分析）
  trackSearchEvent(event: {
    query: string
    resultType: SearchResultType
    clicked: boolean
    clickIndex?: number
    timestamp: number
  }): void {
    // 这里可以实现搜索事件的跟踪逻辑，例如发送到分析服务
    console.log('Search Event:', event)
    // 实际项目中可以使用第三方分析服务如Google Analytics或自定义API
  }
}

// 导出单例实例
export const searchService = new SearchService()

export default searchService
