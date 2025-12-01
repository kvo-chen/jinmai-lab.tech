import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import templateService, { Template, TEMPLATE_CATEGORIES } from '@/services/templateService';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  showCreateButton?: boolean;
}

export default React.memo(function TemplateLibrary({ onSelectTemplate, showCreateButton = true }: TemplateLibraryProps) {
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortOption, setSortOption] = useState<string>('latest'); // latest, popular, featured
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: '',
    tags: [],
    category: '其他',
    isOfficial: false,
    useCases: [],
    language: 'zh-CN',
    config: {
      model: 'doubao-pro-32k',
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000
    }
  });
  const [tagInput, setTagInput] = useState('');
  const [useCaseInput, setUseCaseInput] = useState('');

  // 加载模板
  useEffect(() => {
    const allTemplates = templateService.getAllTemplates();
    setTemplates(allTemplates);
    setFilteredTemplates(allTemplates);
  }, []);

  // 筛选和排序模板
  useEffect(() => {
    let result = [...templates];

    // 按分类筛选
    if (selectedCategory !== '全部') {
      result = result.filter(t => t.category === selectedCategory);
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      result = templateService.searchTemplates(searchQuery);
    }

    // 排序
    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'featured':
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.updatedAt - a.updatedAt;
        });
        break;
      case 'latest':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    setFilteredTemplates(result);
  }, [templates, selectedCategory, searchQuery, sortOption]);

  // 处理模板选择
  const handleSelectTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      templateService.incrementUsage(template.id);
      toast.success(`已选择模板：${template.name}`);
    } else {
      setSelectedTemplate(template);
      setShowModal(true);
    }
  };

  // 处理模板使用
  const handleUseTemplate = (template: Template) => {
    templateService.incrementUsage(template.id);
    toast.success(`已使用模板：${template.name}`);
    setShowModal(false);
    // 这里可以添加跳转到创作页面的逻辑
  };

  // 处理模板下载
  const handleDownloadTemplate = (template: Template) => {
    templateService.incrementDownloadCount(template.id);
    toast.success(`已下载模板：${template.name}`);
    // 这里可以添加模板下载逻辑
  };

  // 处理模板评分
  const handleRateTemplate = (templateId: string, rating: number) => {
    templateService.rateTemplate(templateId, rating);
    setTemplates(templateService.getAllTemplates());
    toast.success('评分已提交');
  };

  // 处理模板删除
  const handleDeleteTemplate = (templateId: string) => {
    const success = templateService.deleteTemplate(templateId);
    if (success) {
      setTemplates(templateService.getAllTemplates());
      toast.success('模板已删除');
      setShowModal(false);
    } else {
      toast.error('无法删除官方模板');
    }
  };

  // 处理创建模板
  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('模板名称和内容不能为空');
      return;
    }

    const created = templateService.createTemplate(newTemplate);
    setTemplates(templateService.getAllTemplates());
    setShowCreateModal(false);
    setNewTemplate({
      name: '',
      description: '',
      content: '',
      tags: [],
      category: '其他',
      isOfficial: false
    });
    setTagInput('');
    toast.success('模板创建成功');
  };

  // 处理添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !newTemplate.tags.includes(tag)) {
      setNewTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  // 处理删除标签
  const handleRemoveTag = (tag: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className={`p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">创作模板库</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            浏览和使用模板，快速开始你的创作
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <i className="fas fa-plus mr-2"></i>创建模板
          </button>
        )}
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* 分类筛选 */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">分类筛选</label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory('全部')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === '全部' ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              全部
            </button>
            {TEMPLATE_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === category ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">搜索模板</label>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索模板名称、描述或标签"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">排序方式</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortOption('latest')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${sortOption === 'latest' ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              最新
            </button>
            <button
              onClick={() => setSortOption('popular')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${sortOption === 'popular' ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              热门
            </button>
            <button
              onClick={() => setSortOption('featured')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${sortOption === 'featured' ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              精选
            </button>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      {filteredTemplates.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <i className="fas fa-search text-4xl mb-4"></i>
          <h3 className="text-lg font-medium mb-2">未找到模板</h3>
          <p>尝试调整筛选条件或搜索词</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              className={`rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border cursor-pointer`}
              whileHover={{ y: -4 }}
              onClick={() => handleSelectTemplate(template)}
            >
              {/* 模板缩略图 */}
              {template.thumbnail && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  {template.isOfficial && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      官方模板
                    </div>
                  )}
                </div>
              )}

              {/* 模板信息 */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base">{template.name}</h3>
                  <div className="flex items-center gap-2">
                    {template.isFeatured && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-white`}>
                        精选
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
                  <span>使用次数：{template.usageCount}</span>
                  <span>版本：{template.version}</span>
                  {template.rating && (
                    <span>评分：{template.rating.toFixed(1)} ⭐</span>
                  )}
                  <span>语言：{template.language}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {template.useCases.slice(0, 3).map((useCase, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {useCase}
                    </span>
                  ))}
                  {template.useCases.length > 3 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      +{template.useCases.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{template.author || (template.isOfficial ? '官方模板' : '用户模板')}</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 模板详情模态框 */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className={`rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 模态框头部 */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">模板详情</h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">模板名称</h4>
                <p>{selectedTemplate.name}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">描述</h4>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{selectedTemplate.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold mb-2">分类</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {selectedTemplate.category}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">版本</h4>
                  <p>{selectedTemplate.version}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">语言</h4>
                  <p>{selectedTemplate.language}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">评分</h4>
                  <p>{selectedTemplate.rating ? `${selectedTemplate.rating.toFixed(1)} ⭐` : '暂无评分'}</p>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">适用场景</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.useCases.map((useCase, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-700' : 'bg-blue-100'} ${isDark ? 'text-blue-200' : 'text-blue-800'}`}
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">模板内容</h4>
                <pre className={`p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-sm`}>
                  {selectedTemplate.content}
                </pre>
              </div>
              {selectedTemplate.config && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">模型配置</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">模型</p>
                      <p>{selectedTemplate.config.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">温度</p>
                      <p>{selectedTemplate.config.temperature}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Top P</p>
                      <p>{selectedTemplate.config.top_p}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">最大令牌数</p>
                      <p>{selectedTemplate.config.max_tokens}</p>
                    </div>
                    {selectedTemplate.config.style && (
                      <div>
                        <p className="text-sm text-gray-500">风格</p>
                        <p>{selectedTemplate.config.style}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">使用信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">创建时间</p>
                    <p>{new Date(selectedTemplate.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">更新时间</p>
                    <p>{new Date(selectedTemplate.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">使用次数</p>
                    <p>{selectedTemplate.usageCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">类型</p>
                    <p>{selectedTemplate.isOfficial ? '官方模板' : '用户模板'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">作者</p>
                    <p>{selectedTemplate.author || (selectedTemplate.isOfficial ? '官方模板' : '用户')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">精选</p>
                    <p>{selectedTemplate.isFeatured ? '是' : '否'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-gray-700">
              {/* 评分功能 */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">评分</h4>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateTemplate(selectedTemplate.id, star)}
                      className={`text-2xl transition-colors ${selectedTemplate.rating && star <= selectedTemplate.rating ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                  <span className="ml-2 text-sm">
                    {selectedTemplate.rating ? `${selectedTemplate.rating.toFixed(1)} ⭐` : '暂无评分'}
                  </span>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end gap-3">
                {!selectedTemplate.isOfficial && (
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                  >
                    删除模板
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  关闭
                </button>
                <button
                  onClick={() => handleDownloadTemplate(selectedTemplate)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  <i className="fas fa-download mr-2"></i>下载模板
                </button>
                <button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  使用模板
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 创建模板模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className={`rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 模态框头部 */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">创建模板</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">模板名称</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="请输入模板名称"
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模板描述</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="请输入模板描述"
                  rows={2}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模板内容</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="请输入模板内容，支持换行"
                  rows={6}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">分类</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {TEMPLATE_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">语言</label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="zh-CN">中文</option>
                    <option value="en">英文</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">标签</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="输入标签，按回车添加"
                    className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTemplate.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">适用场景</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={useCaseInput}
                    onChange={(e) => setUseCaseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && useCaseInput.trim()) {
                        setNewTemplate(prev => ({
                          ...prev,
                          useCases: [...prev.useCases, useCaseInput.trim()]
                        }));
                        setUseCaseInput('');
                      }
                    }}
                    placeholder="输入适用场景，按回车添加"
                    className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={() => {
                      if (useCaseInput.trim()) {
                        setNewTemplate(prev => ({
                          ...prev,
                          useCases: [...prev.useCases, useCaseInput.trim()]
                        }));
                        setUseCaseInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTemplate.useCases.map((useCase, index) => (
                    <span
                      key={index}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-700' : 'bg-blue-100'} ${isDark ? 'text-blue-200' : 'text-blue-800'}`}
                    >
                      {useCase}
                      <button
                        onClick={() => {
                          setNewTemplate(prev => ({
                            ...prev,
                            useCases: prev.useCases.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模型配置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">模型</label>
                    <select
                      value={newTemplate.config?.model || 'doubao-pro-32k'}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          model: e.target.value
                        }
                      }))}
                      className={`w-full px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="doubao-pro-32k">豆包 Pro 32K</option>
                      <option value="kimi">Kimi</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">温度</label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={newTemplate.config?.temperature || 0.7}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          temperature: parseFloat(e.target.value)
                        }
                      }))}
                      className={`w-full px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Top P</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={newTemplate.config?.top_p || 0.9}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          top_p: parseFloat(e.target.value)
                        }
                      }))}
                      className={`w-full px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">最大令牌数</label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      step="100"
                      value={newTemplate.config?.max_tokens || 2000}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          max_tokens: parseInt(e.target.value)
                        }
                      }))}
                      className={`w-full px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                取消
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                创建模板
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
