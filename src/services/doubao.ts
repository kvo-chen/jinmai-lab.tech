import apiClient from '@/lib/apiClient'

export type DoubaoGenerateParams = {
  prompt: string
  size?: string
  n?: number
  seed?: number
  guidance_scale?: number
  response_format?: 'url' | 'b64_json'
  watermark?: boolean
  model?: string
}

export type DoubaoGenerateResponse = {
  ok: boolean
  data?: any
  error?: string
}

export async function generateImage(params: DoubaoGenerateParams): Promise<DoubaoGenerateResponse> {
  const resp = await apiClient.post<DoubaoGenerateResponse, DoubaoGenerateParams>('/api/doubao/images/generate', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoGenerateResponse
}

export type DoubaoMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type DoubaoMessage = {
  role: 'system' | 'user' | 'assistant'
  content: DoubaoMessageContent[]
}

export type DoubaoChatParams = {
  model?: string
  messages: DoubaoMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

export type DoubaoChatResponse = {
  ok: boolean
  data?: any
  error?: string
}

export async function chatCompletions(params: DoubaoChatParams): Promise<DoubaoChatResponse> {
  const resp = await apiClient.post<DoubaoChatResponse, DoubaoChatParams>('/api/doubao/chat/completions', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoChatResponse
}

export default { generateImage, chatCompletions }

export type DoubaoVideoContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type DoubaoVideoCreateParams = {
  model?: string
  content: DoubaoVideoContent[]
}

export type DoubaoVideoTaskCreateResponse = {
  ok: boolean
  data?: { id: string; status: string }
  error?: string
}

export type DoubaoVideoTaskGetResponse = {
  ok: boolean
  data?: {
    id: string
    model: string
    status: string
    content?: { video_url?: string; last_frame_url?: string }
    usage?: { completion_tokens?: number; total_tokens?: number }
    created_at?: number
    updated_at?: number
    error?: { code?: string; message?: string } | null
  }
  error?: string
}

export async function createVideoTask(params: DoubaoVideoCreateParams): Promise<DoubaoVideoTaskCreateResponse> {
  const resp = await apiClient.post<DoubaoVideoTaskCreateResponse, DoubaoVideoCreateParams>('/api/doubao/videos/tasks', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoVideoTaskCreateResponse
}

export async function getVideoTask(taskId: string): Promise<DoubaoVideoTaskGetResponse> {
  const resp = await apiClient.get<DoubaoVideoTaskGetResponse>(`/api/doubao/videos/tasks/${taskId}`, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoVideoTaskGetResponse
}

export async function pollVideoTask(taskId: string, opts?: { intervalMs?: number; timeoutMs?: number }): Promise<DoubaoVideoTaskGetResponse> {
  const intervalMs = opts?.intervalMs ?? 10000
  const timeoutMs = opts?.timeoutMs ?? 600000
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const r = await getVideoTask(taskId)
    if (!r.ok) return r
    const s = r.data?.status
    if (s === 'succeeded' || s === 'failed' || s === 'cancelled') return r
    await new Promise((res) => setTimeout(res, intervalMs))
  }
  return { ok: false, error: 'TIMEOUT' }
}

export const video = { createVideoTask, getVideoTask, pollVideoTask }
