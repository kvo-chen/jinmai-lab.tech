import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 天津非遗技艺类型定义
interface IntangibleHeritage {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  thumbnail: string;
  category: string;
  history?: string;
}

// 天津地域符号类型定义
interface TianjinSymbol {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  image: string;
  category: string;
  history?: string;
}

// 天津方言类型定义
interface TianjinDialect {
  id: number;
  phrase: string;
  pronunciation: string;
  meaning: string;
  usage: string;
  example?: string;
}

// 模态框数据类型
type ModalData = IntangibleHeritage | TianjinSymbol | TianjinDialect;

// 详情模态框组件
function DetailModal({
  isOpen,
  onClose,
  data,
  isDark,
  isFavorite,
  toggleFavorite
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ModalData | null;
  isDark: boolean;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => void;
}) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
        >
          <i className="fas fa-times"></i>
        </button>

        {/* 模态框内容 */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 左侧图片 */}
          {'thumbnail' in data || 'image' in data && (
            <div className="h-80 overflow-hidden">
              <img
                src={('thumbnail' in data ? data.thumbnail : data.image) as string}
                alt={data.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* 右侧内容 */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">
              {('phrase' in data ? data.phrase : data.name)}
            </h2>
            
            {/* 分类/发音 */}
            <div className="mb-4">
              {('category' in data && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                  {data.category}
                </span>
              )) || ('pronunciation' in data && (
                <div className="text-sm text-gray-500">
                  发音：{data.pronunciation}
                </div>
              ))}
            </div>

            {/* 描述 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-1">{isDark ? '简介' : 'Description'}:</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {'phrase' in data ? data.meaning : data.description}
              </p>
            </div>

            {/* 详细描述/用法 */}
            {('detailedDescription' in data && data.detailedDescription) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">详细描述:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.detailedDescription}
                </p>
              </div>
            )}

            {/* 历史/示例 */}
            {('history' in data && data.history) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">历史:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.history}
                </p>
              </div>
            )}

            {('usage' in data && data.usage) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">用法:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.usage}
                </p>
              </div>
            )}

            {('example' in data && data.example) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">示例:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  {data.example}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-6">
              <button 
                className={`flex-1 py-2 rounded-lg transition-colors ${isFavorite(data.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                onClick={() => toggleFavorite(data.id)}
              >
                <i className={`fas ${isFavorite(data.id) ? 'fa-heart' : 'fa-heart'} mr-2`}></i>
                {isFavorite(data.id) ? '已收藏' : '收藏'}
              </button>
              <button className="flex-1 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors">
                <i className="fas fa-share-alt mr-2"></i> 分享
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 非遗技艺卡片组件
function HeritageCard({ heritage, isDark, onOpenModal, isFavorite, toggleFavorite }: { heritage: IntangibleHeritage; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={heritage.id}
      className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'}`}
      whileHover={{ y: -5, scale: 1.02, boxShadow: isDark ? '0 10px 30px -5px rgba(0, 0, 0, 0.5)' : '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img 
          src={heritage.thumbnail} 
          alt={heritage.name} 
          className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className={`text-xs px-2 py-1 rounded-full bg-blue-600 text-white`}>
            {heritage.category}
          </span>
        </div>
        {/* 收藏按钮 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(heritage.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${isFavorite(heritage.id) ? 'bg-red-600/80 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white shadow-md'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.i 
            className={`fas ${isFavorite(heritage.id) ? 'fa-heart' : 'fa-heart'}`}
            animate={{ 
              scale: isFavorite(heritage.id) ? [1, 1.2, 1] : 1,
              color: isFavorite(heritage.id) ? '#ef4444' : 'inherit'
            }}
            transition={{ duration: 0.3 }}
          ></motion.i>
        </motion.button>
      </div>
      <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`} onClick={() => onOpenModal(heritage)}>
        <h4 className="font-bold mb-2">{heritage.name}</h4>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {heritage.description}
        </p>
        <button className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
          应用此素材
        </button>
      </div>
    </motion.div>
  );
}

// 地域符号卡片组件
function SymbolCard({ symbol, isDark, onOpenModal, isFavorite, toggleFavorite }: { symbol: TianjinSymbol; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={symbol.id}
      className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'}`}
      whileHover={{ y: -5, scale: 1.02, boxShadow: isDark ? '0 10px 30px -5px rgba(0, 0, 0, 0.5)' : '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img 
          src={symbol.image} 
          alt={symbol.name} 
          className="w-full h-40 object-cover transition-transform duration-500 hover:scale-105" 
          loading="lazy"
        />
        {/* 收藏按钮 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(symbol.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${isFavorite(symbol.id) ? 'bg-red-600/80 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white shadow-md'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.i 
            className={`fas ${isFavorite(symbol.id) ? 'fa-heart' : 'fa-heart'}`}
            animate={{ 
              scale: isFavorite(symbol.id) ? [1, 1.2, 1] : 1,
              color: isFavorite(symbol.id) ? '#ef4444' : 'inherit'
            }}
            transition={{ duration: 0.3 }}
          ></motion.i>
        </motion.button>
      </div>
      <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`} onClick={() => onOpenModal(symbol)}>
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium">{symbol.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
            {symbol.category}
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {symbol.description}
        </p>
      </div>
    </motion.div>
  );
}

// 天津方言卡片组件
function DialectCard({ dialect, isDark, onOpenModal, isFavorite, toggleFavorite }: { dialect: TianjinDialect; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={dialect.id}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-650 hover:border-blue-500' : 'bg-gray-50 hover:bg-gray-100 hover:border-blue-500'} border`}
      whileHover={{ scale: 1.01, boxShadow: isDark ? '0 8px 25px -5px rgba(0, 0, 0, 0.4)' : '0 8px 25px -5px rgba(0, 0, 0, 0.08)' }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div onClick={() => onOpenModal(dialect)}>
          <h4 className="font-bold text-lg mb-1">{dialect.phrase}</h4>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            发音：{dialect.pronunciation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 收藏按钮 */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(dialect.id);
            }}
            className={`p-2 rounded-full transition-all duration-300 ${isFavorite(dialect.id) ? 'bg-red-600 text-white shadow-lg' : isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.i 
              className={`fas ${isFavorite(dialect.id) ? 'fa-heart' : 'fa-heart'}`}
              animate={{ 
                scale: isFavorite(dialect.id) ? [1, 1.2, 1] : 1,
                color: isFavorite(dialect.id) ? '#ef4444' : 'inherit'
              }}
              transition={{ duration: 0.3 }}
            ></motion.i>
          </motion.button>
          <button 
            className={`p-2 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fas fa-volume-up"></i>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" onClick={() => onOpenModal(dialect)}>
        <div>
          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            含义
          </h5>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {dialect.meaning}
          </p>
        </div>
        <div>
          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            用法
          </h5>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {dialect.usage}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TianjinCulturalAssets() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'heritage' | 'symbols' | 'dialect'>('heritage');
  const [isLoading, setIsLoading] = useState(true);
  
  // 模拟数据加载
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);
  const [error, setError] = useState<string | null>(null);
  
  // 模态框状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  
  // 打开详情模态框
  const openModal = (data: ModalData) => {
    setModalData(data);
    setIsModalOpen(true);
  };
  
  // 关闭详情模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalData(null);
    }, 200);
  };
  
  // 收藏状态管理
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // 初始化收藏状态
  useEffect(() => {
    // 从本地存储加载收藏数据
    const savedFavorites = localStorage.getItem('tianjinCulturalFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);
  
  // 保存收藏状态到本地存储
  useEffect(() => {
    localStorage.setItem('tianjinCulturalFavorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);
  
  // 切换收藏状态
  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };
  
  // 检查是否已收藏
  const isFavorite = (id: number) => {
    return favorites.has(id);
  };
  
  // 模拟天津非遗技艺数据
  const intangibleHeritages: IntangibleHeritage[] = [
    {
      id: 1,
      name: '杨柳青年画',
      description: '中国著名的民间木版年画，始于明代崇祯年间，与苏州桃花坞年画并称"南桃北柳"。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20Painting%20traditional%20Chinese%20folk%20art',
      category: '传统绘画'
    },
    {
      id: 2,
      name: '泥人张',
      description: '天津传统民间彩塑，创始于清代道光年间，以其形神兼备的艺术风格闻名中外。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20traditional%20clay%20sculpture%20art',
      category: '传统雕塑'
    },
    {
      id: 3,
      name: '风筝魏',
      description: '天津特色风筝制作技艺，创始于清代光绪年间，以其精巧的工艺和精美的画工著称。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20traditional%20kite%20making%20art',
      category: '传统工艺'
    },
    {
      id: 4,
      name: '天津面塑',
      description: '天津传统民间工艺，以糯米面为主料，通过手工捏制成各种形象，造型生动，色彩鲜艳。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20dough%20sculpture%20art',
      category: '传统雕塑'
    },
    {
      id: 5,
      name: '天津刻砖刘',
      description: '天津传统砖雕技艺，创始于清代光绪年间，以其精湛的雕刻技艺和独特的艺术风格著称。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Kezuanliu%20traditional%20brick%20carving%20art',
      category: '传统工艺'
    },
    {
      id: 6,
      name: '天津地毯织造技艺',
      description: '天津传统地毯织造工艺，历史悠久，以其精细的做工和精美的图案闻名于世。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20carpet%20weaving%20art',
      category: '传统工艺'
    },
    {
      id: 7,
      name: '天津宝坻评剧',
      description: '天津宝坻地区的传统戏曲剧种，具有浓郁的地方特色和独特的艺术风格。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Baodi%20Pingju%20traditional%20opera',
      category: '传统戏曲'
    },
    {
      id: 8,
      name: '天津时调',
      description: '天津传统民间曲艺形式，以其独特的唱腔和表演风格深受天津人民喜爱。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Shidiao%20traditional%20folk%20music',
      category: '传统音乐'
    },
    {
      id: 9,
      name: '天津京东大鼓',
      description: '天津传统曲艺形式，起源于河北，在天津得到发展和完善，具有独特的艺术魅力。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Jingdong%20Dagu%20traditional%20folk%20music',
      category: '传统音乐'
    }
  ];
  
  // 模拟天津地域符号数据
  const tianjinSymbols: TianjinSymbol[] = [
    {
      id: 1,
      name: '五大道建筑',
      description: '天津著名历史文化街区，保留了大量欧洲风格建筑，被誉为"万国建筑博览馆"。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Five%20Avenues%20historical%20buildings',
      category: '建筑景观'
    },
    {
      id: 2,
      name: '海河桥梁',
      description: '海河上的桥梁是天津城市景观的重要组成部分，每座桥都有其独特的设计和历史。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20bridges%20scenery',
      category: '城市地标'
    },
    {
      id: 3,
      name: '狗不理包子',
      description: '天津著名小吃，创始于清代光绪年间，以皮薄馅大、鲜香味美著称。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20steamed%20buns%20local%20food',
      category: '地方美食'
    },
    {
      id: 4,
      name: '桂发祥麻花',
      description: '天津传统特色小吃，酥脆香甜，风味独特，是天津的"三绝"之一。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20fried%20dough%20twists%20local%20food',
      category: '地方美食'
    },
    {
      id: 5,
      name: '耳朵眼炸糕',
      description: '天津传统特色小吃，外焦里嫩，香甜可口，是天津的"三绝"之一。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20fried%20cake%20local%20food',
      category: '地方美食'
    },
    {
      id: 6,
      name: '天津劝业场',
      description: '天津著名商业地标，始建于1928年，是天津商业文化的重要象征。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Quanye%20Department%20Store%20historical%20building',
      category: '商业地标'
    },
    {
      id: 7,
      name: '天津解放桥',
      description: '天津标志性桥梁，原名万国桥，建于1927年，是天津历史的重要见证。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Jiefang%20Bridge%20historical%20bridge',
      category: '城市地标'
    },
    {
      id: 8,
      name: '天津古文化街',
      description: '天津著名文化旅游景点，以传统民俗文化为特色，展现天津文化魅力。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20tourist%20spot',
      category: '文化景点'
    },
    {
      id: 9,
      name: '天津之眼摩天轮',
      description: '天津标志性建筑，世界上唯一建在桥上的摩天轮，是天津的"城市名片"。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Eye%20Ferris%20Wheel%20landmark',
      category: '城市地标'
    },
    {
      id: 10,
      name: '天津南开大学',
      description: '中国著名高等学府，创建于1919年，是天津教育文化的重要象征。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Nankai%20University%20campus%20scenery',
      category: '教育地标'
    },
    {
      id: 11,
      name: '天津相声',
      description: '天津传统曲艺形式，以幽默风趣的语言和独特的表演风格闻名全国。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20cross%20talk%20traditional%20comedy%20art',
      category: '民俗文化'
    }
  ];
  
  // 模拟天津方言数据
  const tianjinDialects: TianjinDialect[] = [
    {
      id: 1,
      phrase: '嘛呀',
      pronunciation: 'má ya',
      meaning: '什么',
      usage: '用于询问对方在做什么或表达惊讶'
    },
    {
      id: 2,
      phrase: '结界',
      pronunciation: 'jiē jie',
      meaning: '地方、区域',
      usage: '指某个特定的地方或范围'
    },
    {
      id: 3,
      phrase: '倍儿好',
      pronunciation: 'bèi er hǎo',
      meaning: '非常好、特别好',
      usage: '表示对某事物的高度评价'
    },
    {
      id: 4,
      phrase: '介似嘛',
      pronunciation: 'jiè shì má',
      meaning: '这是什么',
      usage: '用于询问不认识的事物'
    },
    {
      id: 5,
      phrase: '逗你玩儿',
      pronunciation: 'dòu nǐ wán ér',
      meaning: '开玩笑、逗乐',
      usage: '表示不是认真的，只是开个玩笑'
    },
    {
      id: 6,
      phrase: '恁么',
      pronunciation: 'nèn me',
      meaning: '怎么',
      usage: '用于询问方式、原因或状态'
    },
    {
      id: 7,
      phrase: '嘛玩意儿',
      pronunciation: 'má wán yì ér',
      meaning: '什么东西、什么事情',
      usage: '用于询问或表示不满'
    },
    {
      id: 8,
      phrase: '葛',
      pronunciation: 'gě',
      meaning: '古怪、不好相处',
      usage: '形容人的性格或行为奇特'
    },
    {
      id: 9,
      phrase: '捯饬',
      pronunciation: 'dáo chi',
      meaning: '打扮、整理',
      usage: '指精心打扮自己或整理物品'
    },
    {
      id: 10,
      phrase: '起腻',
      pronunciation: 'qǐ nì',
      meaning: '撒娇、纠缠',
      usage: '形容人撒娇或过度纠缠'
    },
    {
      id: 11,
      phrase: '褶子了',
      pronunciation: 'zhě zi le',
      meaning: '出问题了、麻烦了',
      usage: '表示事情遇到了困难或麻烦'
    },
    {
      id: 12,
      phrase: '嘛钱不钱的，乐呵乐呵得了',
      pronunciation: 'má qián bù qián de, lè hē lè hē dé le',
      meaning: '钱不重要，开心就好',
      usage: '表示对金钱的豁达态度'
    },
    {
      id: 13,
      phrase: '愣子',
      pronunciation: 'lèng zi',
      meaning: '傻瓜、愣头青',
      usage: '形容人做事冲动或不考虑后果'
    },
    {
      id: 14,
      phrase: '崴泥',
      pronunciation: 'wǎi ní',
      meaning: '麻烦了、糟糕了',
      usage: '表示事情变得严重或难以解决'
    },
    {
      id: 15,
      phrase: '耐人',
      pronunciation: 'nài rén',
      meaning: '可爱、讨人喜欢',
      usage: '形容人或事物让人喜爱'
    },
    {
      id: 16,
      phrase: '鼻儿等',
      pronunciation: 'bí ér děng',
      meaning: '等等',
      usage: '表示列举未尽或稍作等待'
    },
    {
      id: 17,
      phrase: '够戗',
      pronunciation: 'gòu qiàng',
      meaning: '够呛、难以承受',
      usage: '表示事情难度大或难以完成'
    },
    {
      id: 18,
      phrase: '干吗介',
      pronunciation: 'gàn má jiè',
      meaning: '干什么呢',
      usage: '用于询问对方的行为或意图'
    },
    {
      id: 19,
      phrase: '顺毛驴',
      pronunciation: 'shùn máo lǘ',
      meaning: '顺脾气、吃软不吃硬',
      usage: '形容人需要顺着性子来'
    },
    {
      id: 20,
      phrase: '倍儿哏儿',
      pronunciation: 'bèi er gén ér',
      meaning: '非常有趣、特别好笑',
      usage: '形容事物或人很有趣'
    }
  ];
  
  // 搜索和筛选状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // 获取非遗技艺分类列表
  const heritageCategories = Array.from(new Set(intangibleHeritages.map(item => item.category)));
  // 获取地域符号分类列表
  const symbolCategories = Array.from(new Set(tianjinSymbols.map(item => item.category)));
  
  // 过滤非遗技艺数据
  const filteredHeritages = intangibleHeritages.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  // 过滤地域符号数据
  const filteredSymbols = tianjinSymbols.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  // 过滤方言数据
  const filteredDialects = tianjinDialects.filter(item => {
    const matchesSearch = item.phrase.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.usage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <i className="fas fa-landmark text-blue-600 mr-2"></i>
        天津特色文化资产
      </h3>
      
      {/* 标签页切换 */}
      <div className="flex space-x-3 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'heritage', name: '非遗技艺' },
          { id: 'symbols', name: '地域符号' },
          { id: 'dialect', name: '天津方言' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as 'heritage' | 'symbols' | 'dialect');
              setFilterCategory('all'); // 切换标签时重置筛选
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* 搜索和筛选区域 */}
      <div className="mb-6">
        {/* 搜索输入框 */}
        <div className="mb-4">
          <div className={`relative rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <i className={`fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
            <input
              type="text"
              placeholder={`搜索${activeTab === 'heritage' ? '非遗技艺' : activeTab === 'symbols' ? '地域符号' : '天津方言'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        
        {/* 分类筛选 */}
        {activeTab !== 'dialect' && (
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === 'all' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              全部
            </button>
            {(activeTab === 'heritage' ? heritageCategories : symbolCategories).map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === category ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 非遗技艺内容 */}
      {activeTab === 'heritage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredHeritages.length > 0 ? (
            filteredHeritages.map((heritage) => (
              <HeritageCard 
                key={heritage.id} 
                heritage={heritage} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的非遗技艺</p>
              <p className="text-sm mt-2">尝试调整搜索条件或筛选类别</p>
            </div>
          )}
        </div>
      )}
      
      {/* 地域符号内容 */}
      {activeTab === 'symbols' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((symbol) => (
              <SymbolCard 
                key={symbol.id} 
                symbol={symbol} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的地域符号</p>
              <p className="text-sm mt-2">尝试调整搜索条件或筛选类别</p>
            </div>
          )}
        </div>
      )}
      
      {/* 天津方言内容 */}
      {activeTab === 'dialect' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredDialects.length > 0 ? (
            filteredDialects.map((dialect) => (
              <DialectCard 
                key={dialect.id} 
                dialect={dialect} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的天津方言</p>
              <p className="text-sm mt-2">尝试调整搜索条件</p>
            </div>
          )}
        </div>
      )}
      
      {/* 详情模态框 */}
      <DetailModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={modalData} 
        isDark={isDark} 
        isFavorite={isFavorite} 
        toggleFavorite={toggleFavorite} 
      />
    </motion.div>
  );
}
