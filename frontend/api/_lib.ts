import crypto from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const COOKIE_NAME = 'journal_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const RATE_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 6

export function getEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${name} belum di-set.`)
  }
  return value
}

export function jsonResponse(res: VercelResponse, status: number, body: unknown): void {
  res.status(status)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.send(JSON.stringify(body))
}

function hmac(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createSessionToken(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  return `${payload}.${hmac(payload, secret)}`
}

export function verifySessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, signature] = parts
  const expected = hmac(payload, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number
    }
    return typeof data.exp === 'number' && data.exp > Date.now() / 1000
  } catch {
    return false
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}

export function isAuthenticated(req: VercelRequest): boolean {
  const secret = process.env.AUTH_SECRET
  if (!secret) return false
  const cookies = parseCookies(req.headers.cookie)
  return verifySessionToken(cookies[COOKIE_NAME], secret)
}

export function setSessionCookie(res: VercelResponse, secret: string): void {
  const token = createSessionToken(secret)
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`,
  )
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  )
}

const loginFailures = new Map<string, { count: number; firstAt: number }>()

export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw ? raw.split(',')[0].trim() : 'unknown'
}

export function isLoginRateLimited(ip: string): boolean {
  const entry = loginFailures.get(ip)
  if (!entry) return false
  if (Date.now() - entry.firstAt > RATE_WINDOW_MS) {
    loginFailures.delete(ip)
    return false
  }
  return entry.count >= MAX_FAILURES
}

export function recordLoginFailure(ip: string): void {
  const entry = loginFailures.get(ip)
  if (!entry || Date.now() - entry.firstAt > RATE_WINDOW_MS) {
    loginFailures.set(ip, { count: 1, firstAt: Date.now() })
  } else {
    entry.count += 1
  }
}

export function clearLoginFailures(ip: string): void {
  loginFailures.delete(ip)
}
