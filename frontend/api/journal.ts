import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getEnv, isAuthenticated, jsonResponse } from './_lib.js'

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts: number,
  timeoutMs: number,
): Promise<Response> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } catch (err) {
      lastError = err
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Gagal menghubungi backend.')
}

async function passthrough(res: VercelResponse, upstream: Response): Promise<void> {
  const text = await upstream.text()
  let parsed: unknown = null
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }
  if (parsed && typeof parsed === 'object' && 'ok' in parsed) {
    jsonResponse(res, 200, parsed)
    return
  }
  jsonResponse(res, 502, {
    ok: false,
    error: { code: 'BAD_UPSTREAM', message: 'Respons dari backend tidak valid.' },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!isAuthenticated(req)) {
    jsonResponse(res, 401, {
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Sesi tidak valid. Silakan login.' },
    })
    return
  }

  let apiUrl: string
  let token: string
  try {
    apiUrl = getEnv('JOURNAL_API_URL')
    token = getEnv('JOURNAL_API_TOKEN')
  } catch {
    jsonResponse(res, 500, {
      ok: false,
      error: { code: 'NOT_CONFIGURED', message: 'Server belum dikonfigurasi.' },
    })
    return
  }

  try {
    if (req.method === 'GET') {
      const action = typeof req.query.action === 'string' ? req.query.action : ''
      if (!action) {
        jsonResponse(res, 400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Parameter action wajib diisi.' },
        })
        return
      }
      const url = new URL(apiUrl)
      url.searchParams.set('action', action)
      url.searchParams.set('token', token)
      for (const [key, value] of Object.entries(req.query)) {
        if (key === 'action') continue
        if (typeof value === 'string') url.searchParams.set(key, value)
      }
      const upstream = await fetchWithRetry(
        url.toString(),
        { redirect: 'follow' },
        2,
        12_000,
      )
      await passthrough(res, upstream)
      return
    }

    if (req.method === 'POST') {
      let body: unknown = req.body
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body)
        } catch {
          body = null
        }
      }
      if (!body || typeof body !== 'object' || !('action' in body)) {
        jsonResponse(res, 400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Body harus berisi action.' },
        })
        return
      }
      const { action, payload } = body as { action?: unknown; payload?: unknown }
      if (!action) {
        jsonResponse(res, 400, {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'Field action wajib diisi.' },
        })
        return
      }
      const upstream = await fetchWithRetry(
        apiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, token, payload: payload ?? {} }),
          redirect: 'follow',
        },
        1,
        20_000,
      )
      await passthrough(res, upstream)
      return
    }

    jsonResponse(res, 405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Metode tidak didukung.' },
    })
  } catch (err) {
    jsonResponse(res, 502, {
      ok: false,
      error: {
        code: 'UPSTREAM_ERROR',
        message: err instanceof Error ? err.message : 'Gagal menghubungi backend.',
      },
    })
  }
}
