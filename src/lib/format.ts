import type { TransactionType } from '../types'

const seoul: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Seoul',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function formatAskingPrice(type: TransactionType, amount: number | null): string {
  if (type === 'trade') return '교환'
  if (amount == null) return '가격 미정'
  return formatKrw(amount)
}

export function formatShipping(fee: number | null): string {
  if (fee == null) return '배송비 별도 협의'
  if (fee === 0) return '배송비 무료'
  return `배송비 ${formatKrw(fee)}`
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', seoul).format(new Date(iso))
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
