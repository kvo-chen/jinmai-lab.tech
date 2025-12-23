import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';

// 天津老字号数据
const oldBrands = [
  {
    id: 1,
    name: "狗不理包子",
    category: "food",
    description: "创建于1858年，天津传统美食代表，以皮薄馅大、十八褶著称。",
    address: "劝业场西街",
    position: { x: 50, y: 50 },
    year: 1858,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20steamed%20buns%20local%20food"
  },
  {
    id: 2,
    name: "老边饺子",
    category: "food",
    description: "百年传承，皮薄馅大，汤汁浓郁，是天津著名的饺子品牌。",
    address: "劝业场东街",
    position: { x: 30, y: 60 },
    year: 1829,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Laobian%20dumplings%20local%20food"
  },
  {
    id: 3,
    name: "桂发祥",
    category: "food",
    description: "十八街麻花，酥脆香甜，是天津传统小吃的代表之一。",
    address: "劝业场南街",
    position: { x: 60, y: 40 },
    year: 1927,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20fried%20dough%20twists%20local%20food"
  },
  {
    id: 4,
    name: "劝业场",
    category: "retail",
    description: "天津商业地标，创建于1928年，是华北地区最大的综合性商场。",
    address: "和平路与滨江道交口",
    position: { x: 50, y: 50 },
    year: 1928,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Quanye%20Department%20Store%20historical%20building"
  },
  {
    id: 5,
    name: "耳朵眼炸糕",
    category: "food",
    description: "创建于1900年，外酥里嫩，香甜可口，是天津三绝之一。",
    address: "大胡同",
    position: { x: 40, y: 70 },
    year: 1900,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20fried%20cake%20local%20food"
  },
  {
    id: 6,
    name: "泥人张",
    category: "craft",
    description: "创建于1850年，以彩塑艺术闻名，是天津民间艺术的代表。",
    address: "古文化街",
    position: { x: 20, y: 50 },
    year: 1850,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20traditional%20clay%20sculpture%20art"
  },
  {
    id: 7,
    name: "杨柳青年画",
    category: "craft",
    description: "始于明代崇祯年间，与苏州桃花坞年画并称'南桃北柳'。",
    address: "杨柳青镇",
    position: { x: 30, y: 20 },
    year: 1644,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20Painting%20traditional%20Chinese%20folk%20art"
  },
  {
    id: 8,
    name: "风筝魏",
    category: "craft",
    description: "天津特色风筝制作技艺，创始于清代光绪年间，以其精巧的工艺和精美的画工著称。",
    address: "古文化街",
    position: { x: 25, y: 55 },
    year: 1892,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20traditional%20kite%20making%20art"
  },
  {
    id: 9,
    name: "天津刻砖刘",
    category: "craft",
    description: "天津传统砖雕技艺，创始于清代光绪年间，以其精湛的雕刻技艺和独特的艺术风格著称。",
    address: "西青区",
    position: { x: 35, y: 25 },
    year: 1876,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Kezuanliu%20traditional%20brick%20carving%20art"
  }
];

// 天津文化资产数据
const culturalAssets = [
  {
    id: 101,
    name: "五大道建筑",
    category: "landmark",
    description: "天津著名历史文化街区，保留了大量欧洲风格建筑，被誉为'万国建筑博览馆'。",
    address: "和平区",
    position: { x: 55, y: 45 },
    year: 1900,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Five%20Avenues%20historical%20buildings"
  },
  {
    id: 102,
    name: "海河桥梁",
    category: "landmark",
    description: "海河上的桥梁是天津城市景观的重要组成部分，每座桥都有其独特的设计和历史。",
    address: "海河流域",
    position: { x: 50, y: 60 },
    year: 1404,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20bridges%20scenery"
  },
  {
    id: 103,
    name: "天津解放桥",
    category: "landmark",
    description: "天津标志性桥梁，原名万国桥，建于1927年，是天津历史的重要见证。",
    address: "和平区",
    position: { x: 55, y: 55 },
    year: 1927,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Jiefang%20Bridge%20historical%20bridge"
  },
  {
    id: 104,
    name: "天津古文化街",
    category: "landmark",
    description: "天津著名文化旅游景点，以传统民俗文化为特色，展现天津文化魅力。",
    address: "南开区",
    position: { x: 20, y: 50 },
    year: 1985,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20tourist%20spot"
  },
  {
    id: 105,
    name: "天津之眼摩天轮",
    category: "landmark",
    description: "天津标志性建筑，世界上唯一建在桥上的摩天轮，是天津的'城市名片'。",
    address: "红桥区",
    position: { x: 40, y: 65 },
    year: 2008,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Eye%20Ferris%20Wheel%20landmark"
  },
  {
    id: 106,
    name: "天津意式风情区",
    category: "landmark",
    description: "天津著名历史文化街区，保留了大量意大利风格建筑。",
    address: "河北区",
    position: { x: 60, y: 50 },
    year: 1902,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Street%20historical%20buildings"
  },
  {
    id: 107,
    name: "天津博物馆",
    category: "landmark",
    description: "天津最大的综合性博物馆，展示天津历史文化的重要窗口。",
    address: "河西区",
    position: { x: 45, y: 35 },
    year: 1918,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Museum%20modern%20architecture"
  },
  {
    id: 108,
    name: "天津鼓楼",
    category: "landmark",
    description: "天津历史文化名城的重要标志，展现天津历史文化的重要窗口。",
    address: "南开区",
    position: { x: 30, y: 55 },
    year: 1404,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Drum%20Tower%20historical%20building"
  },
  {
    id: 109,
    name: "天津天塔",
    category: "landmark",
    description: "天津广播电视塔，是天津标志性建筑之一。",
    address: "河西区",
    position: { x: 45, y: 30 },
    year: 1991,
    image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Tower%20landmark%20building"
  }
];

// 合并所有数据
const mapData = [...oldBrands, ...culturalAssets];

export default function TianjinMap() {
  const { isDark, theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{[key: number]: boolean}>({});
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  
  // 地图拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePosition.x;
    const deltaY = e.clientY - lastMousePosition.y;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 处理滚轮事件
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // 计算缩放因子
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom * scaleFactor));
    
    setZoom(newZoom);
  };

  // 筛选数据
  const filteredBrands = mapData.filter(brand => {
    const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                         brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         brand.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 分类颜色映射
  const categoryColors = {
    food: 'bg-yellow-500',
    retail: 'bg-blue-500',
    craft: 'bg-purple-500',
    landmark: 'bg-green-500'
  };

  // 分类图标映射
  const categoryIcons = {
    food: '🍜',
    retail: '🏪',
    craft: '🎨',
    landmark: '🏛️'
  };

  // 分类名称映射
  const categoryNames = {
    food: '餐饮美食',
    retail: '零售百货',
    craft: '手工艺',
    landmark: '地标建筑'
  };

  // 处理标记点击
  const handleMarkerClick = (brand: any) => {
    setSelectedBrand(brand);
    setShowInfo(true);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      {/* 英雄区 */}
      <GradientHero 
        title="天津老字号历史地图" 
        subtitle="探索天津百年老字号的历史分布与文化传承" 
        theme="heritage"
        stats={[
          { label: '文化资源', value: mapData.length.toString() },
          { label: '文化分类', value: Object.keys(categoryNames).length.toString() },
          { label: '历史跨度', value: '近200年' },
          { label: '文化遗产', value: '国家级' }
        ]}
        pattern={true}
        size="lg"
      />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 地图控制区 */}
        <div className={`p-6 rounded-2xl shadow-lg mb-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedCategory === 'all' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </button>
              {Object.entries(categoryNames).map(([key, name]) => (
                <button 
                  key={key}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${selectedCategory === key ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {categoryIcons[key as keyof typeof categoryIcons]} {name}
                </button>
              ))}
            </div>

            {/* 搜索和缩放控制 */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full md:w-auto">
              {/* 搜索输入框 */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="搜索老字号或地标..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300`}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              {/* 缩放控制 */}
              <div className="flex gap-2">
                <button 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                  disabled={zoom <= 0.5}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <button 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setZoom(Math.min(2, zoom + 0.2))}
                  disabled={zoom >= 2}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 地图展示区 */}
        <div 
          className={`relative w-full h-[600px] rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* 地图背景 */}
          <div className="absolute inset-0 bg-cover bg-center opacity-20 relative">
            {/* 使用img标签替代背景图，以便添加错误处理 */}
            <img
              src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20historical%20map%20with%20traditional%20Chinese%20style%20detailed%20city%20layout%20accurate%20districts"
              alt="天津历史地图"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // 使用内置SVG作为地图背景占位
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23${isDark ? '1f2937' : 'f3f4f6'}'/%3E%3Ctext x='600' y='400' font-family='Arial' font-size='48' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3ETianjin Historical Map%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>

          {/* 标记点 */}
          {filteredBrands.map(brand => (
            <motion.div
              key={brand.id}
              className="absolute cursor-pointer"
              style={{ 
                left: `${brand.position.x}%`, 
                top: `${brand.position.y}%`,
                transform: `translate(${offset.x}px, ${offset.y}px) translate(-50%, -50%) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onClick={() => handleMarkerClick(brand)}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut",
                delay: Math.random() * 0.3 // 随机延迟，使动画更自然
              }}
              whileHover={{ scale: 1.3 }}
            >
              <div className="relative">
                {/* 脉冲动画背景 */}
                <motion.div
                  className={`absolute inset-0 rounded-full ${categoryColors[brand.category as keyof typeof categoryColors]} opacity-30`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* 主标记点 */}
                <div className={`w-8 h-8 rounded-full ${categoryColors[brand.category as keyof typeof categoryColors]} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {categoryIcons[brand.category as keyof typeof categoryIcons]}
                </div>
                
                {/* 品牌名称提示 */}
                <motion.div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                  initial={{ opacity: 0, y: 5 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {brand.name}
                </motion.div>
              </div>
            </motion.div>
          ))}

          {/* 信息面板 */}
          {showInfo && selectedBrand && (
            <motion.div
              className={`absolute bottom-4 left-4 right-4 md:left-4 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-10`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              {/* 图片区域 */}
              <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                <img 
                  src={selectedBrand.image} 
                  alt={selectedBrand.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [selectedBrand.id]: true }))}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // 使用内置占位图替代外部服务
                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23${isDark ? '374151' : 'e5e7eb'}'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='20' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E${selectedBrand.name}%3C/text%3E%3Ctext x='200' y='180' font-family='Arial' font-size='14' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E图片加载中...%3C/text%3E%3C/svg%3E`;
                    target.alt = `${selectedBrand.name} 图片`;
                    setImageLoaded(prev => ({ ...prev, [selectedBrand.id]: true }));
                  }}
                  style={{ display: imageLoaded[selectedBrand.id] ? 'block' : 'none' }}
                />
                {/* 图片加载占位 */}
                {!imageLoaded[selectedBrand.id] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center">
                    <i className="fas fa-image text-4xl text-gray-400 dark:text-gray-500 mb-2"></i>
                    <span className="text-sm text-gray-500 dark:text-gray-400">加载图片中...</span>
                  </div>
                )}
                
                {/* 年份徽章 */}
                <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <i className="fas fa-calendar-alt text-xs"></i>
                  {selectedBrand.year} 年
                </div>
              </div>
              
              {/* 内容区域 */}
              <div className="p-5">
                <h3 className="text-2xl font-bold mb-2 dark:text-white">{selectedBrand.name}</h3>
                
                {/* 分类和地址 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                    {categoryIcons[selectedBrand.category as keyof typeof categoryIcons]} {categoryNames[selectedBrand.category as keyof typeof categoryNames]}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-xs"></i>
                    {selectedBrand.address}
                  </span>
                </div>
                
                {/* 描述 */}
                <p className="text-sm dark:text-gray-300 mb-5 leading-relaxed">{selectedBrand.description}</p>
                
                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                    onClick={() => setShowInfo(false)}
                  >
                    <i className="fas fa-times"></i>
                    关闭
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                  >
                    <i className="fas fa-share-alt"></i>
                    分享
                  </button>
                </div>
                
                {/* AR体验按钮 */}
                <button 
                  className={`w-full mt-3 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                  onClick={() => window.open('/AR', '_blank', 'width=1000,height=800')}
                >
                  <i className="fas fa-vr-cardboard"></i>
                  AR体验
                </button>
              </div>
            </motion.div>
          )}

          {/* 缩放控制按钮 */}
          <div className={`absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              disabled={zoom >= 2}
            >
              <i className="fas fa-plus"></i>
            </button>
            <button 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              disabled={zoom <= 0.5}
            >
              <i className="fas fa-minus"></i>
            </button>
          </div>
        </div>

        {/* 地图说明 */}
        <div className={`p-6 rounded-2xl shadow-lg mt-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <h3 className="text-xl font-bold mb-4">地图使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-mouse-pointer text-red-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">点击标记</h4>
                <p className="text-sm dark:text-gray-400">点击地图上的标记点查看老字号详细信息</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-filter text-blue-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">分类筛选</h4>
                <p className="text-sm dark:text-gray-400">使用顶部分类按钮筛选不同类型的老字号</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-search-plus text-green-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">缩放控制</h4>
                <p className="text-sm dark:text-gray-400">使用右上角的缩放按钮调整地图大小</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-purple-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">了解历史</h4>
                <p className="text-sm dark:text-gray-400">探索天津老字号的百年历史与文化传承</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}