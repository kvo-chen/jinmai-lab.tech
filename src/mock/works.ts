// 模拟作品数据

export interface Work {
  id: number;
  title: string;
  thumbnail: string;
  creator: string;
  creatorAvatar: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  featured: boolean;
  description?: string;
  videoUrl?: string;
}

// 基础作品列表
export const mockWorks: Work[] = [
  {
    id: 1,
    title: '天津卫传统纹样',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20traditional%20pattern%20design%20with%20red%20and%20gold%20colors',
    creator: '设计师小王',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=professional%20avatar%20designer',
    category: '纹样设计',
    tags: ['传统纹样', '天津卫', '国潮设计'],
    likes: 120,
    comments: 25,
    views: 500,
    featured: true,
    description: '天津卫传统纹样设计，融合了天津本地文化元素和现代设计风格'
  },
  {
    id: 2,
    title: '老字号品牌焕新',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=traditional%20brand%20redesign%20with%20modern%20style',
    creator: '创意达人',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=creative%20director%20avatar',
    category: '品牌设计',
    tags: ['老字号品牌', '品牌焕新', '国潮设计'],
    likes: 95,
    comments: 18,
    views: 380,
    featured: true,
    description: '老字号品牌焕新设计，保留传统元素的同时注入现代活力'
  },
  {
    id: 3,
    title: '非遗传承插画',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=intangible%20cultural%20heritage%20illustration%20traditional%20Chinese%20style',
    creator: '插画师小李',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=illustrator%20avatar',
    category: '插画设计',
    tags: ['非遗传承', '插画设计', '传统文化'],
    likes: 156,
    comments: 32,
    views: 620,
    featured: true,
    description: '非遗传承插画，展现中国传统文化的魅力'
  },
  {
    id: 4,
    title: '国潮包装设计',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=chinese%20trend%20packaging%20design%20with%20traditional%20elements',
    creator: '包装设计师',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=packaging%20designer%20avatar',
    category: '包装设计',
    tags: ['国潮设计', '包装设计', '品牌设计'],
    likes: 89,
    comments: 15,
    views: 350,
    featured: true,
    description: '国潮包装设计，融合传统元素与现代包装美学'
  },
  {
    id: 5,
    title: 'IP形象设计',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=cartoon%20IP%20character%20design%20chinese%20style',
    creator: 'IP设计师',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=character%20designer%20avatar',
    category: 'IP设计',
    tags: ['IP设计', '卡通形象', '品牌设计'],
    likes: 112,
    comments: 22,
    views: 480,
    featured: true,
    description: 'IP形象设计，塑造独特的品牌视觉标识'
  },
  {
    id: 6,
    title: '工艺创新设计',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=traditional%20craft%20innovation%20design%20modern%20style',
    creator: '工艺设计师',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=craft%20designer%20avatar',
    category: '工艺创新',
    tags: ['工艺创新', '传统工艺', '设计创新'],
    likes: 78,
    comments: 14,
    views: 320,
    featured: true,
    description: '工艺创新设计，将传统工艺与现代设计相结合'
  }
];
