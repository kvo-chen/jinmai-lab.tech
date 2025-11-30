import http from 'http'
import { URL } from 'url'
import fs from 'fs'

const PORT = 3001
const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'

// Kimi (Moonshot) config
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_API_KEY = process.env.KIMI_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
// DashScope (Aliyun Qwen) config
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_MODEL_ID = process.env.DASHSCOPE_MODEL_ID || 'qwen-plus'

// Qianfan (Wenxin Yiyan) config
const QIANFAN_BASE_URL = process.env.QIANFAN_BASE_URL || 'https://qianfan.baidubce.com'
const QIANFAN_MODEL_ID = process.env.QIANFAN_MODEL_ID || 'ERNIE-Speed-8K'
const QIANFAN_AUTH = process.env.QIANFAN_AUTH || ''
const QIANFAN_ACCESS_TOKEN = process.env.QIANFAN_ACCESS_TOKEN || ''
const QIANFAN_AK = process.env.QIANFAN_AK || process.env.BAIDU_AK || ''
const QIANFAN_SK = process.env.QIANFAN_SK || process.env.BAIDU_SK || ''

// Load .env.local for local development (non-production)
try {
  const rawPath = new URL('../.env.local', import.meta.url).pathname
  const envPath = decodeURIComponent(rawPath)
  const cwdPath = `${process.cwd()}/.env.local`
  const finalPath = fs.existsSync(envPath) ? envPath : (fs.existsSync(cwdPath) ? cwdPath : '')
  if (finalPath) {
    const content = fs.readFileSync(finalPath, 'utf-8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      const k = m[1]
      const v = m[2]
      // 始终以 .env.local 内容为准进行覆盖，确保密钥更新生效
      process.env[k] = v
    }
    // 将前端变量映射到服务端使用的变量（无条件覆盖，避免旧值残留）
    if (process.env.VITE_KIMI_API_KEY) {
      process.env.KIMI_API_KEY = process.env.VITE_KIMI_API_KEY
    }
    if (process.env.VITE_KIMI_BASE_URL) {
      process.env.KIMI_BASE_URL = process.env.VITE_KIMI_BASE_URL
    }
    if (process.env.VITE_DEEPSEEK_API_KEY) {
      process.env.DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY
    }
    if (process.env.VITE_KIMI_BASE_URL) {
      process.env.KIMI_BASE_URL = process.env.VITE_KIMI_BASE_URL
    }
    // 映射 Doubao 相关变量，便于前端配置生效
    if (process.env.VITE_DOUBAO_API_KEY) {
      process.env.DOUBAO_API_KEY = process.env.VITE_DOUBAO_API_KEY
    }
    if (process.env.VITE_DOUBAO_BASE_URL) {
      process.env.DOUBAO_BASE_URL = process.env.VITE_DOUBAO_BASE_URL
    }
    // 映射 DeepSeek 相关变量，支持前端环境变量
    if (process.env.VITE_DEEPSEEK_API_KEY) {
      process.env.DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY
    }
    if (process.env.VITE_DEEPSEEK_BASE_URL) {
      process.env.DEEPSEEK_BASE_URL = process.env.VITE_DEEPSEEK_BASE_URL
    }
  }
} catch {}

// Volcengine TTS config (server-side only)
const VOLC_TTS_APP_ID = process.env.VOLC_TTS_APP_ID || ''
const VOLC_TTS_ACCESS_TOKEN = process.env.VOLC_TTS_ACCESS_TOKEN || ''
const VOLC_TTS_SECRET_KEY = process.env.VOLC_TTS_SECRET_KEY || ''
const VOLC_TTS_ENDPOINT = process.env.VOLC_TTS_ENDPOINT || ''

// Qianfan auth cache
let __qf_token = (process.env.QIANFAN_ACCESS_TOKEN || '')
let __qf_token_expire = 0

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

async function proxyFetch(path, method, body) {
  const base = process.env.DOUBAO_BASE_URL || BASE_URL
  const key = process.env.DOUBAO_API_KEY || API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function kimiFetch(path, method, body) {
  const base = process.env.KIMI_BASE_URL || KIMI_BASE_URL
  const key = process.env.KIMI_API_KEY || KIMI_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function deepseekFetch(path, method, body) {
  const base = process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL
  const key = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}
async function dashscopeFetch(path, method, body) {
  const base = process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL
  const key = process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function qianfanAuthHeader() {
  const override = process.env.QIANFAN_AUTH || QIANFAN_AUTH
  if (override && override.startsWith('bce-v3')) return override
  const preset = process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN
  const now = Math.floor(Date.now() / 1000)
  if (preset) return `Bearer ${preset}`
  if (__qf_token && __qf_token_expire > now + 60) return `Bearer ${__qf_token}`
  const ak = process.env.QIANFAN_AK || QIANFAN_AK
  const sk = process.env.QIANFAN_SK || QIANFAN_SK
  if (!ak || !sk) return ''
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(ak)}&client_secret=${encodeURIComponent(sk)}`
  const resp = await fetch(url, { method: 'GET' })
  const data = await resp.json()
  const token = data?.access_token || ''
  const expiresIn = Number(data?.expires_in || 0)
  if (token) {
    __qf_token = token
    __qf_token_expire = now + (expiresIn || 0)
    return `Bearer ${token}`
  }
  return ''
}

async function qianfanFetch(path, method, body) {
  const base = process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL
  const auth = await qianfanAuthHeader()
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers['Authorization'] = auth
  const resp = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

// Basic rate limiter per IP for TTS
const rateMap = new Map()
function allowTts(ip) {
  const now = Date.now()
  const rec = rateMap.get(ip) || { count: 0, windowStart: now }
  if (now - rec.windowStart > 60_000) { rec.windowStart = now; rec.count = 0 }
  rec.count += 1
  rateMap.set(ip, rec)
  return rec.count <= 20
}

// Volcengine TTS fetcher: delegates to provided endpoint with token
async function volcTtsSynthesize({ text, voice, speed, pitch, format }) {
  if (!VOLC_TTS_ENDPOINT || !VOLC_TTS_ACCESS_TOKEN) {
    return { ok: false, status: 500, data: { error: 'CONFIG_MISSING' } }
  }
  const payload = {
    text: String(text || '').slice(0, 2000),
    voice: voice || 'female',
    speed: typeof speed === 'number' ? speed : 1.0,
    pitch: typeof pitch === 'number' ? pitch : 1.0,
    app_id: VOLC_TTS_APP_ID || undefined,
    secret_key: VOLC_TTS_SECRET_KEY ? undefined : undefined,
    audio_format: format || 'mp3'
  }
  const resp = await fetch(VOLC_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOLC_TTS_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload)
  })
  const ct = resp.headers.get('content-type') || ''
  if (ct.startsWith('audio/')) {
    const buf = Buffer.from(await resp.arrayBuffer())
    const audio_base64 = buf.toString('base64')
    return { ok: true, status: 200, data: { audio_base64, content_type: ct } }
  }
  const data = ct.includes('application/json') ? await resp.json() : await resp.text()
  return { ok: resp.ok, status: resp.status, data }
}

// Proxy remote binary (video/audio/image) with Range support
async function proxyBinary(remoteUrl, req, res) {
  try {
    const range = req.headers['range'] || undefined
    const headers = { ...(range ? { Range: range } : {}) }
    const resp = await fetch(remoteUrl, { method: 'GET', headers })
    if (!resp.ok) {
      const ct = resp.headers.get('content-type') || 'application/json'
      res.statusCode = resp.status
      res.setHeader('Content-Type', ct)
      const data = ct.includes('application/json') ? await resp.json() : await resp.text()
      res.end(typeof data === 'string' ? data : JSON.stringify(data))
      return
    }
    const ct = resp.headers.get('content-type') || 'application/octet-stream'
    const cl = resp.headers.get('content-length') || undefined
    const cr = resp.headers.get('content-range') || undefined
    const ar = resp.headers.get('accept-ranges') || undefined
    res.statusCode = resp.status
    res.setHeader('Content-Type', ct)
    if (cl) res.setHeader('Content-Length', cl)
    if (cr) res.setHeader('Content-Range', cr)
    if (ar) res.setHeader('Accept-Ranges', ar)
    const buf = Buffer.from(await resp.arrayBuffer())
    res.end(buf)
  } catch (e) {
    sendJson(res, 500, { error: 'PROXY_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  const u = new URL(req.url, `http://localhost:${PORT}`)
  const path = u.pathname

  // Skip global Doubao key check; validate per-route

  try {
    // 简单内存收藏状态（教程收藏），仅用于本地开发演示
    globalThis.__tutorialFavorites = globalThis.__tutorialFavorites || new Set()
    const favSet = globalThis.__tutorialFavorites

    if (req.method === 'GET' && path === '/api/favorites/tutorials') {
      sendJson(res, 200, { ok: true, ids: Array.from(favSet) })
      return
    }

    if (req.method === 'POST' && path === '/api/favorites/tutorials/toggle') {
      const b = await readBody(req)
      const id = Number(b?.id)
      if (!id || Number.isNaN(id)) { sendJson(res, 400, { error: 'ID_INVALID' }); return }
      if (favSet.has(id)) favSet.delete(id); else favSet.add(id)
      sendJson(res, 200, { ok: true, ids: Array.from(favSet) })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/images/generate') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || MODEL_ID,
        prompt: b.prompt,
        size: b.size || '1024x1024',
        n: b.n || 1,
        seed: b.seed,
        guidance_scale: b.guidance_scale,
        response_format: b.response_format || 'url',
        watermark: b.watermark,
      }
      const r = await proxyFetch('/images/generations', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/chat/completions') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const msgs = Array.isArray(b.messages) ? b.messages.map((m) => {
        const content = Array.isArray(m?.content) ? m.content.map((it) => {
          if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
          if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
          return it
        }) : []
        return { role: m?.role || 'user', content }
      }) : []
      const maxTokens = typeof b.max_tokens === 'number'
        ? b.max_tokens
        : (typeof b.max_completion_tokens === 'number' ? b.max_completion_tokens : undefined)
      const payload = { model: b.model || MODEL_ID, messages: msgs, max_tokens: maxTokens, temperature: b.temperature, top_p: b.top_p, stream: b.stream }
      const r = await proxyFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Kimi (Moonshot) chat completions proxy
    if (req.method === 'POST' && path === '/api/kimi/chat/completions') {
      const keyPresent = (process.env.KIMI_API_KEY || KIMI_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'moonshot-v1-32k',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await kimiFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/deepseek/chat/completions') {
      const keyPresent = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'deepseek-chat',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await deepseekFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }
    if (req.method === 'POST' && path === '/api/dashscope/chat/completions') {
      const keyPresent = (process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || DASHSCOPE_MODEL_ID,
        messages: Array.isArray(b.messages) ? b.messages : [],
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await dashscopeFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Qianfan (Wenxin Yiyan) chat completions proxy
    if (req.method === 'POST' && path === '/api/qianfan/chat/completions') {
      const hasCfg = (process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK)
      if (!hasCfg) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const messages = Array.isArray(b.messages) ? b.messages.map((m) => ({ role: m?.role || 'user', content: String(m?.content || '').replace(/`/g, '').trim() })) : []
      const payload = {
        model: b.model || QIANFAN_MODEL_ID,
        messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await qianfanFetch('/v2/chat/completions', 'POST', payload)
      if (!r.ok) {
        const code = (r.data?.error?.code) || (r.data?.error_msg) || 'SERVER_ERROR'
        const hint = String(code).includes('invalid_iam_token') ? 'QIANFAN_AUTH 无法用于 chat 接口，请改用 QIANFAN_ACCESS_TOKEN 或设置 QIANFAN_AK/QIANFAN_SK 以自动获取 token' : undefined
        sendJson(res, r.status, { error: code, hint, data: r.data })
        return
      }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/videos/tasks') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const content = Array.isArray(b.content) ? b.content.map((it) => {
        if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
        if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
        return it
      }) : []
      const payload = { model: b.model || MODEL_ID, content }
      const r = await proxyFetch('/contents/generations/tasks', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'GET' && path.startsWith('/api/doubao/videos/tasks/')) {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const id = path.split('/').pop() || ''
      const r = await proxyFetch(`/contents/generations/tasks/${id}`, 'GET')
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/volc/tts/synthesize') {
      const ip = req.socket.remoteAddress || 'unknown'
      if (!allowTts(ip)) { sendJson(res, 429, { error: 'RATE_LIMITED' }); return }
      const b = await readBody(req)
      const text = String(b.text || '').trim()
      if (!text) { sendJson(res, 400, { error: 'TEXT_EMPTY' }); return }
      if (text.length > 2000) { sendJson(res, 400, { error: 'TEXT_TOO_LONG' }); return }

      const r = await volcTtsSynthesize({ text, voice: b.voice, speed: b.speed, pitch: b.pitch, format: b.format })
      if (!r.ok) { sendJson(res, r.status, r.data); return }

      const { audio_base64, content_type } = r.data || {}
      sendJson(res, 200, { ok: true, audio_base64, content_type: content_type || 'audio/mpeg' })
      return
    }

    if (req.method === 'GET' && path === '/api/proxy/video') {
      const remote = (new URL(req.url, `http://localhost:${PORT}`)).searchParams.get('url') || ''
      const safe = remote.startsWith('https://') && (remote.includes('volces.com') || remote.includes('tos-cn-beijing'))
      if (!safe) { sendJson(res, 400, { error: 'URL_NOT_ALLOWED' }); return }
      await proxyBinary(remote, req, res)
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND' })
  } catch (e) {
    sendJson(res, 500, { error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
})

server.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`)
})
