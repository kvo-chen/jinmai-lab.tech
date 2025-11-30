import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 天津非遗技艺类型定义
interface IntangibleHeritage {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

// 天津地域符号类型定义
interface TianjinSymbol {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
}

// 天津方言类型定义
interface TianjinDialect {
  id: number;
  phrase: string;
  pronunciation: string;
  meaning: string;
  usage: string;
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
    }
  ];
  
  // 骨架屏加载状态
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
            onClick={() => setActiveTab(tab.id as 'heritage' | 'symbols' | 'dialect')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* 非遗技艺内容 */}
      {activeTab === 'heritage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {intangibleHeritages.map((heritage) => (
            <motion.div
              key={heritage.id}
              className={`rounded-xl overflow-hidden shadow-md border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              whileHover={{ y: -5 }}
            >
              <div className="relative">
                <img 
                  src={heritage.thumbnail} 
                  alt={heritage.name} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <span className={`text-xs px-2 py-1 rounded-full bg-blue-600 text-white`}>
                    {heritage.category}
                  </span>
                </div>
              </div>
              <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <h4 className="font-bold mb-2">{heritage.name}</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {heritage.description}
                </p>
                <button className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
                  应用此素材
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 地域符号内容 */}
      {activeTab === 'symbols' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tianjinSymbols.map((symbol) => (
            <motion.div
              key={symbol.id}
              className={`rounded-xl overflow-hidden shadow-md border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } cursor-pointer`}
              whileHover={{ y: -5 }}
            >
              <img 
                src={symbol.image} 
                alt={symbol.name} 
                className="w-full h-40 object-cover"
              />
              <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium">{symbol.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    {symbol.category}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {symbol.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 天津方言内容 */}
      {activeTab === 'dialect' && (
        <div className="grid grid-cols-1 gap-4">
          {tianjinDialects.map((dialect) => (
            <motion.div
              key={dialect.id}
              className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${
                isDark ? 'border-gray-600' : 'border-gray-200'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg mb-1">{dialect.phrase}</h4>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    发音：{dialect.pronunciation}
                  </p>
                </div>
                <button className={`p-2 rounded-full ${
                  isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}>
                  <i className="fas fa-volume-up"></i>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          ))}
        </div>
      )}
    </motion.div>
  );
}
