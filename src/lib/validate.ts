import type { Condition, GradeStatus, Listing, ListingInput, MeetupMethod, ParsedListing, Sport, TransactionType } from '../types'

const sports: Sport[] = ['baseball', 'basketball', 'soccer', 'other']
const conditions: Condition[] = ['near_mint', 'good', 'played', 'damaged']
const grades: GradeStatus[] = ['graded', 'ungraded']
const transactions: TransactionType[] = ['sale', 'trade', 'giveaway']
const methods: MeetupMethod[] = ['meetup', 'delivery', 'both']

export const emptyListingInput = (): ListingInput => ({
  title: '',
  sport: '',
  player: '',
  manufacturer: '',
  setName: '',
  year: '',
  cardNumber: '',
  parallel: '',
  condition: '',
  conditionNote: '',
  gradeStatus: 'ungraded',
  grader: '',
  grade: '',
  certNumber: '',
  transactionType: 'sale',
  askingPrice: '',
  tradeWish: '',
  method: 'delivery',
  meetupArea: '',
  shippingFee: '',
  images: [],
  ownershipConfirmed: false,
})

export function listingToInput(listing: Listing): ListingInput {
  return {
    title: listing.title,
    sport: listing.sport,
    player: listing.player,
    manufacturer: listing.manufacturer ?? '',
    setName: listing.setName ?? '',
    year: listing.year ?? '',
    cardNumber: listing.cardNumber ?? '',
    parallel: listing.parallel ?? '',
    condition: listing.condition,
    conditionNote: listing.conditionNote,
    gradeStatus: listing.gradeStatus,
    grader: listing.grader ?? '',
    grade: listing.grade ?? '',
    certNumber: listing.certNumber ?? '',
    transactionType: listing.transactionType,
    askingPrice: listing.askingPrice == null ? '' : String(listing.askingPrice),
    tradeWish: listing.tradeWish ?? '',
    method: listing.method,
    meetupArea: listing.meetupArea ?? '',
    shippingFee: listing.shippingFee == null ? '' : String(listing.shippingFee),
    images: [...listing.images],
    ownershipConfirmed: true,
  }
}

function optionalText(value: string, max: number, label: string, fields: Record<string, string>, key: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) fields[key] = `${label}은 ${max}자 이하로 입력해 주세요.`
  return trimmed
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[₩원,\s]/g, '')
  if (!cleaned) return null
  if (!/^\d+$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

export function validateListingInput(input: ListingInput): { ok: true; value: ParsedListing } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {}
  const title = input.title.trim()
  if (title.length < 5 || title.length > 100) fields.title = '제목은 5~100자로 입력해 주세요.'

  if (!sports.includes(input.sport as Sport)) fields.sport = '종목을 선택해 주세요.'

  const player = input.player.trim()
  if (player.length < 1 || player.length > 100) fields.player = '선수·인물 이름은 1~100자로 입력해 주세요.'

  const manufacturer = optionalText(input.manufacturer, 100, '제조사', fields, 'manufacturer')
  const setName = optionalText(input.setName, 100, '세트명', fields, 'setName')
  const parallel = optionalText(input.parallel, 100, '패러렐·판본·언어', fields, 'parallel')
  const certNumber = optionalText(input.certNumber, 50, '인증번호', fields, 'certNumber')

  const year = input.year.trim()
  if (year && !/^\d{4}$/.test(year)) fields.year = '발행 연도는 4자리 숫자로 입력해 주세요.'

  const cardNumber = input.cardNumber.trim()
  if (cardNumber.length > 50) fields.cardNumber = '카드 번호는 50자 이하로 입력해 주세요. 앞자리 0은 그대로 둡니다.'

  if (!conditions.includes(input.condition as Condition)) fields.condition = '카드 상태를 선택해 주세요.'

  const conditionNote = input.conditionNote.trim()
  if (conditionNote.length < 10 || conditionNote.length > 2000) {
    fields.conditionNote = '상태·하자 설명은 10~2000자로 입력해 주세요.'
  }

  if (!grades.includes(input.gradeStatus as GradeStatus)) fields.gradeStatus = '등급 평가 여부를 선택해 주세요.'

  const grader = input.grader.trim()
  const grade = input.grade.trim()
  if (input.gradeStatus === 'graded') {
    if (!grader || grader.length > 50) fields.grader = '감정기관을 50자 이하로 입력해 주세요.'
    if (!grade || grade.length > 20) fields.grade = '등급을 20자 이하로 입력해 주세요.'
  } else {
    if (grader.length > 50) fields.grader = '감정기관은 50자 이하로 입력해 주세요.'
    if (grade.length > 20) fields.grade = '등급은 20자 이하로 입력해 주세요.'
  }

  if (!transactions.includes(input.transactionType as TransactionType)) {
    fields.transactionType = '거래 유형을 선택해 주세요.'
  }

  const asking = parseMoney(input.askingPrice)
  let askingPrice: number | null = null
  if (input.transactionType === 'sale') {
    if (asking == null || Number.isNaN(asking) || asking < 1 || asking > 100_000_000) {
      fields.askingPrice = '희망 가격은 1원 이상 1억원 이하 정수로 입력해 주세요.'
    } else askingPrice = asking
  } else if (input.transactionType === 'giveaway') {
    if (asking != null && asking !== 0) fields.askingPrice = '나눔 가격은 0원입니다.'
    else askingPrice = 0
  } else if (input.transactionType === 'trade') {
    if (asking != null) fields.askingPrice = '교환은 가격 없이 희망 조건만 입력합니다.'
    askingPrice = null
  }

  const tradeWish = input.tradeWish.trim()
  if (input.transactionType === 'trade') {
    if (tradeWish.length < 10 || tradeWish.length > 1000) {
      fields.tradeWish = '교환 희망 조건은 10~1000자로 입력해 주세요.'
    }
  } else if (tradeWish.length > 1000) {
    fields.tradeWish = '교환 희망 조건은 1000자 이하로 입력해 주세요.'
  }

  if (!methods.includes(input.method as MeetupMethod)) fields.method = '거래 방법을 선택해 주세요.'

  const meetupArea = input.meetupArea.trim()
  const needsArea = input.method === 'meetup' || input.method === 'both'
  if (needsArea && !meetupArea) fields.meetupArea = '직거래 지역을 시·구 정도로 입력해 주세요.'
  else if (meetupArea.length > 40) fields.meetupArea = '직거래 지역은 시·구만, 40자 이하로 입력해 주세요.'

  const shipping = parseMoney(input.shippingFee)
  let shippingFee: number | null = null
  if (input.shippingFee.trim()) {
    if (shipping == null || Number.isNaN(shipping) || shipping > 100_000_000) {
      fields.shippingFee = '배송비는 0 이상의 정수로 입력하거나, 비워 두면 별도 협의입니다.'
    } else shippingFee = shipping
  }

  const images = input.images.filter(Boolean)
  if (images.length < 2 || images.length > 5) {
    fields.images = '앞면과 뒷면을 포함해 2~5장을 올려 주세요.'
  }

  if (!input.ownershipConfirmed) {
    fields.ownershipConfirmed = '보유 중인 실물 카드를 직접 촬영했음을 확인해 주세요.'
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields }

  return {
    ok: true,
    value: {
      title,
      sport: input.sport as Sport,
      player,
      manufacturer,
      setName,
      year: year || null,
      cardNumber: cardNumber || null,
      parallel,
      condition: input.condition as Condition,
      conditionNote,
      gradeStatus: input.gradeStatus as GradeStatus,
      grader: input.gradeStatus === 'graded' ? grader : null,
      grade: input.gradeStatus === 'graded' ? grade : null,
      certNumber,
      transactionType: input.transactionType as TransactionType,
      askingPrice,
      tradeWish: input.transactionType === 'trade' ? tradeWish : tradeWish || null,
      method: input.method as MeetupMethod,
      meetupArea: meetupArea || null,
      shippingFee,
      images,
    },
  }
}

export const stepFields: Record<number, string[]> = {
  1: ['images', 'ownershipConfirmed'],
  2: ['title', 'sport', 'player', 'manufacturer', 'setName', 'year', 'cardNumber', 'parallel'],
  3: ['condition', 'conditionNote', 'gradeStatus', 'grader', 'grade', 'certNumber'],
  4: ['transactionType', 'askingPrice', 'tradeWish', 'method', 'meetupArea', 'shippingFee'],
}

export function errorsForStep(input: ListingInput, step: number): Record<string, string> {
  const result = validateListingInput(input)
  if (result.ok) return {}
  const keys = stepFields[step] ?? []
  return Object.fromEntries(Object.entries(result.fields).filter(([key]) => keys.includes(key)))
}
