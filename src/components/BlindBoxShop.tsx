import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import blindBoxService, { BlindBox, BlindBoxOpeningResult } from '../services/blindBoxService';

// 盲盒卡片组件
const BlindBoxCard: React.FC<{
  blindBox: BlindBox;
  onPurchase: (box: BlindBox) => void;
  isDark: boolean;
}> = ({ blindBox, onPurchase, isDark }) => {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img
          src={blindBox.image}
          alt={blindBox.name}
          className="w-full h-48 object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          {blindBox.rarity === 'common' && '普通'}
          {blindBox.rarity === 'rare' && '稀有'}
          {blindBox.rarity === 'epic' && '史诗'}
          {blindBox.rarity === 'legendary' && '传奇'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1">{blindBox.name}</h3>
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {blindBox.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-red-600 font-bold">{blindBox.price} 积分</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            剩余: {blindBox.remainingCount}/{blindBox.totalCount}
          </div>
        </div>
        
        <button
          onClick={() => onPurchase(blindBox)}
          disabled={!blindBox.available}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${blindBox.available 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-gray-500 cursor-not-allowed text-white'}`}
        >
          {blindBox.available ? '立即购买' : '已售罄'}
        </button>
      </div>
    </motion.div>
  );
};

// 盲盒开启动画组件
const BlindBoxOpeningAnimation: React.FC<{
  result: BlindBoxOpeningResult;
  onClose: () => void;
  isDark: boolean;
}> = ({ result, onClose, isDark }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">恭喜你获得！</h2>
        
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-yellow-500 mb-4">
            <img
              src={result.content.image}
              alt={result.content.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-xl font-bold mb-2">{result.content.name}</h3>
          <p className={`text-center mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {result.content.description}
          </p>
          
          <div className={`px-4 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {result.content.rarity === 'common' && '普通'}
            {result.content.rarity === 'rare' && '稀有'}
            {result.content.rarity === 'epic' && '史诗'}
            {result.content.rarity === 'legendary' && '传奇'}
          </div>
        </motion.div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            关闭
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            再开一个
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BlindBoxShop: React.FC = () => {
  const { isDark } = useTheme();
  const [blindBoxes, setBlindBoxes] = useState(() => blindBoxService.getAllBlindBoxes());
  const [selectedBox, setSelectedBox] = useState<BlindBox | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [openingResult, setOpeningResult] = useState<BlindBoxOpeningResult | null>(null);

  // 购买并打开盲盒
  const handlePurchase = (box: BlindBox) => {
    // 模拟用户ID
    const userId = 'current-user';
    
    // 购买盲盒
    const success = blindBoxService.purchaseBlindBox(box.id, userId);
    if (success) {
      // 打开盲盒
      setSelectedBox(box);
      setIsOpening(true);
      
      // 模拟开启动画延迟
      setTimeout(() => {
        const result = blindBoxService.openBlindBox(box.id, userId);
        if (result) {
          setOpeningResult(result);
          setIsOpening(false);
          // 更新盲盒列表
          setBlindBoxes(blindBoxService.getAllBlindBoxes());
          toast.success('盲盒开启成功！');
        }
      }, 1500);
    } else {
      toast.error('盲盒购买失败，请稍后重试');
    }
  };

  // 关闭开启结果
  const handleCloseResult = () => {
    setOpeningResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">作品盲盒商店</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          开启盲盒，发现惊喜创作资源！每个盲盒都有机会获得稀有作品、模板和素材
        </p>
      </div>
      
      {/* 盲盒列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {blindBoxes.map(box => (
          <BlindBoxCard
            key={box.id}
            blindBox={box}
            onPurchase={handlePurchase}
            isDark={isDark}
          />
        ))}
      </div>
      
      {/* 盲盒开启动画 */}
      {isOpening && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                <span className="text-red-600 text-2xl font-bold">?</span>
              </div>
            </motion.div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              正在开启 {selectedBox?.name}...
            </h3>
          </div>
        </motion.div>
      )}
      
      {/* 盲盒开启结果 */}
      {openingResult && (
        <BlindBoxOpeningAnimation
          result={openingResult}
          onClose={handleCloseResult}
          isDark={isDark}
        />
      )}
      
      {/* 盲盒规则说明 */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h2 className="text-xl font-bold mb-4">盲盒规则说明</h2>
        <ul className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>盲盒包含作品、模板、素材和成就等多种内容</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>不同稀有度的盲盒对应不同品质的内容，传奇盲盒有机会获得典藏级作品</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>每个盲盒数量有限，售完即止</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>开启的内容将自动添加到您的创作资源库中</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BlindBoxShop;
