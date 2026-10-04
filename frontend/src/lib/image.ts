export interface CompressedImage {
  dataUrl: string
  mimeType: string
  fileName: string
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82
/**
 * Proxy Vercel membatasi body ~4.5MB. Base64 membengkak ~33%, jadi batasi
 * panjang data URL agar aman.
 */
const MAX_DATA_URL_LENGTH = 4_500_000

function loadViaObjectUrl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar.'))
    }
    img.src = url
  })
}

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaObjectUrl(file))
  }
  return loadViaObjectUrl(file)
}

/**
 * Kompres gambar di browser (resize + JPEG) agar muat dikirim lewat proxy.
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.')
  }

  const bitmap = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung browser.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  if (typeof (bitmap as ImageBitmap).close === 'function') {
    ;(bitmap as ImageBitmap).close()
  }

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  let dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY)
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.6)
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('Gambar terlalu besar setelah dikompres. Coba gambar lain.')
  }

  const ext = mimeType === 'image/png' ? 'png' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'screenshot'
  return { dataUrl, mimeType, fileName: `${baseName}.${ext}` }
}
