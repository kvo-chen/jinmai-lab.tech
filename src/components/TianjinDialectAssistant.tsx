import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dialectService from '../services/dialectService';

const TianjinDialectAssistant: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'convert' | 'phrases'>('translate');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 翻译方言为普通话
  const handleTranslate = () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    const result = dialectService.translateToMandarin(inputText);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  // 将普通话转换为方言
  const handleConvert = () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    const result = dialectService.convertToTianjinStyle(inputText);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  // 语音合成
  const handleSpeak = async (text: string, isDialect: boolean = true) => {
    try {
      setIsSpeaking(true);
      await dialectService.speakTianjinDialect(text, isDialect);
      // 语音合成是异步的，这里只是开始播放，实际播放结束需要监听事件
      // 简单处理：2秒后重置状态
      setTimeout(() => setIsSpeaking(false), 2000);
    } catch (error) {
      console.error('语音合成失败:', error);
      setIsSpeaking(false);
    }
  };

  // 获取常用短语
  const commonPhrases = dialectService.getCommonPhrases();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">天津方言助手</h2>
      
      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'translate', label: '方言翻译' },
          { id: 'convert', label: '普通话转方言' },
          { id: 'phrases', label: '常用短语' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 翻译功能 */}
      {activeTab === 'translate' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="dialectInput" className="block text-sm font-medium text-gray-700 mb-2">
              天津方言输入
            </label>
            <textarea
              id="dialectInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入天津方言，例如：'介似嘛？倍儿哏儿！'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTranslate}
            disabled={isTranslating || !inputText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTranslating ? '翻译中...' : '翻译成普通话'}
          </motion.button>
          
          {translatedText && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">翻译结果</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{translatedText}</p>
                <div className="mt-2 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSpeak(translatedText, false)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zM4 9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
                    </svg>
                    播放普通话
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 普通话转方言功能 */}
      {activeTab === 'convert' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="mandarinInput" className="block text-sm font-medium text-gray-700 mb-2">
              普通话输入
            </label>
            <textarea
              id="mandarinInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入普通话，例如：'这个东西真有趣！'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConvert}
            disabled={isTranslating || !inputText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTranslating ? '转换中...' : '转换为天津方言'}
          </motion.button>
          
          {translatedText && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">转换结果</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{translatedText}</p>
                <div className="mt-2 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSpeak(translatedText, true)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zM4 9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
                    </svg>
                    播放天津方言
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 常用短语功能 */}
      {activeTab === 'phrases' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">天津方言常用短语</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonPhrases.map((phrase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-800 font-medium mb-1">{phrase.phrase}</p>
                    <p className="text-sm text-gray-600">{phrase.meaning}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSpeak(phrase.phrase, true)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zM4 9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TianjinDialectAssistant;