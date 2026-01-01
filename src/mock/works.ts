export type Work = {
  id: number;
  title: string;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: number;
  category: string;
  tags: string[];
  featured: boolean;
  description?: string;
  videoUrl?: string;
  duration?: string;
  imageTag?: string;
  modelUrl?: string;
};

export const mockWorks: Work[] = [
  {
    id: 1,
    title: '国潮新风尚',
    creator: '设计师小明',
    creatorAvatar: 'https://picsum.photos/100/100',
    thumbnail: 'https://picsum.photos/800/600',
    likes: 245,
    comments: 32,
    views: 1240,
    category: '国潮设计',
    tags: ['国潮', '时尚', '现代'],
    featured: true,
    imageTag: 'unsplash',
  },
  {
    id: 2,
    title: '传统纹样创新',
    creator: '创意总监小李',
    creatorAvatar: 'https://picsum.photos/100/100?random=1',
    thumbnail: 'https://picsum.photos/800/600?random=2',
    likes: 189,
    comments: 21,
    views: 980,
    category: '纹样设计',
    tags: ['传统', '纹样', '创新'],
    featured: false,
  },
  {
    id: 3,
    title: '老字号品牌焕新',
    creator: '品牌设计师老王',
    creatorAvatar: 'https://picsum.photos/100/100?random=3',
    thumbnail: 'https://picsum.photos/800/600?random=4',
    likes: 324,
    comments: 45,
    views: 1870,
    category: '品牌设计',
    tags: ['老字号', '品牌', '焕新'],
    featured: true,
  },
  {
    id: 4,
    title: 'AI助力非遗传承',
    creator: '数字艺术家小张',
    creatorAvatar: 'https://picsum.photos/100/100?random=5',
    thumbnail: 'https://picsum.photos/800/600?random=6',
    likes: 276,
    comments: 38,
    views: 1450,
    category: '非遗传承',
    tags: ['AI', '非遗', '传承'],
    featured: false,
  },
  {
    id: 5,
    title: '东方美学插画',
    creator: '插画师小陈',
    creatorAvatar: 'https://picsum.photos/100/100?random=7',
    thumbnail: 'https://picsum.photos/800/600?random=8',
    likes: 412,
    comments: 56,
    views: 2100,
    category: '插画设计',
    tags: ['东方', '美学', '插画'],
    featured: true,
  },
  {
    id: 6,
    title: '传统工艺数字化',
    creator: '数字设计师小刘',
    creatorAvatar: 'https://picsum.photos/100/100?random=9',
    thumbnail: 'https://picsum.photos/800/600?random=10',
    likes: 198,
    comments: 24,
    views: 980,
    category: '工艺创新',
    tags: ['传统工艺', '数字化', '创新'],
    featured: false,
  },
  {
    id: 7,
    title: '十八街麻花包装焕新',
    creator: '品牌设计师阿宁',
    creatorAvatar: 'https://picsum.photos/100/100?random=11',
    thumbnail: 'https://picsum.photos/800/600?random=12',
    likes: 256,
    comments: 28,
    views: 1320,
    category: '老字号品牌',
    tags: ['桂发祥', '包装设计', '焕新'],
    featured: true,
  },
  {
    id: 8,
    title: '狗不理联名海报',
    creator: '视觉设计师小谷',
    creatorAvatar: 'https://picsum.photos/100/100?random=13',
    thumbnail: 'https://picsum.photos/800/600?random=14',
    likes: 198,
    comments: 19,
    views: 980,
    category: '老字号品牌',
    tags: ['狗不理', '海报', '联名'],
    featured: false,
  },
  {
    id: 9,
    title: '耳朵眼炸糕IP形象',
    creator: '插画师小禾',
    creatorAvatar: 'https://picsum.photos/100/100?random=15',
    thumbnail: 'https://picsum.photos/800/600?random=16',
    likes: 312,
    comments: 41,
    views: 1760,
    category: 'IP设计',
    tags: ['耳朵眼', 'IP形象', '插画'],
    featured: true,
  },
  {
    id: 10,
    title: '果仁张秋季礼盒',
    creator: '创意总监阿川',
    creatorAvatar: 'https://picsum.photos/100/100?random=17',
    thumbnail: 'https://picsum.photos/800/600?random=18',
    likes: 224,
    comments: 27,
    views: 1128,
    category: '包装设计',
    tags: ['果仁张', '礼盒', '秋季'],
    featured: false,
  },
];

export default works;