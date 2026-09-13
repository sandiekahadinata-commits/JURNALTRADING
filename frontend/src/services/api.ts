import type { ApiEnvelope, ApiErrorShape } from '@/types/api.types'

const API_BASE = '/api/journal'
const GET_ATTEMPTS = 4
const POST_ATTEMPTS = 1

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseEnvelope<T>(text: string): ApiEnvelope<T> | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed) as ApiEnvelope<T>
    if (typeof parsed === 'object' && parsed !== null && 'ok' in parsed) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function notifyUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('journal:unauthorized'))
  }
}

async function requestOnce<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...init })
  const text = await response.text()
  const envelope = parseEnvelope<T>(text)

  if (!envelope) {
    if (response.status === 401) {
      notifyUnauthorized()
      throw new ApiError('UNAUTHORIZED', 'Sesi berakhir. Silakan login kembali.')
    }
    throw new ApiError(
      'BAD_RESPONSE',
      'Respons dari server tidak valid (server sedang sibuk). Coba lagi.',
    )
  }

  if (envelope.ok) return envelope.data

  const error: ApiErrorShape = envelope.error
  if (error.code === 'UNAUTHORIZED') notifyUnauthorized()
  throw new ApiError(error.code, error.message)
}

async function requestWithRetry<T>(
  url: string,
  init: RequestInit | undefined,
  attempts: number,
): Promise<T> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestOnce<T>(url, init)
    } catch (err) {
      lastError = err
      if (err instanceof ApiError && err.code !== 'BAD_RESPONSE') {
        throw err
      }
      if (attempt < attempts) {
        await sleep(600 * attempt)
      }
    }
  }

  if (lastError instanceof ApiError) throw lastError
  throw new ApiError(
    'NETWORK',
    'Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.',
  )
}

export function apiGet<T>(
  action: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const search = new URLSearchParams({ action })
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value))
    }
  }
  return requestWithRetry<T>(`${API_BASE}?${search.toString()}`, { method: 'GET' }, GET_ATTEMPTS)
}

export function apiPost<T>(action: string, payload?: unknown): Promise<T> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload: payload ?? {} }),
  }
  return requestWithRetry<T>(API_BASE, init, POST_ATTEMPTS)
}
