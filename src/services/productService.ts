/**
 * 商品服务 - 提供商品管理和积分兑换功能
 */

// 导入积分服务
import pointsService from './pointsService';

// 商品类型定义
export interface Product {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  status: 'active' | 'inactive' | 'sold_out';
  category: string;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 兑换记录类型定义
export interface ExchangeRecord {
  id: number;
  productId: number;
  productName: string;
  points: number;
  date: string;
  userId: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// 商品分类类型
export type ProductCategory = 'virtual' | 'physical' | 'service' | 'rights';

// 商品服务类
class ProductService {
  private readonly PRODUCTS_KEY = 'SECURE_PRODUCTS';
  private readonly EXCHANGE_RECORDS_KEY = 'SECURE_EXCHANGE_RECORDS';
  private products: Product[] = [];
  private exchangeRecords: ExchangeRecord[] = [];

  constructor() {
    this.loadProducts();
    this.loadExchangeRecords();
  }

  /**
   * 从本地存储加载商品数据
   */
  private loadProducts() {
    try {
      const stored = localStorage.getItem(this.PRODUCTS_KEY);
      if (stored) {
        this.products = JSON.parse(stored);
      } else {
        // 初始化默认商品数据
        this.products = [
          {
            id: 1,
            name: '虚拟红包',
            description: '1000积分兑换10元虚拟红包',
            points: 1000,
            stock: 100,
            status: 'active',
            category: 'virtual',
            tags: ['红包', '虚拟'],
            imageUrl: 'https://via.placeholder.com/200x200?text=红包',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: '创意贴纸包',
            description: '500积分兑换创意贴纸包',
            points: 500,
            stock: 50,
            status: 'active',
            category: 'virtual',
            tags: ['贴纸', '虚拟'],
            imageUrl: 'https://via.placeholder.com/200x200?text=贴纸包',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 3,
            name: 'AI创作工具包',
            description: '2000积分兑换高级AI创作工具包',
            points: 2000,
            stock: 30,
            status: 'active',
            category: 'service',
            tags: ['AI工具', '服务'],
            imageUrl: 'https://via.placeholder.com/200x200?text=AI工具包',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 4,
            name: '专属成就徽章',
            description: '1500积分兑换专属成就徽章',
            points: 1500,
            stock: 100,
            status: 'active',
            category: 'rights',
            tags: ['徽章', '权益'],
            imageUrl: 'https://via.placeholder.com/200x200?text=成就徽章',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 5,
            name: '实体创意笔记本',
            description: '3000积分兑换实体创意笔记本',
            points: 3000,
            stock: 20,
            status: 'active',
            category: 'physical',
            tags: ['笔记本', '实体'],
            imageUrl: 'https://via.placeholder.com/200x200?text=笔记本',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this.saveProducts();
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = [];
    }
  }

  /**
   * 保存商品数据到本地存储
   */
  private saveProducts() {
    try {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(this.products));
    } catch (error) {
      console.error('Failed to save products:', error);
    }
  }

  /**
   * 从本地存储加载兑换记录
   */
  private loadExchangeRecords() {
    try {
      const stored = localStorage.getItem(this.EXCHANGE_RECORDS_KEY);
      if (stored) {
        this.exchangeRecords = JSON.parse(stored);
      } else {
        this.exchangeRecords = [];
        this.saveExchangeRecords();
      }
    } catch (error) {
      console.error('Failed to load exchange records:', error);
      this.exchangeRecords = [];
    }
  }

  /**
   * 保存兑换记录到本地存储
   */
  private saveExchangeRecords() {
    try {
      localStorage.setItem(this.EXCHANGE_RECORDS_KEY, JSON.stringify(this.exchangeRecords));
    } catch (error) {
      console.error('Failed to save exchange records:', error);
    }
  }

  /**
   * 获取所有商品
   */
  getAllProducts(): Product[] {
    return [...this.products];
  }

  /**
   * 根据ID获取商品
   */
  getProductById(id: number): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  /**
   * 获取用户兑换记录
   */
  getUserExchangeRecords(userId: string = 'current-user'): ExchangeRecord[] {
    return [...this.exchangeRecords].filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 兑换商品
   */
  exchangeProduct(productId: number, userId: string = 'current-user'): ExchangeRecord {
    // 查找商品
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    // 检查商品状态
    if (product.status !== 'active') {
      throw new Error('商品不可用');
    }

    // 检查库存
    if (product.stock <= 0) {
      throw new Error('商品已售罄');
    }

    // 获取当前用户积分
    const currentPoints = pointsService.getCurrentPoints();
    if (currentPoints < product.points) {
      throw new Error('积分不足');
    }

    // 消耗积分
    pointsService.consumePoints(
      product.points,
      '积分商城',
      'exchange',
      `兑换商品：${product.name}`,
      `product_${productId}`
    );

    // 更新商品库存
    product.stock -= 1;
    if (product.stock === 0) {
      product.status = 'sold_out';
    }
    product.updatedAt = new Date().toISOString();
    this.saveProducts();

    // 创建兑换记录
    const newRecord: ExchangeRecord = {
      id: this.exchangeRecords.length + 1,
      productId: product.id,
      productName: product.name,
      points: product.points,
      date: new Date().toISOString(),
      userId,
      status: 'completed'
    };

    this.exchangeRecords.push(newRecord);
    this.saveExchangeRecords();

    return newRecord;
  }

  /**
   * 添加商品（管理员功能）
   */
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.products.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.push(newProduct);
    this.saveProducts();

    return newProduct;
  }

  /**
   * 更新商品（管理员功能）
   */
  updateProduct(id: number, updates: Partial<Product>): Product | undefined {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return undefined;
    }

    const updatedProduct: Product = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updatedProduct;
    this.saveProducts();

    return updatedProduct;
  }

  /**
   * 删除商品（管理员功能）
   */
  deleteProduct(id: number): boolean {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    
    if (this.products.length < initialLength) {
      this.saveProducts();
      return true;
    }
    return false;
  }
}

// 导出单例实例
const service = new ProductService();
export default service;