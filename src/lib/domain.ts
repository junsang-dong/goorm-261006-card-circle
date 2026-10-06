import type { AppState, Inquiry, Listing, ParsedListing, ReportReason, ReportTarget, Trade, TradeSnapshot } from '../types'
import { DomainError } from './errors'
import { validateListingInput } from './validate'
import type { ListingInput } from '../types'

const activeStatuses = new Set<Trade['status']>(['reserved', 'completion_requested', 'disputed'])

export type Action =
  | { type: 'set-user'; userId: string }
  | { type: 'reset'; next: AppState }
  | { type: 'set-favorite'; listingId: string; saved: boolean }
  | { type: 'create-listing'; input: ListingInput }
  | { type: 'update-listing'; listingId: string; version: number; input: ListingInput }
  | { type: 'withdraw-listing'; listingId: string }
  | { type: 'external-complete'; listingId: string }
  | { type: 'open-inquiry'; listingId: string }
  | { type: 'send-message'; inquiryId: string; body: string; clientMessageId: string }
  | { type: 'mark-read'; inquiryId: string }
  | { type: 'reserve'; listingId: string; inquiryId: string }
  | { type: 'cancel-trade'; tradeId: string }
  | { type: 'request-completion'; tradeId: string; proposedPrice: number | null }
  | { type: 'confirm-trade'; tradeId: string }
  | { type: 'dispute-trade'; tradeId: string }
  | { type: 'report'; targetType: ReportTarget; targetId: string; reason: ReportReason }

function nowIso(): string {
  return new Date().toISOString()
}

function requireUser(state: AppState, userId: string) {
  if (!state.users.some((user) => user.id === userId)) {
    throw new DomainError('404', '회원을 찾을 수 없습니다.')
  }
}

function requireListing(state: AppState, listingId: string): Listing {
  const listing = state.listings.find((item) => item.id === listingId)
  if (!listing) throw new DomainError('404', '매물을 찾을 수 없습니다.')
  return listing
}

function requireInquiry(state: AppState, inquiryId: string, userId: string): Inquiry {
  const inquiry = state.inquiries.find((item) => item.id === inquiryId)
  if (!inquiry || (inquiry.buyerId !== userId && inquiry.sellerId !== userId)) {
    throw new DomainError('404', '문의를 찾을 수 없습니다.')
  }
  return inquiry
}

function requireTrade(state: AppState, tradeId: string): Trade {
  const trade = state.trades.find((item) => item.id === tradeId)
  if (!trade) throw new DomainError('404', '거래 기록을 찾을 수 없습니다.')
  return trade
}

function replaceListing(state: AppState, listing: Listing): AppState {
  return { ...state, listings: state.listings.map((item) => (item.id === listing.id ? listing : item)) }
}

function replaceInquiry(state: AppState, inquiry: Inquiry): AppState {
  return { ...state, inquiries: state.inquiries.map((item) => (item.id === inquiry.id ? inquiry : item)) }
}

function replaceTrade(state: AppState, trade: Trade): AppState {
  return { ...state, trades: state.trades.map((item) => (item.id === trade.id ? trade : item)) }
}

function touchListing(listing: Listing, patch: Partial<Listing>, at: string): Listing {
  return { ...listing, ...patch, version: listing.version + 1, updatedAt: at }
}

function snapshotOf(listing: Listing, proposedPrice: number | null): TradeSnapshot {
  return {
    title: listing.title,
    transactionType: listing.transactionType,
    askingPrice: listing.askingPrice,
    proposedPrice,
  }
}

function assertProposedPrice(listing: Listing, proposedPrice: number | null) {
  if (proposedPrice == null) return
  if (!Number.isInteger(proposedPrice) || proposedPrice < 0 || proposedPrice > 100_000_000) {
    throw new DomainError('422', '합의 가격은 0 이상 1억원 이하 정수로 입력해 주세요.')
  }
  if (listing.transactionType === 'trade') {
    throw new DomainError('422', '교환에는 판매 금액을 넣지 않습니다.')
  }
  if (listing.transactionType === 'giveaway' && proposedPrice !== 0) {
    throw new DomainError('422', '나눔의 합의 가격은 0원입니다.')
  }
  if (listing.transactionType === 'sale' && proposedPrice < 1) {
    throw new DomainError('422', '판매 합의 가격은 1원 이상이어야 합니다.')
  }
}

function parseOrThrow(input: ListingInput): ParsedListing {
  const result = validateListingInput(input)
  if (!result.ok) {
    const first = Object.values(result.fields)[0] ?? '입력값을 확인해 주세요.'
    throw new DomainError('422', first, result.fields)
  }
  return result.value
}

function listingFromParsed(id: string, ownerId: string, parsed: ParsedListing, at: string, isDemo: boolean): Listing {
  return {
    id,
    ownerId,
    ...parsed,
    status: 'available',
    visibility: 'visible',
    version: 1,
    completionSource: null,
    isDemo,
    createdAt: at,
    updatedAt: at,
  }
}

function partyOrThrow(trade: Trade, userId: string) {
  if (trade.sellerId !== userId && trade.buyerId !== userId) {
    throw new DomainError('403', '이 거래의 당사자만 처리할 수 있습니다.')
  }
}

export function reduce(state: AppState, action: Action): AppState {
  const userId = state.currentUserId
  const at = nowIso()

  switch (action.type) {
    case 'reset':
      return action.next
    case 'set-user': {
      requireUser(state, action.userId)
      return { ...state, currentUserId: action.userId }
    }
    case 'set-favorite': {
      requireListing(state, action.listingId)
      const exists = state.favorites.some((item) => item.userId === userId && item.listingId === action.listingId)
      if (action.saved && exists) return state
      if (!action.saved && !exists) return state
      const favorites = action.saved
        ? [...state.favorites, { userId, listingId: action.listingId, createdAt: at }]
        : state.favorites.filter((item) => !(item.userId === userId && item.listingId === action.listingId))
      return { ...state, favorites }
    }
    case 'create-listing': {
      const parsed = parseOrThrow(action.input)
      const listing = listingFromParsed(crypto.randomUUID(), userId, parsed, at, false)
      return { ...state, listings: [listing, ...state.listings] }
    }
    case 'update-listing': {
      const listing = requireListing(state, action.listingId)
      if (listing.ownerId !== userId) throw new DomainError('403', '본인 매물만 수정할 수 있습니다.')
      if (listing.version !== action.version) {
        throw new DomainError('409', '다른 화면에서 이미 바뀌었습니다. 다시 열어 주세요.')
      }
      if (listing.status !== 'available') {
        throw new DomainError('409', '예약·완료·철회된 매물은 수정할 수 없습니다. 예약을 취소한 뒤 수정해 주세요.')
      }
      const parsed = parseOrThrow(action.input)
      return replaceListing(state, touchListing(listing, parsed, at))
    }
    case 'withdraw-listing': {
      const listing = requireListing(state, action.listingId)
      if (listing.ownerId !== userId) throw new DomainError('403', '본인 매물만 철회할 수 있습니다.')
      if (listing.status === 'completed' || listing.status === 'withdrawn') {
        throw new DomainError('409', '완료되었거나 이미 철회된 매물입니다.')
      }
      let next = state
      for (const trade of state.trades) {
        if (trade.listingId === listing.id && activeStatuses.has(trade.status)) {
          next = replaceTrade(next, { ...trade, status: 'cancelled', updatedAt: at })
        }
      }
      return replaceListing(next, touchListing(listing, { status: 'withdrawn' }, at))
    }
    case 'external-complete': {
      const listing = requireListing(state, action.listingId)
      if (listing.ownerId !== userId) throw new DomainError('403', '본인 매물만 외부 거래 완료로 표시할 수 있습니다.')
      if (listing.status !== 'available') throw new DomainError('409', '판매·교환·나눔 중인 매물만 외부 완료로 표시할 수 있습니다.')
      if (state.trades.some((trade) => trade.listingId === listing.id && activeStatuses.has(trade.status))) {
        throw new DomainError('409', '진행 중인 예약을 취소한 뒤 외부 완료로 표시해 주세요.')
      }
      return replaceListing(
        state,
        touchListing(listing, { status: 'completed', completionSource: 'external' }, at),
      )
    }
    case 'open-inquiry': {
      const listing = requireListing(state, action.listingId)
      if (listing.ownerId === userId) throw new DomainError('403', '본인 매물에는 문의할 수 없습니다.')
      const existing = state.inquiries.find((item) => item.listingId === listing.id && item.buyerId === userId)
      if (existing) return state
      if (listing.status !== 'available') {
        throw new DomainError('409', '예약 중이거나 거래가 끝난 매물에는 새 문의를 시작할 수 없습니다.')
      }
      const inquiry: Inquiry = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        buyerId: userId,
        sellerId: listing.ownerId,
        buyerLastReadMessageId: null,
        sellerLastReadMessageId: null,
        createdAt: at,
      }
      return { ...state, inquiries: [...state.inquiries, inquiry] }
    }
    case 'send-message': {
      const inquiry = requireInquiry(state, action.inquiryId, userId)
      const body = action.body.trim()
      if (body.length < 1 || body.length > 2000) {
        throw new DomainError('422', '메시지는 1~2000자로 입력해 주세요.')
      }
      const duplicate = state.messages.find(
        (message) => message.senderId === userId && message.clientMessageId === action.clientMessageId,
      )
      if (duplicate) return state
      const listing = requireListing(state, inquiry.listingId)
      if (listing.status === 'completed' || listing.status === 'withdrawn') {
        throw new DomainError('409', '완료되었거나 철회된 매물에는 새 메시지를 보낼 수 없습니다.')
      }
      const message = {
        id: crypto.randomUUID(),
        inquiryId: inquiry.id,
        senderId: userId,
        body,
        clientMessageId: action.clientMessageId,
        createdAt: at,
      }
      return { ...state, messages: [...state.messages, message] }
    }
    case 'mark-read': {
      const inquiry = requireInquiry(state, action.inquiryId, userId)
      const latest = state.messages
        .filter((message) => message.inquiryId === inquiry.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
        .at(-1)
      if (!latest) return state
      if (userId === inquiry.buyerId) {
        if (inquiry.buyerLastReadMessageId === latest.id) return state
        return replaceInquiry(state, { ...inquiry, buyerLastReadMessageId: latest.id })
      }
      if (inquiry.sellerLastReadMessageId === latest.id) return state
      return replaceInquiry(state, { ...inquiry, sellerLastReadMessageId: latest.id })
    }
    case 'reserve': {
      const listing = requireListing(state, action.listingId)
      if (listing.ownerId !== userId) throw new DomainError('403', '등록자만 예약 상대를 지정할 수 있습니다.')
      if (listing.status !== 'available') throw new DomainError('409', '이미 예약되었거나 거래가 끝난 매물입니다.')
      const inquiry = state.inquiries.find((item) => item.id === action.inquiryId && item.listingId === listing.id)
      if (!inquiry) throw new DomainError('404', '이 매물의 문의를 찾을 수 없습니다.')
      if (state.trades.some((trade) => trade.listingId === listing.id && activeStatuses.has(trade.status))) {
        throw new DomainError('409', '진행 중인 거래가 이미 있습니다.')
      }
      const trade: Trade = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        inquiryId: inquiry.id,
        sellerId: listing.ownerId,
        buyerId: inquiry.buyerId,
        status: 'reserved',
        snapshot: snapshotOf(listing, null),
        agreedPrice: null,
        createdAt: at,
        updatedAt: at,
      }
      return {
        ...replaceListing(state, touchListing(listing, { status: 'reserved' }, at)),
        trades: [...state.trades, trade],
      }
    }
    case 'cancel-trade': {
      const trade = requireTrade(state, action.tradeId)
      partyOrThrow(trade, userId)
      if (!activeStatuses.has(trade.status)) throw new DomainError('409', '취소할 수 있는 예약이 아닙니다.')
      const listing = requireListing(state, trade.listingId)
      const next = replaceTrade(state, { ...trade, status: 'cancelled', updatedAt: at })
      return replaceListing(next, touchListing(listing, { status: 'available' }, at))
    }
    case 'request-completion': {
      const trade = requireTrade(state, action.tradeId)
      if (trade.sellerId !== userId) throw new DomainError('403', '등록자만 완료를 요청할 수 있습니다.')
      if (trade.status !== 'reserved') throw new DomainError('409', '예약된 거래만 완료 요청할 수 있습니다.')
      const listing = requireListing(state, trade.listingId)
      assertProposedPrice(listing, action.proposedPrice)
      return replaceTrade(state, {
        ...trade,
        status: 'completion_requested',
        snapshot: snapshotOf(listing, action.proposedPrice),
        agreedPrice: null,
        updatedAt: at,
      })
    }
    case 'confirm-trade': {
      const trade = requireTrade(state, action.tradeId)
      if (trade.buyerId !== userId) throw new DomainError('403', '예약된 상대만 완료를 확인할 수 있습니다.')
      if (trade.status !== 'completion_requested') throw new DomainError('409', '완료 요청이 있는 거래만 확인할 수 있습니다.')
      const listing = requireListing(state, trade.listingId)
      const next = replaceTrade(state, {
        ...trade,
        status: 'confirmed',
        agreedPrice: trade.snapshot.proposedPrice,
        updatedAt: at,
      })
      return replaceListing(next, touchListing(listing, { status: 'completed', completionSource: 'mutual' }, at))
    }
    case 'dispute-trade': {
      const trade = requireTrade(state, action.tradeId)
      if (trade.buyerId !== userId) throw new DomainError('403', '예약된 상대만 이의를 제기할 수 있습니다.')
      if (trade.status !== 'completion_requested') throw new DomainError('409', '완료 요청 중에만 이의를 제기할 수 있습니다.')
      const listing = requireListing(state, trade.listingId)
      const next = replaceTrade(state, { ...trade, status: 'disputed', updatedAt: at })
      return replaceListing(next, touchListing(listing, { status: 'reserved' }, at))
    }
    case 'report': {
      const report = {
        id: crypto.randomUUID(),
        reporterId: userId,
        targetType: action.targetType,
        targetId: action.targetId,
        reason: action.reason,
        createdAt: at,
      }
      return { ...state, reports: [...state.reports, report] }
    }
    default:
      return state
  }
}
