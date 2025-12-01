import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer'
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import { YangliuqingCard, TianjinImage } from '@/components/TianjinStyleComponents';
import SidebarLayout from '@/components/SidebarLayout'
import llmService from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { markPrefetched, isPrefetched } from '@/services/prefetch'

export default function Home() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [currentSection, setCurrentSection] = useState('attract');
  
  
  
  const handleExplore = () => {
    navigate('/explore');
  };
  const [search, setSearch] = useState('');
  const [inspireOn, setInspireOn] = useState(false);
  const [creativeDirections] = useState<string[]>([]);
  const [generatedText] = useState('');
  const [isGenerating] = useState(false);
  const [diagnosedIssues, setDiagnosedIssues] = useState<string[]>([]);
  const [optimizationSummary, setOptimizationSummary] = useState(''); // AI优化说明（语言大模型流式生成）
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeAudioUrl, setOptimizeAudioUrl] = useState('');
  // 选中标签集合（用于视觉高亮与组合搜索）
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // 快速标签常量
  const quickTags = ['国潮风格','适用人群','文献灵感','科创思维','地域素材','非遗元素'];
  // 中文注释：首页英雄区A/B文案变体（用于验证不同文案对转化的影响，随机并持久化）
  const [heroVariant] = useState<'A' | 'B'>(() => {
    try {
      const v = localStorage.getItem('heroVariant')
      if (v === 'A' || v === 'B') return v as any
    } catch {}
    return Math.random() > 0.5 ? 'A' : 'B'
  })
  useEffect(() => { try { localStorage.setItem('heroVariant', heroVariant) } catch {} }, [heroVariant])
  
  
  // 页面内功能区定位引用（用于平滑滚动到对应区域）
  const creativeRef = useRef<HTMLDivElement | null>(null); // 创意方向区
  const generatedRef = useRef<HTMLDivElement | null>(null); // AI生成区
  const optimizedRef = useRef<HTMLDivElement | null>(null); // 优化建议区
  const galleryRef = useRef<HTMLDivElement | null>(null); // 为你推荐作品区
  const tianjinRef = useRef<HTMLDivElement | null>(null); // 天津特色专区

  // 计算偏移并进行更准确的滚动（避免被顶部吸附或遮挡）

  const ensurePrompt = (): string | null => {
    const base = search.trim();
    if (!base) {
      toast.warning('请输入关键词');
      return null;
    }
    return inspireOn ? `${base} 灵感加持` : base;
  };

  const handleInspireClick = () => {
    const p = ensurePrompt();
    if (!p) return;
    // 中文注释：点击前预取目标页面，减少跳转卡顿
    prefetchNeo();
    navigate(`/neo?from=home&query=${encodeURIComponent(p)}`);
  };

  const handleGenerateClick = () => {
    const p = ensurePrompt();
    if (!p) return;
    // 中文注释：点击前预取目标页面，减少跳转卡顿
    prefetchTools();
    navigate(`/tools?from=home&query=${encodeURIComponent(p)}`);
  };

  

  const handleOptimizeClick = async () => {
    const p = ensurePrompt();
    if (!p) return;
    setIsOptimizing(true);
    setOptimizeAudioUrl('');
    setOptimizationSummary('');
    try {
      // 使用 Kimi 作为默认优化模型（中文对话与创意更友好）
      llmService.setCurrentModel('kimi');
      // 代理模式下不启用流式，避免SSE被浏览器或代理拦截
      llmService.updateConfig({
        stream: false,
        system_prompt: '你是资深创作优化助手，请针对用户的创作问题进行结构化诊断与优化。输出格式包含：\n1) 问题诊断\n2) 优化方向\n3) 落地步骤\n4) 参考素材/风格\n语言简洁、可执行。'
      });
      const issues = llmService.diagnoseCreationIssues(p); // 规则诊断（同步）
      setDiagnosedIssues(issues);
      // 生成优化说明：流式关闭时直接使用最终结果填充
      const summary = await llmService.generateResponse(`${p}（请输出结构化的优化说明与下一步行动）`);
      if (summary && !/接口不可用|未返回内容/.test(summary)) {
        setOptimizationSummary(summary);
      }
      // 同步生成“优化后的提示词”并填充到输入框
      const optimized = await llmService.generateResponse(
        `请将以下创作问题提炼为可直接用于AI生成的中文提示词（不超过60字，包含核心意象与风格约束），只输出提示词本句，不要额外说明：\n${p}`
      );
      const oneLine = optimized.split(/\r?\n/).find(s => s.trim()) || optimized;
      const cleaned = oneLine
        .replace(/^"|"$/g, '')
        .replace(/^“|”$/g, '')
        .replace(/^【|】$/g, '')
        .replace(/^提示词[:：]\s*/, '')
        .trim();
      if (cleaned && !/接口不可用|未返回内容/.test(cleaned)) {
        setSearch(cleaned);
        toast.success('已生成优化提示词，并填入输入框');
      }
      toast.success(`发现${issues.length}条优化建议`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const speakOptimizations = async () => {
    const text = optimizationSummary.trim() || diagnosedIssues.join('；'); // 优先朗读AI优化说明
    if (!text) { toast.warning('暂无建议可朗读'); return }
    try {
      const r = await voiceService.synthesize(text, { format: 'mp3' });
      setOptimizeAudioUrl(r.audioUrl);
    } catch (e: any) {
      toast.error(e?.message || '朗读失败');
    }
  };

  const copyOptimizations = async () => {
    const text = optimizationSummary.trim() || diagnosedIssues.join('\n'); // 优先复制AI优化说明
    if (!text) { toast.warning('暂无建议可复制'); return }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('建议已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  const toggleInspire = () => {
    const next = !inspireOn;
    setInspireOn(next);
    try { localStorage.setItem('inspireOn', String(next)); } catch {}
    toast.info(next ? '灵感加持已开启' : '灵感加持已关闭');
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('inspireOn');
      if (saved) setInspireOn(saved === 'true');
    } catch {}
  }, []);

  // 将标签追加到搜索（避免重复）
  const appendTagToSearch = (s: string, tag: string) => {
    const has = s.includes(tag);
    return has ? s : (s ? `${s} ${tag}` : tag);
  };
  // 从搜索中移除标签（并清理多余空格）
  const removeTagFromSearch = (s: string, tag: string) => {
    const next = s.replace(new RegExp(tag, 'g'), '').replace(/\s+/g, ' ').trim();
    return next;
  };
  // 切换标签选中状态（中文注释：仅更新选中与搜索，不触发滚动或跳转）
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      const next = exists ? prev.filter(t => t !== tag) : [...prev, tag];
      // 中文注释：同步更新搜索框内容（选择则追加，取消则移除）
      setSearch((s) => exists ? removeTagFromSearch(s, tag) : appendTagToSearch(s, tag));
      // 中文注释：不进行任何滚动或页面跳转，保持当前视图位置
      return next;
    });
  };

  // 快捷键：Ctrl+K 聚焦输入框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[placeholder="请输入创作问题或灵感关键词"]');
        el?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 当对应内容生成后，自动滚动到功能区（平滑）
  useEffect(() => {
    if (creativeDirections.length > 0) {
      creativeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [creativeDirections.length]);

  useEffect(() => {
    if (generatedText) {
      generatedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedText]);

  useEffect(() => {
    if (diagnosedIssues.length > 0) {
      optimizedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [diagnosedIssues.length]);

  const handleRecommendedClick = (text: string) => {
    const map: Record<string, { q?: string; tags?: string[]; tagMode?: 'AND' | 'OR' }> = {
      '国潮风格的品牌包装如何设计': { q: '国潮', tags: ['礼盒', '联名'], tagMode: 'OR' },
      '杨柳青年画如何现代化表达': { q: '杨柳青年画' },
      '非遗元素适合哪些商业场景': { q: '非遗' },
      '天津传统色彩的应用指南': { q: '传统色' },
      '品牌与老字号共创的最佳实践': { q: '品牌', tags: ['联名'], tagMode: 'OR' },
    };
    let cfg = map[text] || { q: text };
    if (!map[text]) {
      const s = text;
      const checks: Array<{ match: string[]; q?: string; tags?: string[]; tagMode?: 'AND' | 'OR' }> = [
        { match: ['国潮', '国潮风格'], q: '国潮', tags: ['联名', '礼盒'], tagMode: 'OR' },
        { match: ['杨柳青年画', '杨柳青'], q: '杨柳青年画' },
        { match: ['非遗'], q: '非遗' },
        { match: ['传统色', '传统色彩', '中国红'], q: '传统色' },
        { match: ['联名'], q: (cfg.q || '品牌'), tags: ['联名'], tagMode: 'OR' },
        { match: ['礼盒'], q: (cfg.q || '包装'), tags: ['礼盒'], tagMode: 'OR' },
        { match: ['京剧'], q: '京剧', tags: ['戏曲'] },
        { match: ['海河'], q: '海河' },
        { match: ['同仁堂'], q: '同仁堂' },
        { match: ['景德镇'], q: '景德镇' },
      ];
      let q = cfg.q;
      const tags: string[] = [];
      let mode: 'AND' | 'OR' | undefined = undefined;
      for (const rule of checks) {
        if (rule.match.some((m) => s.includes(m))) {
          if (rule.q) q = rule.q;
          if (rule.tags) tags.push(...rule.tags);
          if (rule.tagMode) mode = rule.tagMode;
        }
      }
      cfg = { q, tags: Array.from(new Set(tags)), tagMode: mode };
    }
    const params = new URLSearchParams();
    if (cfg.q) params.set('q', cfg.q);
    if (cfg.tags && cfg.tags.length) params.set('tags', cfg.tags.join(','));
    if (cfg.tagMode) params.set('tagMode', cfg.tagMode);
    setSearch(cfg.q || text);
    // 中文注释：跳转前预取作品集页面
    prefetchExplore();
    navigate(`/explore?${params.toString()}`);
  };
  const recommended = [
    '国潮风格的品牌包装如何设计',
    '杨柳青年画如何现代化表达',
    '非遗元素适合哪些商业场景',
    '天津传统色彩的应用指南',
    '品牌与老字号共创的最佳实践'
  ];
  const gallery = [
    { id: 1, title: '桂发祥麻花包装焕新', category: '老字号品牌', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20mahua%20modern%20packaging%20design%2C%20cultural%20red%20and%20gold%2C%20studio%20lighting%2C%20high%20detail&image_size=landscape_4_3', likes: 256 },
    { id: 2, title: '狗不理联名海报', category: '视觉设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Goubuli%20steamed%20buns%20brand%20poster%20design', likes: 198 },
    { id: 3, title: '耳朵眼炸糕IP形象', category: 'IP设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20fried%20cake%20brand%20mascot%20illustration%2C%20cute%20IP%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3', likes: 312 },
    { id: 4, title: '果仁张秋季礼盒', category: '包装设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20candied%20chestnut%20autumn%20gift%20box%2C%20packaging%20design%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3', likes: 224 },
    { id: 5, title: '杨柳青年画主题插画', category: '插画', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Yangliuqing%20New%20Year%20Painting%20theme%20modern%20illustration', likes: 341 },
    { id: 6, title: '泥人张彩塑联名周边', category: '文创', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Nirenzhang%20clay%20sculpture%20collaboration%20merch%20design', likes: 187 }
  ];
  
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }), []);
  
  const itemVariants = useMemo(() => ({
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  }), []);

  // 预取首页常用页面的代码分片（在组件挂载后触发）
  useEffect(() => {
    const t = setTimeout(() => {
      prefetchExplore();
      prefetchTools();
      prefetchNeo();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <SidebarLayout>
      <motion.section 
        className={`relative flex-1 p-4 md:p-8 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* 中文注释：首页右下角新增“主题切换”按钮，便于快速更换头部样式（light/dark/pink 循环） */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-lg shadow-sm ring-1 transition-colors flex items-center ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 ring-gray-700 text-gray-100'
                : theme === 'pink'
                  ? 'bg-pink-50 hover:bg-pink-100 ring-pink-200 text-pink-800'
                  : 'bg-white hover:bg-gray-50 ring-gray-200 text-gray-900'
            }`}
            aria-label="切换主题"
            title="切换主题（浅色/深色/粉色）"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} mr-2`}></i>
            切换主题
          </button>
        </div>
        
        
        <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-8">
          {/* 首页主标题：采用渐变文字与更大的字号提升视觉吸引力 */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-snug mb-3 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent text-center">
            创作者，您好
          </h1>
          {/* 首页副标题：提升可读性（更大字号/行距），限制最大宽度，并根据主题切换不同灰度 */}
          <p className={`text-base md:text-lg leading-relaxed opacity-85 max-w-2xl text-center mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            {heroVariant === 'A' 
              ? '输入你的问题或灵感，我们帮你更快抵达答案与创作' 
              : '一句话描述创作目标，获得灵感、生成方案与优化建议'}
          </p>
          <div className={`rounded-3xl shadow-sm ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} p-4 md:p-6`}> 
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                  placeholder="请输入创作问题或灵感关键词"
                  className={`w-full px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-2 focus:ring-gray-500' : 'bg-white ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-300'} focus:outline-none text-base`}
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="search"
                  inputMode="text"
                />
                {search && (
                  <button
                    aria-label="清空输入"
                    title="清空"
                    onClick={() => { setSearch(''); setSelectedTags([]); }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'} hover:opacity-90`}
                  >清空</button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={handleInspireClick} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-colors flex items-center`}>
                  <i className="fas fa-bolt mr-1"></i>
                  灵感
                </button>
                <button onClick={handleGenerateClick} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-colors flex items-center`}>
                  <i className="fas fa-wand-magic-sparkles mr-1"></i>
                  生成
                </button>
                <button onClick={handleOptimizeClick} disabled={isOptimizing} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-colors ${isOptimizing ? 'opacity-60 cursor-not-allowed' : ''} flex items-center`}>
                  <i className="fas fa-adjust mr-1"></i>
                  {isOptimizing ? '优化中…' : '优化'}
                </button>
                <button onClick={toggleInspire} className={`px-4 py-2 rounded-lg text-sm ${inspireOn ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700' : 'bg-white'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-colors`}>
                  灵感加持 {inspireOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 scroll-mt-24">
              {quickTags.map((t, i) => {
                const active = selectedTags.includes(t);
                const base = 'ring-1 text-xs px-3 py-1 rounded-full';
                const activeCls = isDark ? 'bg-gray-700 text-white ring-gray-600' : 'bg-blue-50 text-blue-700 ring-blue-300';
                const normalCls = isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200';
                // 中文注释：使用按钮增强可访问性（支持键盘操作与aria状态）
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTag(t)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTag(t); } }}
                    className={`${base} ${active ? activeCls : normalCls}`}
                  >{t}</button>
                )
              })}
            </div>
            {/* 中文注释：PPPP—Prove（社会证明）与 Push（CTA） */}
            <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <i className="fas fa-users mr-1"></i> 已注册 12,536 人
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <i className="fas fa-image mr-1"></i> 作品集收录 2,148 项
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <i className="fas fa-handshake mr-1"></i> 品牌合作 36 次
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <i className="fas fa-star mr-1"></i> 满意度 96%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateClick}
                  className={`px-4 py-2 rounded-full ${isDark ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  立即开始创作
                </button>
                <button
                  onClick={handleExplore}
                  className={`px-4 py-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                >
                  浏览精选作品
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommended.map((r, idx) => (
              <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} flex items-center justify-between hover:bg-gray-50 transition-colors`}>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm md:text-base`}>{r}</span>
                <button onClick={() => handleRecommendedClick(r)} className="text-red-600 text-sm md:text-base px-2 py-1 rounded hover:bg-red-50 transition-colors">查看</button>
              </div>
            ))}
          </div>
        </motion.div>
        {(creativeDirections.length > 0 || generatedText || diagnosedIssues.length > 0) && (
          <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-10">
            {creativeDirections.length > 0 && (
              <div ref={creativeRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} mb-3`}>
                <div className="font-medium mb-2">创意方向</div>
                <div className="flex flex-wrap gap-2">
                  {creativeDirections.map((d, i) => (
                    <span key={i} className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} text-xs px-3 py-1 rounded-full`}>{d}</span>
                  ))}
                </div>
              </div>
            )}
            {generatedText && (
              <div ref={generatedRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} mb-3`}>
                <div className="font-medium mb-2">AI生成</div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap`}>{generatedText}</div>
                {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
              </div>
            )}
            {(diagnosedIssues.length > 0 || optimizationSummary) && (
              <div ref={optimizedRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}`}>
                <div className="font-medium mb-2">优化建议</div>
                {optimizationSummary && (
                  <div className={`mb-3 p-4 rounded-lg ${isDark ? 'bg-gray-700 ring-1 ring-gray-600' : 'bg-gray-50 ring-1 ring-gray-200'} `}>
                    <div className="text-sm font-semibold mb-2">AI优化说明</div>
                    <div aria-live="polite" className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-sm`}>
                      {renderOptimizationSummary(optimizationSummary)}
                    </div>
                  </div>
                )}
                <ul className="list-disc pl-5 text-sm">
                  {diagnosedIssues.map((d, i) => (
                    <li key={i} className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{d}</li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={speakOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-green-700 text-white' : 'bg-green-600 text-white'}`}>朗读建议</button>
                  <button onClick={copyOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-300'}`}>复制建议</button>
                  <button onClick={() => { prefetchTools(); navigate(`/tools?from=home&query=${encodeURIComponent(optimizationSummary || search)}`) }} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>应用到创作中心</button>
                </div>
                {optimizeAudioUrl && (<audio controls src={optimizeAudioUrl} className="mt-2 w-full" />)}
              </div>
            )}
          </motion.div>
        )}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">为你推荐</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-blue-600 hover:text-blue-700">去作品集</button>
        </motion.div>
        <motion.div ref={galleryRef} variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {gallery.map(item => (
            <motion.div 
              key={item.id} 
              className={`rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} cursor-pointer`} 
              whileHover={{ y: -4 }}
              role="button"
              tabIndex={0}
              onClick={() => {
                // 中文注释：卡片点击前预取作品集页面，优化跳转体验
                prefetchExplore();
                navigate(`/explore?q=${encodeURIComponent(item.title)}`)
              }}
              onMouseEnter={prefetchExplore}
              onFocus={prefetchExplore}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  prefetchExplore();
                  navigate(`/explore?q=${encodeURIComponent(item.title)}`)
                }
              }}
            >
              <div className="relative aspect-video">
                <TianjinImage src={item.thumbnail} alt={item.title} ratio="landscape" rounded="2xl" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'}`}>
                  <i className="far fa-heart mr-1"></i>{item.likes}
                </span>
              </div>
              <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm md:text-base">{item.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{item.category}</span>
                </div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>精选创作 · 高质量示例</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* 功能轮播 */}
        <motion.div 
          className="hidden"
          variants={itemVariants}
        >
          <div className="flex justify-center space-x-4 mb-8">
            {['attract', 'create', 'show', 'adopt'].map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`px-5 py-2 rounded-full transition-all ${
                  currentSection === section 
                    ? 'bg-red-600 text-white' 
                    : isDark 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {section === 'attract' && '吸引'}
                {section === 'create' && '共创'}
                {section === 'show' && '展示'}
                {section === 'adopt' && '采纳'}
              </button>
            ))}
          </div>
          
          <YangliuqingCard className={`${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {currentSection === 'attract' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">用户吸引</h3>
                  <p className="mb-4 opacity-80">
                    通过AI驱动的个性化推荐和丰富的文化内容，吸引用户参与平台创作，
                    激发青年群体对传统文化的兴趣与热爱。
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      个性化内容推荐
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      传统文化故事化呈现
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      互动式文化体验
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <img 
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Users%20gathering%20at%20cultural%20event%20with%20AI%20technology%2C%20vibrant%20colors%2C%20modern%20digital%20interface" 
                    alt="用户吸引" 
                    className="rounded-xl shadow-lg w-full h-64 object-cover"
                    loading="lazy" decoding="async"
                  />
                </div>
              </motion.div>
            )}
            
            {currentSection === 'create' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">AI共创</h3>
                  <p className="mb-4 opacity-80">
                    提供低门槛的AI创作工具，帮助用户轻松将传统文化元素融入现代设计，
                    实现文化与创意的完美结合。
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      一键国潮设计生成
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      老字号素材库
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      实时文化溯源提示
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <img 
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Designer%20using%20AI%20creation%20tools%20to%20blend%20traditional%20Chinese%20cultural%20elements%20with%20modern%20design" 
                    alt="AI共创" 
                    className="rounded-xl shadow-lg w-full h-64 object-cover"
                    loading="lazy" decoding="async"
                  />
                </div>
              </motion.div>
            )}
            
            {currentSection === 'show' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">作品展示</h3>
                  <p className="mb-4 opacity-80">
                    搭建多元化的作品展示平台，让优秀创作得到更多曝光和反馈，
                    形成活跃的创作者社区生态。
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      作品展示与点赞评论
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      创作者排行榜
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      创作者交流社区
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <img 
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Gallery%20showcase%20of%20creative%20works%20with%20digital%20displays%2C%20community%20engagement%2C%20modern%20exhibition%20space" 
                    alt="作品展示" 
                    className="rounded-xl shadow-lg w-full h-64 object-cover"
                    loading="lazy" decoding="async"
                  />
                </div>
              </motion.div>
            )}
            
            {currentSection === 'adopt' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">战略采纳</h3>
                  <p className="mb-4 opacity-80">
                    建立完善的作品评选和商业化落地机制，
                    推动优秀创意转化为实际商业价值，实现品牌与创作者的共赢。
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      优秀作品评选流程
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      品牌商业化对接
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      青年创意官认证
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <img 
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Business%20meeting%20about%20adopting%20creative%20works%20for%20commercialization%2C%20successful%20collaboration%20between%20brands%20and%20creators" 
                    alt="战略采纳" 
                    className="rounded-xl shadow-lg w-full h-64 object-cover"
                    loading="lazy" decoding="async"
                  />
                </div>
              </motion.div>
            )}
          </YangliuqingCard>
        </motion.div>
        
           {/* 天津特色区域 */}
           <motion.div 
             ref={tianjinRef}
             className="container mx-auto w-full relative z-10 mb-12 scroll-mt-24"
             variants={itemVariants}
           >
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold flex items-center">
                 <i className="fas fa-landmark text-blue-600 mr-2"></i>
                 天津特色专区
               </h3>
              <button 
                onClick={() => navigate('/tianjin')}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm"
              >
                 查看更多
                 <i className="fas fa-arrow-right ml-1"></i>
               </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}
                whileHover={{ y: -5 }}
                onClick={() => navigate('/tianjin')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/tianjin')
                  }
                }}
              >
                {/* 中文注释：卡片头部改为高质量图片，提升高级感 */}
                <div className="relative aspect-video">
                  <img
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Tianjin%20cultural%20heritage%20museum%20interior%2C%20warm%20premium%20lighting%2C%20modern%20minimal%20design%2C%20high%20detail"
                    alt="天津文化知识库封面"
                    className="w-full h-full object-cover"
                    loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
                </div>
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <h4 className="font-bold mb-2 text-sm md:text-base">天津文化知识库</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    探索天津独特的历史文化、非遗技艺和地方特色
                  </p>
                </div>
              </motion.div>
              <motion.div
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}
                whileHover={{ y: -5 }}
                onClick={() => navigate('/tianjin/activities')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/tianjin/activities')
                  }
                }}
              >
                {/* 中文注释：共创活动卡片使用现代工作室场景图片 */}
                <div className="relative aspect-video">
                  <img
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Creative%20co-creation%20workshop%2C%20premium%20studio%20lighting%2C%20designers%20collaborating%2C%20sleek%20minimal%20aesthetic%2C%20high%20detail"
                    alt="津味共创活动封面"
                    className="w-full h-full object-cover"
                    loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
                </div>
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <h4 className="font-bold mb-2 text-sm md:text-base">津味共创活动</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    参与天津特色主题创作活动，展示津门文化魅力
                  </p>
                </div>
              </motion.div>
              <motion.div
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}
                whileHover={{ y: -5 }}
                onClick={() => navigate('/create')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/create')
                  }
                }}
              >
                {/* 中文注释：方言指令创作卡片采用未来感AI界面视觉 */}
                <div className="relative aspect-video">
                  <img
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Futuristic%20AI%20interface%20with%20Chinese%20calligraphy%20elements%2C%20premium%20neon%20glow%2C%20dark%20sleek%20UI%2C%20high%20detail"
                    alt="方言指令创作封面"
                    className="w-full h-full object-cover"
                    loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
                </div>
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <h4 className="font-bold mb-2 text-sm md:text-base">方言指令创作</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    使用天津方言指令进行AI创作，体验独特的交互方式
                  </p>
                </div>
              </motion.div>
             </div>
           </motion.div>
      </motion.section>
      
      <Footer variant="full" />
      {/* 中文注释：首页右下角主题切换入口（与键盘 T 快捷键一致） */}
      <button
        aria-label="切换主题"
        title="切换主题（快捷键：T）"
        onClick={toggleTheme}
        className={`fixed right-4 bottom-20 md:bottom-6 z-40 p-3 rounded-full shadow-lg ring-1 transition-colors ${isDark ? 'bg-gray-800 text-yellow-300 ring-gray-700 hover:bg-gray-700' : 'bg-white text-gray-900 ring-gray-200 hover:bg-gray-50'}`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) / 2)' }}
      >
        <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
      </button>
    </SidebarLayout>
  );
}
  // 简易Markdown渲染（仅支持 ### 标题、- 列表、数字序号、**加粗**）
  const renderOptimizationSummary = (text: string) => {
    if (!text.trim()) return null;
    const lines = text.split(/\r?\n/);
    const elements: JSX.Element[] = [];
    let ul: string[] = [];
    let ol: string[] = [];

    const flushLists = () => {
      if (ul.length) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
            {ul.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </ul>
        );
        ul = [];
      }
      if (ol.length) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-1">
            {ol.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </ol>
        );
        ol = [];
      }
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { continue; }
      if (line.startsWith('###')) {
        flushLists();
        const title = line.replace(/^###\s*/, '');
        elements.push(<h3 key={`h-${elements.length}`} className="text-base font-semibold mb-2">{title}</h3>);
        continue;
      }
      if (/^\d+\./.test(line)) { ol.push(line.replace(/^\d+\.\s*/, '')); continue; }
      if (line.startsWith('- ')) { ul.push(line.replace(/^-\s*/, '')); continue; }
      flushLists();
      elements.push(
        <p key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      );
    }
    flushLists();

    return (
      <div className="space-y-2 leading-relaxed">
        {elements}
      </div>
    );
  };
  // 预取函数：提前加载常用页面的代码分片
  const prefetchExplore = () => {
    if (!isPrefetched('Explore')) {
      import('@/pages/Explore').then(() => markPrefetched('Explore', 120000)).catch(() => {});
    }
  };
  const prefetchTools = () => {
    if (!isPrefetched('Tools')) {
      import('@/pages/Tools').then(() => markPrefetched('Tools', 120000)).catch(() => {});
    }
  };
  const prefetchNeo = () => {
    if (!isPrefetched('Neo')) {
      import('@/pages/Neo').then(() => markPrefetched('Neo', 120000)).catch(() => {});
    }
  };

  
