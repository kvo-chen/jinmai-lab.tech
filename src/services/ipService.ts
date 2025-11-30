/**
 * IP孵化服务模块 - 提供IP孵化相关功能
 */

// IP资产类型定义
export interface IPAsset {
  id: string;
  name: string;
  description: string;
  type: 'illustration' | 'pattern' | 'design' | '3d_model' | 'digital_collectible';
  originalWorkId: string;
  stages: IPStage[];
  commercialValue: number;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
}

// IP孵化阶段类型定义
export interface IPStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

// 商业合作类型定义
export interface CommercialPartnership {
  id: string;
  brandName: string;
  brandLogo: string;
  description: string;
  reward: string;
  status: 'pending' | 'negotiating' | 'approved' | 'rejected';
  ipAssetId: string;
  createdAt: string;
  updatedAt: string;
}

// IP孵化服务类
class IPService {
  // 中文注释：本地持久化存储键名
  private ASSETS_KEY = 'jmzf_ip_assets'
  private PARTNERS_KEY = 'jmzf_partnerships'
  // 模拟IP资产数据
  private ipAssets: IPAsset[] = [
    {
      id: 'ip-001',
      name: '国潮插画系列',
      description: '融合传统中国元素与现代设计风格的插画系列',
      type: 'illustration',
      originalWorkId: 'work-001',
      stages: [
        { id: 'stage-1', name: '创意设计', description: '完成原创设计作品', completed: true, completedAt: '2025-11-01' },
        { id: 'stage-2', name: '版权存证', description: '完成作品版权存证', completed: true, completedAt: '2025-11-02' },
        { id: 'stage-3', name: 'IP孵化', description: '将设计转化为IP资产', completed: false },
        { id: 'stage-4', name: '商业合作', description: '对接品牌合作机会', completed: false },
        { id: 'stage-5', name: '收益分成', description: '获得作品收益分成', completed: false }
      ],
      commercialValue: 5000,
      createdAt: '2025-11-01',
      updatedAt: '2025-11-02',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=IP%20asset%20example%201'
    },
    {
      id: 'ip-002',
      name: '传统纹样创新',
      description: '基于传统纹样进行创新设计的图案集合',
      type: 'pattern',
      originalWorkId: 'work-002',
      stages: [
        { id: 'stage-1', name: '创意设计', description: '完成原创设计作品', completed: true, completedAt: '2025-10-25' },
        { id: 'stage-2', name: '版权存证', description: '完成作品版权存证', completed: true, completedAt: '2025-10-26' },
        { id: 'stage-3', name: 'IP孵化', description: '将设计转化为IP资产', completed: true, completedAt: '2025-10-30' },
        { id: 'stage-4', name: '商业合作', description: '对接品牌合作机会', completed: false },
        { id: 'stage-5', name: '收益分成', description: '获得作品收益分成', completed: false }
      ],
      commercialValue: 8000,
      createdAt: '2025-10-25',
      updatedAt: '2025-10-30',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=IP%20asset%20example%202'
    }
  ];

  // 模拟商业合作数据
  private partnerships: CommercialPartnership[] = [
    {
      id: 'partnership-001',
      brandName: '桂发祥',
      brandLogo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Brand%20logo%20example%201',
      description: '为桂发祥设计国潮风格包装',
      reward: '¥15,000',
      status: 'negotiating',
      ipAssetId: 'ip-001',
      createdAt: '2025-11-05',
      updatedAt: '2025-11-07'
    }
  ];

  constructor() {
    // 中文注释：初始化时尝试从localStorage加载数据
    try {
      const assetsRaw = localStorage.getItem(this.ASSETS_KEY)
      if (assetsRaw) this.ipAssets = JSON.parse(assetsRaw)
      const partnersRaw = localStorage.getItem(this.PARTNERS_KEY)
      if (partnersRaw) this.partnerships = JSON.parse(partnersRaw)
    } catch {}
  }

  private saveAssets() {
    try { localStorage.setItem(this.ASSETS_KEY, JSON.stringify(this.ipAssets)) } catch {}
  }

  private savePartnerships() {
    try { localStorage.setItem(this.PARTNERS_KEY, JSON.stringify(this.partnerships)) } catch {}
  }

  // 获取所有IP资产
  getAllIPAssets(): IPAsset[] {
    return [...this.ipAssets];
  }

  // 获取单个IP资产
  getIPAssetById(id: string): IPAsset | undefined {
    return this.ipAssets.find(asset => asset.id === id);
  }

  // 创建新的IP资产
  createIPAsset(asset: Omit<IPAsset, 'id' | 'createdAt' | 'updatedAt'>): IPAsset {
    const newAsset: IPAsset = {
      ...asset,
      id: `ip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.ipAssets.push(newAsset);
    this.saveAssets();
    return newAsset;
  }

  // 更新IP资产阶段
  updateIPStage(ipId: string, stageId: string, completed: boolean): boolean {
    const asset = this.getIPAssetById(ipId);
    if (asset) {
      const stage = asset.stages.find(s => s.id === stageId);
      if (stage) {
        stage.completed = completed;
        if (completed && !stage.completedAt) {
          stage.completedAt = new Date().toISOString();
        }
        asset.updatedAt = new Date().toISOString();
        this.saveAssets();
        return true;
      }
    }
    return false;
  }

  // 获取所有商业合作
  getAllPartnerships(): CommercialPartnership[] {
    return [...this.partnerships];
  }

  // 获取与特定IP相关的商业合作
  getPartnershipsByIPId(ipId: string): CommercialPartnership[] {
    return this.partnerships.filter(partnership => partnership.ipAssetId === ipId);
  }

  // 创建新的商业合作申请
  createPartnership(partnership: Omit<CommercialPartnership, 'id' | 'createdAt' | 'updatedAt'>): CommercialPartnership {
    const newPartnership: CommercialPartnership = {
      ...partnership,
      id: `partnership-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.partnerships.push(newPartnership);
    this.savePartnerships();
    return newPartnership;
  }

  // 更新商业合作状态
  updatePartnershipStatus(partnershipId: string, status: CommercialPartnership['status']): boolean {
    const partnership = this.partnerships.find(p => p.id === partnershipId);
    if (partnership) {
      partnership.status = status;
      partnership.updatedAt = new Date().toISOString();
      this.savePartnerships();
      return true;
    }
    return false;
  }

  // 获取IP孵化统计
  getIPStats(): {
    totalAssets: number;
    completedAssets: number;
    inProgressAssets: number;
    totalPartnerships: number;
    activePartnerships: number;
    totalEstimatedValue: number;
  } {
    const completedAssets = this.ipAssets.filter(asset => 
      asset.stages.every(stage => stage.completed)
    ).length;
    
    const activePartnerships = this.partnerships.filter(
      partnership => partnership.status === 'pending' || partnership.status === 'negotiating'
    ).length;
    
    const totalEstimatedValue = this.ipAssets.reduce((sum, asset) => sum + asset.commercialValue, 0);
    
    return {
      totalAssets: this.ipAssets.length,
      completedAssets,
      inProgressAssets: this.ipAssets.length - completedAssets,
      totalPartnerships: this.partnerships.length,
      activePartnerships,
      totalEstimatedValue
    };
  }
}

// 导出单例实例
export default new IPService();
