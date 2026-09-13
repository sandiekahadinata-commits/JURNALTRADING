import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-lg font-semibold">Halaman tidak ditemukan</p>
      <p className="text-sm text-muted-foreground">
        Halaman yang kamu cari tidak tersedia.
      </p>
      <Button asChild>
        <Link to="/">Kembali ke Dashboard</Link>
      </Button>
    </div>
  )
}
