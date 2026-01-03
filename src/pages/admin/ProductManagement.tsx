import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import productService, { Product } from '@/services/productService';
import { toast } from 'sonner';

const ProductManagement: React.FC = () => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: 0,
    stock: 0,
    status: 'active' as 'active' | 'inactive' | 'sold_out',
    category: 'virtual',
    tags: [] as string[],
    imageUrl: ''
  });

  // 加载商品数据
  useEffect(() => {
    const allProducts = productService.getAllProducts();
    setProducts(allProducts);
  }, []);

  // 重置商品数据
  const handleResetProducts = () => {
    if (window.confirm('确定要重置所有商品数据到默认值吗？这将清除所有自定义的商品。')) {
      productService.resetProducts();
      const allProducts = productService.getAllProducts();
      setProducts(allProducts);
      toast.success('商品数据已重置');
    }
  };

  // 打开添加商品模态框
  const handleAddProduct = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      points: 0,
      stock: 0,
      status: 'active',
      category: 'virtual',
      tags: [],
      imageUrl: ''
    });
    setShowModal(true);
  };

  // 打开编辑商品模态框
  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      points: product.points,
      stock: product.stock,
      status: product.status,
      category: product.category,
      tags: [...product.tags],
      imageUrl: product.imageUrl
    });
    setShowModal(true);
  };

  // 保存商品
  const handleSaveProduct = () => {
    try {
      if (isEditing && selectedProduct) {
        // 编辑商品
        const updatedProduct = productService.updateProduct(selectedProduct.id, formData);
        if (updatedProduct) {
          setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
          toast.success('商品更新成功');
        } else {
          toast.error('商品更新失败');
        }
      } else {
        // 添加商品
        const newProduct = productService.addProduct(formData);
        setProducts([...products, newProduct]);
        toast.success('商品添加成功');
      }
      setShowModal(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // 删除商品
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('确定要删除该商品吗？')) {
      const success = productService.deleteProduct(productId);
      if (success) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('商品删除成功');
      } else {
        toast.error('商品删除失败');
      }
    }
  };

  // 切换商品状态
  const toggleProductStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const updatedProduct = productService.updateProduct(product.id, { status: newStatus });
    if (updatedProduct) {
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      toast.success(`商品已${newStatus === 'active' ? '上架' : '下架'}`);
    }
  };

  // 处理标签输入
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const newTag = value.split(',')[0].trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      e.target.value = '';
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">商品管理</h1>
          <button
            onClick={handleAddProduct}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>添加商品
          </button>
        </div>

        {/* 商品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'} text-red-500`}>
                    {product.points} 积分
                  </span>
                </div>
                <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    库存：{product.stock}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.status === 'active' ? '已上架' : '已下架'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    <i className="fas fa-edit mr-1"></i>编辑
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product)}
                    className={`flex-1 ${product.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-lg text-sm transition-colors`}
                  >
                    {product.status === 'active' ? '下架' : '上架'}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    <i className="fas fa-trash mr-1"></i>删除
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 无商品提示 */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">暂无商品</h3>
            <p className="opacity-70">点击上方按钮添加新商品</p>
          </div>
        )}

        {/* 商品模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditing ? '编辑商品' : '添加商品'}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">商品名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">所需积分</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">库存数量</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">商品分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      required
                    >
                      <option value="virtual">虚拟商品</option>
                      <option value="physical">实物商品</option>
                      <option value="service">服务</option>
                      <option value="rights">权益</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">商品状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'sold_out' })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      required
                    >
                      <option value="active">已上架</option>
                      <option value="inactive">已下架</option>
                      <option value="sold_out">已售罄</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">商品图片URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">商品描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">商品标签（逗号分隔）</label>
                  <input
                    type="text"
                    placeholder="输入标签并按逗号分隔"
                    onBlur={handleTagInput}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center`}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isEditing ? '保存修改' : '添加商品'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;