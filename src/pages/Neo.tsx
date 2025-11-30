import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { scoreAuthenticity } from '@/services/authenticityService'
import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'
import llmService from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { toast } from 'sonner'
import errorService from '@/services/errorService'
import doubao from '@/services/doubao'
import { createVideoTask, pollVideoTask } from '@/services/doubao'

const BRAND_STORIES: Record<string, string> = {
  mahua: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
  baozi: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
  niuren: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
  erduoyan: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
  laomeihua: '老美华鞋店始于民国时期，保留传统手工缝制技艺与“舒适耐穿”的品牌口碑。',
  dafulai: '大福来锅巴菜以糊辣香浓著称，讲究火候与调和，口感层次丰富。',
  guorenzhang: '果仁张为百年坚果老字号，以糖炒栗子闻名，香甜适口、粒粒饱满。',
  chatangli: '茶汤李源自清末，茶汤细腻柔滑、甘香回甜，是老天津的温暖记忆。'
}

const TAGS = ['国潮', '杨柳青年画', '传统纹样', '红蓝配色']

export default function Neo() {
  const { isDark } = useTheme()
  const location = useLocation()
  const [brand, setBrand] = useState('mahua')
  const [story, setStory] = useState(BRAND_STORIES['mahua'])
  const [tags, setTags] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showOutput, setShowOutput] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optStatus, setOptStatus] = useState<'idle'|'running'|'done'>('idle')
  const [optPreview, setOptPreview] = useState('')
  const [lastUserPrompt, setLastUserPrompt] = useState('')
  const [lastOptimizedPrompt, setLastOptimizedPrompt] = useState('')
  const [engine, setEngine] = useState<'sdxl' | 'doubao'>('sdxl')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [videoByIndex, setVideoByIndex] = useState<string[]>([])
  const [ttsUrl, setTtsUrl] = useState('')
  const [useCustomBrand, setUseCustomBrand] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const engineCardRef = useRef<HTMLDivElement | null>(null)
  const optTimerRef = useRef<any>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('query') || ''
    const from = params.get('from') || ''
    if (q) setPrompt(q)
    if (from === 'home') {
      engineCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.search])

  useEffect(() => {
    return () => { if (optTimerRef.current) clearTimeout(optTimerRef.current) }
  }, [])

  const updateStory = (val: string) => {
    setBrand(val)
    const s = BRAND_STORIES[val]
    if (s) setStory(s)
    else setStory(val ? `为 ${val} 创作的灵感简介，请结合品牌特色与天津文化。` : '')
  }

  const optimizePrompt = async () => {
    const base = prompt.trim()
    if (!base) { toast.warning('请输入提示词'); return }
    setOptimizing(true)
    setOptStatus('running')
    setOptPreview('')
    setLastUserPrompt(base)
    const prev = llmService.getCurrentModel().id
    const prevStream = llmService.getConfig().stream
    try {
      if (prev !== 'deepseek') llmService.setCurrentModel('deepseek')
      llmService.updateConfig({ stream: true })
      const context = `${base} ${tags.join(' ')} ${brand}`.trim()
      const instruction = `请将以下提示词优化为更清晰、可直接用于AI绘图的单句提示，包含主体、风格、构图、细节、光影、材质、配色，避免解释：\n${context}`
      const final = await llmService.generateResponse(instruction, { onDelta: (chunk: string) => setOptPreview(chunk) })
      const text = (final || base).trim()
      setPrompt(text)
      setLastOptimizedPrompt(text)
      setOptStatus('done')
      if (final && !/未配置密钥|返回模拟响应/.test(final)) {
        toast.success('已用DeepSeek优化提示词')
      } else {
        toast.info('已使用模拟响应优化提示词')
      }
    } catch (e: any) {
      toast.error(e?.message || '优化失败')
    } finally {
      llmService.setCurrentModel(prev)
      llmService.updateConfig({ stream: prevStream })
      setOptimizing(false)
    }
  }

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const genImages = (extra: string = '') => {
    const base = `${prompt} ${tags.join(' ')} ${brand} ${extra}`.trim() || 'Tianjin cultural design'
    return [
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant A')}&image_size=square`,
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant B')}&image_size=square`,
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant C')}&image_size=square`,
    ]
  }

  const startGeneration = () => {
    setShowOutput(true)
    setImages([])
    setProgress(0)
    setAiText('')
    setIsGenerating(true)
    const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
    try {
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
    } catch {}
    let timer: any = setInterval(() => {
      setProgress(p => Math.min(95, p + 4))
    }, 80)
    llmService.generateResponse(input, {
      onDelta: (chunk: string) => setAiText(chunk)
    }).then(final => {
      clearInterval(timer)
      setProgress(100)
      if (engine === 'doubao') {
        doubao.generateImage({ prompt: (final || input), size: '1024x1024', n: 3, response_format: 'b64_json', watermark: true }).then(r => {
          const list = (r as any)?.data?.data || []
          const urls = list.map((d: any) => {
            if (d?.url) return d.url
            if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`
            return ''
          }).filter((u: string) => !!u)
          if (urls.length === 0) {
            toast.info('豆包未返回图片，已提供占位图')
            setImages(genImages(final))
            setVideoByIndex(new Array(3).fill(''))
          } else {
            setImages(urls)
            setVideoByIndex(new Array(urls.length).fill(''))
            toast.success('豆包生图完成')
          }
        }).catch((e) => {
          errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-doubao', prompt: final || input })
          toast.error('豆包生图失败，已回退为占位图')
          setImages(genImages(final))
          setVideoByIndex(new Array(3).fill(''))
        })
      } else {
        setImages(genImages(final))
      }
      const r = scoreAuthenticity(final || prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).catch(() => {
      clearInterval(timer)
      setProgress(100)
      const imgs = genImages()
      setImages(imgs)
      const r = scoreAuthenticity(prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).finally(() => {
      setIsGenerating(false)
    })
  }

  const buildText = (p: string, t: string[], b: string) => {
    const base = `${p} ${t.join(' ')} ${b}`.trim()
    return `${base || 'Tianjin cultural design'}  --resolution 720p  --duration 5 --camerafixed false`
  }

  const genVideoAt = async (idx: number) => {
    const src = images[idx] || ''
    if (!src || src.startsWith('data:')) {
      toast.error('首帧需使用可公网访问的图片URL')
      return
    }
    const text = buildText(prompt, tags, brand)
    setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '生成中...' : v)))
    try {
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: src } }] })
      if (!created.ok || !created.data?.id) {
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : '创建失败'
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const polled = await pollVideoTask(created.data.id, { intervalMs: 10000, timeoutMs: 600000 })
      if (!polled.ok) {
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : (polled.error || '查询失败')
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const url = polled.data?.content?.video_url || ''
      if (polled.data?.status === 'succeeded' && url) {
        toast.success('视频生成完成')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? url : v)))
      } else {
        toast.error('视频生成失败')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
      }
    } catch (e: any) {
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-video' })
      toast.error('视频生成异常')
      setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
    }
  }

  const testDoubaoVQA = async () => {
    setQaLoading(true)
    setQaAnswer('')
    try {
      const r = await doubao.chatCompletions({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg' } },
              { type: 'text', text: '图片主要讲了什么?' }
            ]
          }
        ]
      })
      const content = (r as any)?.data?.choices?.[0]?.message?.content || ''
      setQaAnswer(content || '（无返回内容）')
    } catch {
      setQaAnswer('调用失败，请检查服务端环境变量或网络')
    } finally {
      setQaLoading(false)
    }
  }

  return (
    <SidebarLayout>
      <main className="relative container mx-auto px-6 md:px-8 py-12">
        <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto space-y-8">
          <div ref={engineCardRef} className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg白'} p-6 mb-6`}>
            <h1 className="text-2xl font-bold mb-2">津门 · 灵感引擎</h1>
            <div className="w-20 h-1 rounded-full bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 mb-4"></div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm">生成引擎</span>
              <div className="flex gap-2">
                <button onClick={() => setEngine('sdxl')} className={`px-3 py-1.5 rounded-full text-sm ${engine==='sdxl' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>SDXL</button>
                <button onClick={() => setEngine('doubao')} className={`px-3 py-1.5 rounded-full text-sm ${engine==='doubao' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>Doubao</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm mb-2 block">选择品牌</label>
                <select
                  value={useCustomBrand ? 'custom' : brand}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'custom') {
                      setUseCustomBrand(true)
                      const val = customBrand.trim()
                      if (val) {
                        updateStory(val)
                      } else {
                        setBrand('')
                        setStory('请输入品牌名称进行创作')
                      }
                    } else {
                      setUseCustomBrand(false)
                      updateStory(v)
                    }
                  }}
                  className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:outline-none`}
                >
                  <option value="mahua">桂发祥十八街麻花</option>
                  <option value="baozi">狗不理包子</option>
                  <option value="niuren">泥人张彩塑</option>
                  <option value="erduoyan">耳朵眼炸糕</option>
                  <option value="laomeihua">老美华鞋店</option>
                  <option value="dafulai">大福来锅巴菜</option>
                  <option value="guorenzhang">果仁张糖炒栗子</option>
                  <option value="chatangli">茶汤李茶汤</option>
                  <option value="custom">自定义品牌</option>
                </select>
                {useCustomBrand && (
                  <input
                    value={customBrand}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomBrand(val)
                      updateStory(val)
                    }}
                    placeholder="输入品牌名称（支持自定义）"
                    className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} w-full mt-2 px-3 py-2 rounded-lg border focus:outline-none`}
                  />
                )}
              </div>

              <div>
                <label className="text-sm mb-2 block">创作标签</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => {
                    const active = tags.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          active
                            ? isDark
                              ? 'border-red-500 text-red-400 bg-red-900 bg-opacity-20'
                              : 'border-red-500 text-red-600 bg-red-50'
                            : isDark
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

          <div className={`text-sm p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
            {story}
          </div>

            <textarea
              value={prompt}
              onChange={(e) => { const v = e.target.value; setPrompt(v); if (optTimerRef.current) clearTimeout(optTimerRef.current); optTimerRef.current = setTimeout(() => { if (v.trim() && !optimizing && v.trim() !== lastOptimizedPrompt.trim()) optimizePrompt() }, 1200) }}
              onBlur={() => { if (prompt.trim() && !optimizing) optimizePrompt() }}
              placeholder="[AI引导]：掌柜的，您想怎么改？(输入语音或文字)"
              className={`w-full h-28 px-3 py-2 rounded-lg border mb-4 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
            />
            {(optimizing || optStatus !== 'idle') && (
              <div className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-live="polite">
                {optimizing ? '优化中…' : (optStatus === 'done' ? '已优化' : '准备优化')}
              </div>
            )}
            {optPreview && optimizing && (
              <div className={`text-xs rounded p-2 mb-2 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{optPreview}</div>
            )}

            <button
              onClick={startGeneration}
              className="w-full bg-red-600 hover:bg-red-700 text白 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              注入灵感
            </button>
            <div className="mt-3">
              <button
                onClick={optimizePrompt}
                disabled={optimizing || isGenerating}
                className={`w-full ${isDark ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {optimizing ? 'DeepSeek优化中…' : '优化提示词（DeepSeek）'}
              </button>
              {lastUserPrompt && lastOptimizedPrompt && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => { setPrompt(lastUserPrompt); setOptStatus('idle'); setOptPreview(''); toast.success('已撤销优化') }}
                    className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                  >撤销优化</button>
                </div>
              )}
            </div>
            {engine === 'doubao' && (
              <div className="mt-4">
                <button
                  onClick={testDoubaoVQA}
                  className={`w-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-4 py-2 rounded-lg transition-colors`}
                  disabled={qaLoading}
                >
                  {qaLoading ? '豆包图文问答测试中…' : '豆包图文问答测试'}
                </button>
                {qaAnswer && (
                  <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{qaAnswer}</div>
                )}
              </div>
            )}
          </div>

          {showOutput && (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
              <div className="h-1 rounded bg-gray-300 overflow-hidden mb-4">
                <div className="h-full bg-red-600 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {images.map((src, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <TianjinImage src={src} alt="result" ratio="square" rounded="xl" />
                    <div className="p-3">
                      <button onClick={() => genVideoAt(i)} className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}>生成视频</button>
                      {videoByIndex[i] && (
                        videoByIndex[i].startsWith('http') ? (
                          <div className="mt-2">
                            <a href={videoByIndex[i]} target="_blank" rel="noreferrer" className="text-xs break-all text-blue-600">{videoByIndex[i]}</a>
                            <video controls src={`/api/proxy/video?url=${encodeURIComponent(videoByIndex[i])}`} className="w-full mt-2 rounded" />
                          </div>
                        ) : (
                          <div className={`mt-2 text-xs break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{videoByIndex[i]}</div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-lg font-bold mb-2">纯正性评分：{score}</div>
              {feedback.length > 0 && (
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{feedback.join('；')}</div>
              )}
            </div>
          )}
          <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 mt-6`}>
            <div className="font-bold mb-3">AI建议</div>
            {aiDirections.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {aiDirections.map((d, i) => (
                  <button key={i} onClick={() => toggleTag(d)} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>点击“注入灵感”以获取建议</div>
            )}
            <div className="font-bold mb-2">AI文案</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap min-h-24`}>{aiText}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('请先生成文案或填写提示'); return } try { const r = await voiceService.synthesize(base, { format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } }} className="text-sm px-3 py-1 rounded-md bg-green-600 text-white" disabled={!aiText.trim() && !prompt.trim()}>朗读</button>
              {ttsUrl && (<audio controls src={ttsUrl} className="w-full" />)}
            </div>
            {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
          </div>
        </div>
      </main>
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto flex justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>© 2025 AI共创平台. 保留所有权利</p>
          <div className="flex space-x-6">
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </SidebarLayout>
  )
}
