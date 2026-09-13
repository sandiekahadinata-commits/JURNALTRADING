import type { VercelRequest, VercelResponse } from '@vercel/node'

import { clearSessionCookie, jsonResponse } from './_lib'

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  clearSessionCookie(res)
  jsonResponse(res, 200, { ok: true, data: { authenticated: false } })
}
