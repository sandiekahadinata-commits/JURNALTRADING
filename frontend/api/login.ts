import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  clearLoginFailures,
  clientIp,
  getEnv,
  isLoginRateLimited,
  jsonResponse,
  recordLoginFailure,
  setSessionCookie,
} from './_lib.js'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    jsonResponse(res, 405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Metode tidak didukung.' },
    })
    return
  }

  const ip = clientIp(req)
  if (isLoginRateLimited(ip)) {
    jsonResponse(res, 429, {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.',
      },
    })
    return
  }

  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }

  const password =
    body && typeof body === 'object' && 'password' in body
      ? String((body as { password?: unknown }).password ?? '')
      : ''

  let expected: string
  try {
    expected = getEnv('JOURNAL_PASSWORD')
  } catch {
    jsonResponse(res, 500, {
      ok: false,
      error: { code: 'NOT_CONFIGURED', message: 'Server belum dikonfigurasi.' },
    })
    return
  }

  if (!password || password !== expected) {
    recordLoginFailure(ip)
    jsonResponse(res, 401, {
      ok: false,
      error: { code: 'INVALID_PASSWORD', message: 'Password salah.' },
    })
    return
  }

  clearLoginFailures(ip)
  setSessionCookie(res, getEnv('AUTH_SECRET'))
  jsonResponse(res, 200, { ok: true, data: { authenticated: true } })
}
