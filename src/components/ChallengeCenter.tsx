import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import challengeService, { Challenge, ChallengeStatus, ChallengeSubmission } from '../services/challengeService';

interface ChallengeCenterProps {
  userId?: string;
}

const ChallengeCenter: React.FC<ChallengeCenterProps> = ({ userId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [newSubmission, setNewSubmission] = useState<{
    title: string;
    thumbnail: string;
    description: string;
  }>({
    title: '',
    thumbnail: '',
    description: ''
  });

  // 加载挑战数据
  useEffect(() => {
    // 自动更新挑战状态
    challengeService.updateChallengeStatuses();
    
    const loadedChallenges = challengeService.getChallenges();
    setChallenges(loadedChallenges);
    setFilteredChallenges(loadedChallenges);
  }, []);

  // 应用筛选
  useEffect(() => {
    let result = [...challenges];
    
    // 状态筛选
    if (selectedStatus !== 'all') {
      result = result.filter(challenge => challenge.status === selectedStatus);
    }
    
    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(challenge => 
        challenge.title.toLowerCase().includes(query) ||
        challenge.description.toLowerCase().includes(query) ||
        challenge.theme.toLowerCase().includes(query) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredChallenges(result);
  }, [challenges, selectedStatus, searchQuery]);

  // 提交挑战作品
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;
    
    const submission = challengeService.submitToChallenge(selectedChallenge.id, {
      ...newSubmission,
      author: userId || '匿名用户'
    });
    
    if (submission) {
      // 更新本地状态
      const updatedChallenges = challenges.map(challenge => {
        if (challenge.id === selectedChallenge.id) {
          return challengeService.getChallengeById(selectedChallenge.id) || challenge;
        }
        return challenge;
      });
      setChallenges(updatedChallenges);
      setFilteredChallenges(updatedChallenges);
      setSelectedChallenge(challengeService.getChallengeById(selectedChallenge.id) || null);
      
      // 重置表单
      setNewSubmission({
        title: '',
        thumbnail: '',
        description: ''
      });
      setShowSubmissionForm(false);
    }
  };

  // 为挑战作品点赞
  const handleLikeSubmission = (challengeId: string, submissionId: string) => {
    const updatedChallenge = challengeService.likeSubmission(challengeId, submissionId);
    if (updatedChallenge) {
      // 更新本地状态
      const updatedChallenges = challenges.map(challenge => {
        if (challenge.id === challengeId) {
          return updatedChallenge;
        }
        return challenge;
      });
      setChallenges(updatedChallenges);
      setFilteredChallenges(updatedChallenges);
      if (selectedChallenge?.id === challengeId) {
        setSelectedChallenge(updatedChallenge);
      }
    }
  };

  // 关闭挑战详情
  const closeChallengeDetail = () => {
    setSelectedChallenge(null);
    setShowSubmissionForm(false);
  };

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: '进行中', color: 'bg-green-100 text-green-800' },
    { value: 'upcoming', label: '即将开始', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: '已结束', color: 'bg-purple-100 text-purple-800' },
    { value: 'archived', label: '已归档', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">创意挑战中心</h2>
      
      {!selectedChallenge ? (
        // 挑战列表视图
        <div>
          {/* 筛选和搜索 */}
          <div className="space-y-4 mb-6">
            {/* 搜索框 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索挑战标题、主题或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">挑战状态</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedStatus(option.value as ChallengeStatus | 'all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${selectedStatus === option.value ? 'bg-blue-600 text-white' : option.color}`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 挑战列表 */}
          {filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedChallenge(challenge)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                  {/* 特色图片 */}
                  <div className="relative h-48">
                    <img
                      src={challenge.featuredImage}
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 状态标签 */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.status === 'active' ? 'bg-green-100 text-green-800' : challenge.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : challenge.status === 'completed' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {statusOptions.find(opt => opt.value === challenge.status)?.label || '未知'}
                      </span>
                    </div>
                    {/* 特色标记 */}
                    {challenge.isFeatured && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          精选
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 挑战信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{challenge.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{challenge.description}</p>
                    
                    {/* 主题标签 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {challenge.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                      {challenge.tags.length > 3 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                          +{challenge.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* 挑战统计 */}
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex gap-4">
                        <span className="text-gray-600">
                          <strong>{challenge.participants}</strong> 参与者
                        </span>
                        <span className="text-gray-600">
                          <strong>{challenge.submissionCount}</strong> 作品
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-full transition-colors duration-200"
                      >
                        查看详情
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无挑战</h3>
              <p className="text-gray-500">还没有符合条件的挑战，敬请期待！</p>
            </div>
          )}
        </div>
      ) : (
        // 挑战详情视图
        <div className="space-y-6">
          {/* 挑战详情头部 */}
          <div className="flex justify-between items-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={closeChallengeDetail}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              返回挑战列表
            </motion.button>
            
            {selectedChallenge.status === 'active' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                {showSubmissionForm ? '取消提交' : '提交作品'}
              </motion.button>
            )}
          </div>
          
          {/* 挑战详情 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 特色图片 */}
            <div className="relative">
              <img
                src={selectedChallenge.featuredImage}
                alt={selectedChallenge.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedChallenge.status === 'active' ? 'bg-green-100 text-green-800' : selectedChallenge.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : selectedChallenge.status === 'completed' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {statusOptions.find(opt => opt.value === selectedChallenge.status)?.label || '未知'}
                </span>
              </div>
            </div>
            
            {/* 挑战信息 */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedChallenge.title}</h1>
              <p className="text-gray-600 mb-6">{selectedChallenge.description}</p>
              
              {/* 挑战主题和文化元素 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">挑战主题</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedChallenge.theme}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">文化元素</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedChallenge.culturalElements.map((element, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {element}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 挑战时间和奖励 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">开始时间</h3>
                  <p className="text-gray-800">{new Date(selectedChallenge.startDate).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">结束时间</h3>
                  <p className="text-gray-800">{new Date(selectedChallenge.endDate).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">奖励池</h3>
                  <p className="text-gray-800 font-semibold">{selectedChallenge.prizePool}</p>
                </div>
              </div>
              
              {/* 挑战规则和要求 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">挑战规则</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {selectedChallenge.rules.map((rule, index) => (
                      <li key={index}>{rule}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">作品要求</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {selectedChallenge.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* 提交作品表单 */}
          {showSubmissionForm && selectedChallenge.status === 'active' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">提交作品</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    作品标题
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newSubmission.title}
                    onChange={(e) => setNewSubmission({ ...newSubmission, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                    作品缩略图 URL
                  </label>
                  <input
                    type="url"
                    id="thumbnail"
                    value={newSubmission.thumbnail}
                    onChange={(e) => setNewSubmission({ ...newSubmission, thumbnail: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    作品描述
                  </label>
                  <textarea
                    id="description"
                    value={newSubmission.description}
                    onChange={(e) => setNewSubmission({ ...newSubmission, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    提交作品
                  </motion.button>
                </div>
              </form>
            </div>
          )}
          
          {/* 挑战作品列表 */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              参赛作品 ({selectedChallenge.submissionCount})
            </h2>
            
            {selectedChallenge.submissions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {selectedChallenge.submissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* 作品缩略图 */}
                    <div className="relative">
                      <img
                        src={submission.thumbnail}
                        alt={submission.title}
                        className="w-full h-48 object-cover"
                      />
                      {/* 获胜标记 */}
                      {submission.isWinner && (
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${submission.rank === 1 ? 'bg-yellow-500 text-white' : submission.rank === 2 ? 'bg-gray-400 text-white' : submission.rank === 3 ? 'bg-amber-700 text-white' : 'bg-blue-500 text-white'}`}>
                            {submission.rank === 1 ? '冠军' : submission.rank === 2 ? '亚军' : submission.rank === 3 ? '季军' : '优胜奖'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 作品信息 */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{submission.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{submission.description}</p>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="text-gray-500">作者: </span>
                          <span className="font-medium text-gray-800">{submission.author}</span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(submission.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleLikeSubmission(selectedChallenge.id, submission.id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            {submission.likes}
                          </motion.button>
                          
                          <span className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            {submission.views}
                          </span>
                          
                          <span className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.707 10.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L5.586 11H2a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3zM13 12a1 1 0 100-2h-3.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 13H13z" clipRule="evenodd" />
                            </svg>
                            {submission.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无参赛作品</h3>
              <p className="text-gray-500">成为第一个提交作品的人吧！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeCenter;