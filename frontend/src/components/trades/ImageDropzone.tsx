import { useRef, useState, type DragEvent } from 'react'
import { ImageIcon, Loader2, UploadCloud, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { compressImageFile } from '@/lib/image'
import { cn } from '@/lib/utils'
import { useUploadImage } from '@/hooks/useJournal'

interface ImageDropzoneProps {
  label: string
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageDropzone({
  label,
  value,
  onChange,
  disabled,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadImage()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploading = upload.isPending

  async function handleFile(file: File | undefined) {
    if (!file || disabled || uploading) return
    setError(null)
    try {
      const compressed = await compressImageFile(file)
      const result = await upload.mutateAsync({
        data: compressed.dataUrl,
        mimeType: compressed.mimeType,
        fileName: compressed.fileName,
      })
      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={value} alt={label} className="h-40 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button type="button" variant="secondary" size="icon" asChild>
              <a href={value} target="_blank" rel="noreferrer" title="Buka gambar">
                <ImageIcon className="h-4 w-4" />
              </a>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              title="Hapus gambar"
              disabled={disabled}
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center text-sm text-muted-foreground transition-colors',
            dragging && 'border-primary bg-primary/10 text-foreground',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Mengunggah...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5" />
              <span>Drag &amp; drop gambar atau klik untuk pilih</span>
              <span className="text-xs">PNG/JPG, otomatis dikompres</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
