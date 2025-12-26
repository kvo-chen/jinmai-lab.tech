import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import dialectService from '../services/dialectService';
import SpeechInput from './SpeechInput';

const TianjinDialectAssistant: React.FC = () => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'convert' | 'phrases'>('translate');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Translate dialect to Mandarin
  const handleTranslate = () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    const result = dialectService.translateToMandarin(inputText);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  // Convert Mandarin to dialect
  const handleConvert = () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    const result = dialectService.convertToTianjinStyle(inputText);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  // Speech synthesis
  const handleSpeak = async (text: string, isDialect: boolean = true) => {
    try {
      setIsSpeaking(true);
      await dialectService.speakTianjinDialect(text, isDialect);
      // Speech synthesis is asynchronous, this only starts playback
      // Simple handling: reset state after 2 seconds
      setTimeout(() => setIsSpeaking(false), 2000);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
    }
  };
  
  // Copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  };
  
  // Handle speech input
  const handleSpeechInput = (text: string) => {
    setInputText(prev => prev + text);
  };

  // Get common phrases
  const commonPhrases = dialectService.getCommonPhrases();

  return (
    <div className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'} rounded-lg shadow-lg p-6 border`}>
      <h2 className="text-2xl font-bold mb-6">Tianjin Dialect Assistant</h2>
      
      {/* Tab navigation */}
      <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} mb-6`}>
        {[
          { id: 'translate', label: 'Dialect Translation' },
          { id: 'convert', label: 'Mandarin to Dialect' },
          { id: 'phrases', label: 'Common Phrases' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Translation function */}
      {activeTab === 'translate' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="dialectInput" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Tianjin Dialect Input
            </label>
            <div className="relative">
              <textarea
                id="dialectInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Please enter Tianjin dialect, e.g., '介似嘛？倍儿哏儿！'"
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32`}
              />
              {/* Voice input button */}
              <div className="absolute right-3 bottom-3">
                <SpeechInput onTextRecognized={handleSpeechInput} language="zh-CN" />
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTranslate}
            disabled={isTranslating || !inputText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTranslating ? 'Translating...' : 'Translate to Mandarin'}
          </motion.button>
          
          {translatedText && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Translation Result</h3>
              <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{translatedText}</p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(translatedText)}
                    className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {copySuccess ? (
                      <span className="text-sm text-green-500">Copied</span>
                    ) : (
                      <i className="fas fa-copy"></i>
                    )}
                  </motion.button>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSpeak(translatedText, false)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-volume-up mr-1"></i>
                    Play Mandarin
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setInputText(translatedText);
                      setTranslatedText('');
                    }}
                    className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-exchange-alt mr-1"></i>
                    Reverse Translation
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Mandarin to dialect function */}
      {activeTab === 'convert' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="mandarinInput" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Mandarin Input
            </label>
            <div className="relative">
              <textarea
                id="mandarinInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Please enter Mandarin, e.g., '这个东西真有趣！'"
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32`}
              />
              {/* Voice input button */}
              <div className="absolute right-3 bottom-3">
                <SpeechInput onTextRecognized={handleSpeechInput} language="zh-CN" />
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConvert}
            disabled={isTranslating || !inputText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTranslating ? 'Converting...' : 'Convert to Tianjin Dialect'}
          </motion.button>
          
          {translatedText && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Conversion Result</h3>
              <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{translatedText}</p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(translatedText)}
                    className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {copySuccess ? (
                      <span className="text-sm text-green-500">Copied</span>
                    ) : (
                      <i className="fas fa-copy"></i>
                    )}
                  </motion.button>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSpeak(translatedText, true)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-volume-up mr-1"></i>
                    Play Tianjin Dialect
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setInputText(translatedText);
                      setTranslatedText('');
                    }}
                    className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-exchange-alt mr-1"></i>
                    Reverse Conversion
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Common phrases function */}
      {activeTab === 'phrases' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Common Tianjin Dialect Phrases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonPhrases.map((phrase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-800'} font-medium`}>{phrase.phrase}</p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCopy(phrase.phrase)}
                        className={`ml-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {copySuccess ? (
                          <i className="fas fa-check text-green-500"></i>
                        ) : (
                          <i className="fas fa-copy"></i>
                        )}
                      </motion.button>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{phrase.meaning}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSpeak(phrase.phrase, true)}
                    disabled={isSpeaking}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <i className="fas fa-volume-up text-xl"></i>
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