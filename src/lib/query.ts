import type { AppState, Inquiry, Listing, Message, Sport, Trade, TransactionType, User } from '../types'

export type ListingQuery = {
  search: string
  sport: Sport | 'all'
  transactionType: TransactionType | 'all'
  status: 'all' | 'available' | 'reserved' | 'completed'
  sort: 'latest' | 'price_asc' | 'price_desc'
}

export const defaultQuery: ListingQuery = {
  search: '',
  sport: 'all',
  transactionType: 'all',
  status: 'all',
  sort: 'latest',
}

const activeTradeStatuses = new Set<Trade['status']>(['reserved', 'completion_requested', 'disputed'])

export function isPublicListing(listing: Listing): boolean {
  return listing.visibility === 'visible' && listing.status !== 'withdrawn' && listing.status !== 'draft'
}

export function userById(state: AppState, id: string): User | undefined {
  return state.users.find((user) => user.id === id)
}

export function listingById(state: AppState, id: string): Listing | undefined {
  return state.listings.find((listing) => listing.id === id)
}

export function isFavorite(state: AppState, listingId: string): boolean {
  return state.favorites.some((item) => item.userId === state.currentUserId && item.listingId === listingId)
}

export function messagesFor(state: AppState, inquiryId: string): Message[] {
  return state.messages
    .filter((message) => message.inquiryId === inquiryId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

export function tradesForListing(state: AppState, listingId: string): Trade[] {
  return state.trades
    .filter((trade) => trade.listingId === listingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function activeTradeForListing(state: AppState, listingId: string): Trade | undefined {
  return state.trades.find((trade) => trade.listingId === listingId && activeTradeStatuses.has(trade.status))
}

export function latestTradeForInquiry(state: AppState, inquiryId: string): Trade | undefined {
  return state.trades
    .filter((trade) => trade.inquiryId === inquiryId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function canMessage(state: AppState, inquiry: Inquiry): boolean {
  const listing = listingById(state, inquiry.listingId)
  if (!listing) return false
  if (listing.status === 'completed' || listing.status === 'withdrawn') return false
  return true
}

export function unreadCount(state: AppState, inquiry: Inquiry, userId = state.currentUserId): number {
  const lastId = userId === inquiry.buyerId ? inquiry.buyerLastReadMessageId : inquiry.sellerLastReadMessageId
  const messages = messagesFor(state, inquiry.id)
  const start = lastId ? messages.findIndex((message) => message.id === lastId) + 1 : 0
  return messages.slice(Math.max(start, 0)).filter((message) => message.senderId !== userId).length
}

export function myUnreadTotal(state: AppState): number {
  return state.inquiries
    .filter((inquiry) => inquiry.buyerId === state.currentUserId || inquiry.sellerId === state.currentUserId)
    .reduce((sum, inquiry) => sum + unreadCount(state, inquiry), 0)
}

function priceRank(listing: Listing): number | null {
  if (listing.transactionType === 'trade') return null
  return listing.askingPrice
}

export function filterListings(listings: Listing[], query: ListingQuery): Listing[] {
  const search = query.search.trim().toLowerCase()
  const matched = listings.filter((listing) => {
    if (!isPublicListing(listing)) return false
    if (query.sport !== 'all' && listing.sport !== query.sport) return false
    if (query.transactionType !== 'all' && listing.transactionType !== query.transactionType) return false
    if (query.status !== 'all' && listing.status !== query.status) return false
    if (!search) return true
    const haystack = [listing.title, listing.player, listing.manufacturer, listing.setName, listing.cardNumber, listing.parallel]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(search)
  })

  return matched.sort((a, b) => {
    if (query.sort === 'latest') {
      return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
    }
    const ap = priceRank(a)
    const bp = priceRank(b)
    if (ap == null && bp == null) return b.createdAt.localeCompare(a.createdAt)
    if (ap == null) return 1
    if (bp == null) return -1
    const diff = query.sort === 'price_asc' ? ap - bp : bp - ap
    return diff || b.createdAt.localeCompare(a.createdAt)
  })
}

export function sportCounts(listings: Listing[]): Record<Sport | 'all', number> {
  const visible = listings.filter(isPublicListing)
  return {
    all: visible.length,
    baseball: visible.filter((listing) => listing.sport === 'baseball').length,
    basketball: visible.filter((listing) => listing.sport === 'basketball').length,
    soccer: visible.filter((listing) => listing.sport === 'soccer').length,
    other: visible.filter((listing) => listing.sport === 'other').length,
  }
}
