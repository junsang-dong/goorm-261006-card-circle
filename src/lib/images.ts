import type { Sport } from '../types'
import { sportLabel } from './labels'
import { DomainError } from './errors'

const sportFill: Record<Sport, string> = {
  baseball: '#2563eb',
  basketball: '#996100',
  soccer: '#006c49',
  other: '#434655',
}

export function placeholderImage(sport: Sport, title: string, side: '앞면' | '뒷면'): string {
  const fill = sportFill[sport]
  const safeTitle = title.replace(/[<>&]/g, '').slice(0, 42)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#f2f3ff"/>
  <rect x="70" y="70" width="660" height="860" rx="28" fill="#ffffff" stroke="#c3c6d7" stroke-width="4"/>
  <rect x="70" y="70" width="660" height="92" rx="28" fill="${fill}"/>
  <rect x="70" y="130" width="660" height="32" fill="${fill}"/>
  <text x="400" y="128" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="700">${sportLabel[sport]} · 데모</text>
  <text x="400" y="470" text-anchor="middle" fill="#131b2e" font-family="sans-serif" font-size="40" font-weight="700">${safeTitle}</text>
  <text x="400" y="540" text-anchor="middle" fill="#434655" font-family="sans-serif" font-size="32">${side}</text>
  <text x="400" y="820" text-anchor="middle" fill="#737686" font-family="sans-serif" font-size="24">직접 등록 정보 · 플레이스홀더</text>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new DomainError('422', '사진을 읽지 못했습니다.'))
    reader.readAsDataURL(blob)
  })
}

export async function compressImageFile(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new DomainError('422', 'JPEG, PNG, WebP 사진만 올릴 수 있습니다.')
  }
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width * bitmap.height > 20_000_000) {
      throw new DomainError('422', '사진 크기가 너무 큽니다. 더 작은 사진을 올려 주세요.')
    }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new DomainError('422', '사진을 처리하지 못했습니다.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    let quality = 0.82
    let blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    while (blob && blob.size > 1.5 * 1024 * 1024 && quality > 0.45) {
      quality -= 0.1
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    }
    if (!blob || blob.size > 1.5 * 1024 * 1024) {
      throw new DomainError('422', '사진을 1.5MB 이하로 줄이지 못했습니다.')
    }
    return blobToDataUrl(blob)
  } finally {
    bitmap.close()
  }
}
