import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import LazyImage from './LazyImage';
import { llmService } from '../services/llmService';
import { useTranslation } from 'react-i18next';

// Review result type definition
interface AIReviewResult {
  overallScore: number;
  culturalFit: {
    score: number;
    details: string[];
  };
  creativity: {
    score: number;
    details: string[];
  };
  aesthetics: {
    score: number;
    details: string[];
  };
  suggestions: string[];
  similarWorks?: Array<{
    id: number;
    thumbnail: string;
    title: string;
  }>;
  commercialPotential?: {
    score: number;
    analysis: string[];
  };
}

interface AIReviewProps {
  workId: string;
  onClose: () => void;
}

const AIReview: React.FC<AIReviewProps> = ({ workId, onClose }) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [currentTab, setCurrentTab] = useState<'overall' | 'detail' | 'commercial'>('overall');
  
  // Mock review data - now using LLM service to generate smarter reviews
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API request delay
    setTimeout(async () => {
      try {
        // Use LLM service to generate review content
        // Here we simulate the call, in reality we can pass the work content to the LLM service
        const creationDescription = "This is a design work that integrates traditional cloud pattern elements, using red tones and modern layout";
        
        // Get creation issue diagnosis
        const issues = llmService.diagnoseCreationIssues(creationDescription);
        
        // Generate review result
        setReviewResult({
          overallScore: 85,
          culturalFit: {
            score: 90,
            details: [
              'Successfully integrated traditional cloud pattern elements',
              'Color matching conforms to traditional Chinese aesthetics',
              'Pattern layout is reasonable, preserving cultural charm'
            ]
          },
          creativity: {
            score: 82,
            details: [
              'Innovative combination of traditional elements with modern design',
              'Novel composition with strong visual impact',
              'Can try more diversified cultural element fusion'
            ]
          },
          aesthetics: {
            score: 88,
            details: [
              'Overall visual effect is harmonious and unified',
              'Clear color hierarchy with natural transitions',
              'Reasonable typography with突出重点'
            ]
          },
          suggestions: issues.length > 0 ? issues : [
            'Suggest adding more diverse traditional pattern combinations',
            'Consider adding intangible cultural heritage elements to enhance cultural depth',
            'Try different color matching schemes to further highlight the national trend style',
            'Add interactive elements to enhance user engagement',
            'Consider commercial application scenarios and optimize design details'
          ],
          commercialPotential: {
            score: 85,
            analysis: [
              'Design style conforms to current national trend, with high commercial value',
              'Suitable for cultural and creative products, packaging design and other fields',
              'Suggest applying for copyright certification to protect original rights',
              'Consider participating in commercial docking activities organized by the platform'
            ]
          },
          similarWorks: [
            {
              id: 1,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%201',
              title: 'New National Trend Style'
            },
            {
              id: 2,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%202',
              title: 'Traditional Pattern Innovation'
            },
            {
              id: 3,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%203',
              title: 'Oriental Aesthetics Reconstruction'
            }
          ]
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to generate review:', error);
        setIsLoading(false);
      }
    }, 1500);
  }, [workId, t]);
  
  const handleApplySuggestion = (suggestion: string) => {
    toast.success(t('review.applySuggestionSuccess'));
  };
  
  const handleApplyCommercialAdvice = () => {
    toast.success(t('review.applyCommercialAdviceSuccess'));
  };
  
  const COLORS = ['#f87171', '#60a5fa', '#34d399'];
  
  // Get rating based on score
  const getRating = (score: number) => {
    if (score >= 90) return { text: t('review.excellent'), color: 'text-green-500' };
    if (score >= 80) return { text: t('review.good'), color: 'text-blue-500' };
    if (score >= 70) return { text: t('review.average'), color: 'text-yellow-500' };
    if (score >= 60) return { text: t('review.pass'), color: 'text-orange-500' };
    return { text: t('review.needImprovement'), color: 'text-red-500' };
  };
  
  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div 
          className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-medium mb-2">Generating AI review...</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Analyzing your work, please wait...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!reviewResult) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 点评头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">AI Review</h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 点评标签页 */}
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex">
            {[
              { id: 'overall', name: 'Overall Rating' },
              { id: 'detail', name: 'Detailed Review' },
              { id: 'commercial', name: 'Commercial Advice' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`px-6 py-3 transition-colors font-medium text-sm ${
                  currentTab === tab.id 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 点评内容 */}
        <div className="p-6">
          {/* 总体评分标签页 */}
          {currentTab === 'overall' && (
            <div>
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: reviewResult.overallScore }, { value: 100 - reviewResult.overallScore }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill="#f87171" />
                          <Cell fill={isDark ? '#374151' : '#e5e7eb'} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{reviewResult.overallScore}</span>
                      <span className="text-sm opacity-70">总分</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { 
                        title: 'Cultural Fit', 
                        score: reviewResult.culturalFit.score, 
                        color: 'text-green-500' 
                      },
                      { 
                        title: 'Creativity', 
                        score: reviewResult.creativity.score, 
                        color: 'text-blue-500' 
                      },
                      { 
                        title: 'Aesthetics', 
                        score: reviewResult.aesthetics.score, 
                        color: 'text-purple-500' 
                      }
                    ].map((item, index) => {
                      const rating = getRating(item.score);
                      
                      return (
                        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-sm mb-1">{item.title}</p>
                          <div className="flex items-end">
                            <span className="text-2xl font-bold mr-2">{item.score}</span>
                            <span className={`text-sm ${rating.color}`}>{rating.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* 亮点总结 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-8`}>
                <h4 className="font-medium mb-3">Work Highlights</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">文化元素融入自然，展现了深厚的文化底蕴</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">设计风格现代与传统完美结合，符合当下国潮趋势</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">视觉层次分明，色彩搭配和谐统一</span>
                  </li>
                </ul>
              </div>
              
              {/* Recommended Reference Works */}
              {reviewResult.similarWorks && reviewResult.similarWorks.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-4">推荐参考作品</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reviewResult.similarWorks.map((work) => (
                      <motion.div
                        key={work.id}
                        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md`}
                        whileHover={{ y: -5 }}
                      >
                        <LazyImage 
                          src={work.thumbnail} 
                          alt={work.title} 
                          className="w-full h-32 object-cover"
                          ratio="landscape"
                          fit="cover"
                        />
                        <div className="p-3">
                          <p className="text-sm font-medium text-center">{work.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 详细点评标签页 */}
          {currentTab === 'detail' && (
            <div className="space-y-6">
              {/* 文化契合度 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">文化契合度</h5>
                  <div className={`text-sm ${getRating(reviewResult.culturalFit.score).color}`}>
                    {getRating(reviewResult.culturalFit.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.culturalFit.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 创意性 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">创意性</h5>
                  <div className={`text-sm ${getRating(reviewResult.creativity.score).color}`}>
                    {getRating(reviewResult.creativity.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.creativity.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 美学表现 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">美学表现</h5>
                  <div className={`text-sm ${getRating(reviewResult.aesthetics.score).color}`}>
                    {getRating(reviewResult.aesthetics.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.aesthetics.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Improvement Suggestions */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h5 className="font-medium mb-3">改进建议</h5>
                <ul className="space-y-3">
                  {(showMoreSuggestions ? reviewResult.suggestions : reviewResult.suggestions.slice(0, 2)).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                      <div className="flex-1">
                        <span className="text-sm">{suggestion}</span>
                        <button 
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="ml-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Apply this suggestion
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {reviewResult.suggestions.length > 2 && (
                  <button 
                    onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    {showMoreSuggestions ? 'Collapse' : 'View more suggestions'}<i className={`fas fa-chevron-${showMoreSuggestions ? 'up' : 'down'} ml-1`}></i>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 商业化建议标签页 */}
          {currentTab === 'commercial' && reviewResult.commercialPotential && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Commercial Potential Assessment</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{reviewResult.commercialPotential.score}</span>
                    <span className={`${getRating(reviewResult.commercialPotential.score).color} text-sm`}>
                      {getRating(reviewResult.commercialPotential.score).text}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Commercial Analysis */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">商业化分析</h5>
                <ul className="space-y-2">
                  {reviewResult.commercialPotential.analysis.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-bullseye text-blue-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 推荐的商业化路径 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">Recommended Commercial Paths</h5>
                <div className="space-y-3">
                  {[
                    { title: 'Cultural and Creative Product Development', icon: 'gift', description: 'Suitable for developing various cultural and creative peripheral products' },
                    { title: 'Brand Packaging Design', icon: 'box', description: 'Can be applied to packaging upgrades for time-honored brands' },
                    { title: 'Digital Collectibles', icon: 'gem', description: 'Has potential for conversion to digital collectibles' }
                  ].map((path, index) => (
                    <div key={index} className="flex items-start p-3 rounded-lg bg-white bg-opacity-10">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                        <i className={`fas fa-${path.icon}`}></i>
                      </div>
                      <div>
                        <h6 className="font-medium">{path.title}</h6>
                        <p className="text-xs opacity-80">{path.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommended Related Activities */}
              <div className="mb-6">
                <h5 className="font-medium mb-3">相关活动推荐</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      title: 'Time-honored Brand Innovation Competition', 
                      deadline: '2025-12-31', 
                      reward: 'Maximum prize ¥50,000',
                      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Design%20competition%20poster%20traditional%20Chinese%20elements'
                    },
                    { 
                      title: 'National Trend Cultural and Creative Design Camp', 
                      deadline: '2025-11-30', 
                      reward: 'Professional mentor guidance + exhibition opportunities',
                      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cultural%20creative%20design%20workshop'
                    }
                  ].map((activity, index) => (
                    <div key={index} className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex">
                        <LazyImage 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-24 h-24 object-cover"
                          ratio="square"
                          fit="cover"
                        />
                        <div className="p-3 flex-1">
                          <h6 className="font-medium mb-1">{activity.title}</h6>
                          <div className="text-xs opacity-80 mb-1">
                            Deadline: {activity.deadline}
                          </div>
                          <div className="text-xs font-medium text-red-600">
                            {activity.reward}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 点评底部 */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          {currentTab === 'commercial' && reviewResult.commercialPotential && (
            <button 
              onClick={handleApplyCommercialAdvice}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Adopt commercial advice
            </button>
          )}
          
          {currentTab === 'detail' && (
            <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
              Apply all suggestions
            </button>
          )}
          
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIReview;
