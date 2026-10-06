import type {
  Condition,
  Listing,
  MeetupMethod,
  ReportReason,
  Sport,
  TradeStatus,
  TransactionType,
} from '../types'

export const sportLabel: Record<Sport, string> = {
  baseball: '야구',
  basketball: '농구',
  soccer: '축구',
  other: '기타',
}

export const sportEmoji: Record<Sport, string> = {
  baseball: '⚾',
  basketball: '🏀',
  soccer: '⚽',
  other: '✦',
}

export const conditionLabel: Record<Condition, string> = {
  near_mint: '새것에 가까움',
  good: '양호',
  played: '사용감',
  damaged: '손상',
}

export const transactionLabel: Record<TransactionType, string> = {
  sale: '판매',
  trade: '교환',
  giveaway: '나눔',
}

export const methodLabel: Record<MeetupMethod, string> = {
  meetup: '직거래',
  delivery: '배송',
  both: '직거래·배송',
}

export const tradeStatusLabel: Record<TradeStatus, string> = {
  reserved: '예약',
  completion_requested: '완료 요청',
  confirmed: '당사자 확인',
  disputed: '이의 제기',
  cancelled: '예약 취소',
}

export const reportReasonLabel: Record<ReportReason, string> = {
  condition_mismatch: '상태 불일치',
  stolen_photo: '도용 사진',
  false_info: '허위 정보',
  spam: '스팸',
  dispute: '거래 분쟁',
  other: '기타',
}

export function listingStatusLabel(listing: Pick<Listing, 'status' | 'transactionType'>): string {
  if (listing.status === 'reserved') return '예약중'
  if (listing.status === 'completed') return '거래완료'
  if (listing.status === 'withdrawn') return '철회'
  if (listing.status === 'draft') return '임시저장'
  if (listing.transactionType === 'trade') return '교환중'
  if (listing.transactionType === 'giveaway') return '나눔중'
  return '판매중'
}

export function gradeText(listing: Pick<Listing, 'gradeStatus' | 'grader' | 'grade'>): string | null {
  if (listing.gradeStatus !== 'graded') return null
  return [listing.grader, listing.grade].filter(Boolean).join(' ')
}
