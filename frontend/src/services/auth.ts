export interface SessionInfo {
  authenticated: boolean
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function fetchSession(): Promise<SessionInfo> {
  const response = await fetch('/api/session', { credentials: 'include' })
  const data = (await parseJson(response)) as
    | { ok?: boolean; data?: { authenticated?: boolean } }
    | null
  if (data && data.ok) {
    return { authenticated: Boolean(data.data?.authenticated) }
  }
  return { authenticated: false }
}

export async function login(password: string): Promise<void> {
  const response = await fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) {
    const data = (await parseJson(response)) as { error?: { message?: string } } | null
    throw new Error(data?.error?.message ?? 'Login gagal.')
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' })
}
