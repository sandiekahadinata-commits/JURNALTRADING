import type { VercelRequest, VercelResponse } from '@vercel/node'

import { isAuthenticated, jsonResponse } from './_lib'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  jsonResponse(res, 200, {
    ok: true,
    data: { authenticated: isAuthenticated(req) },
  })
}
