import { useState, type FormEvent } from 'react'
import { CandlestickChart, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/useAuth'

export function LoginPage() {
  const [password, setPassword] = useState('')
  const loginMutation = useLogin()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!password) return
    loginMutation.mutate(password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CandlestickChart className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Crypto Trading Journal</CardTitle>
          <CardDescription>
            Masukkan password untuk mengakses jurnal trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {loginMutation.isError ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {loginMutation.error?.message ?? 'Login gagal.'}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !password}
            >
              <LockKeyhole className="h-4 w-4" />
              {loginMutation.isPending ? 'Memeriksa...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
