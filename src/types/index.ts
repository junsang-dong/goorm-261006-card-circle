export type Sport = 'baseball' | 'basketball' | 'soccer' | 'other'

export type Condition = 'near_mint' | 'good' | 'played' | 'damaged'

export type GradeStatus = 'graded' | 'ungraded'

export type TransactionType = 'sale' | 'trade' | 'giveaway'

export type MeetupMethod = 'meetup' | 'delivery' | 'both'

export type ListingStatus = 'draft' | 'available' | 'reserved' | 'completed' | 'withdrawn'

export type TradeStatus =
  | 'reserved'
  | 'completion_requested'
  | 'confirmed'
  | 'disputed'
  | 'cancelled'

export type CompletionSource = 'mutual' | 'external'

export type ReportReason =
  | 'condition_mismatch'
  | 'stolen_photo'
  | 'false_info'
  | 'spam'
  | 'dispute'
  | 'other'

export type ReportTarget = 'listing' | 'message' | 'user'

export type User = {
  id: string
  loginId: string
  nickname: string
}

export type Listing = {
  id: string
  ownerId: string
  title: string
  sport: Sport
  player: string
  manufacturer: string | null
  setName: string | null
  year: string | null
  cardNumber: string | null
  parallel: string | null
  condition: Condition
  conditionNote: string
  gradeStatus: GradeStatus
  grader: string | null
  grade: string | null
  certNumber: string | null
  transactionType: TransactionType
  askingPrice: number | null
  tradeWish: string | null
  method: MeetupMethod
  meetupArea: string | null
  shippingFee: number | null
  images: string[]
  status: ListingStatus
  visibility: 'visible'
  version: number
  completionSource: CompletionSource | null
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

export type Favorite = {
  userId: string
  listingId: string
  createdAt: string
}

export type Inquiry = {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  buyerLastReadMessageId: string | null
  sellerLastReadMessageId: string | null
  createdAt: string
}

export type Message = {
  id: string
  inquiryId: string
  senderId: string
  body: string
  clientMessageId: string
  createdAt: string
}

export type TradeSnapshot = {
  title: string
  transactionType: TransactionType
  askingPrice: number | null
  proposedPrice: number | null
}

export type Trade = {
  id: string
  listingId: string
  inquiryId: string
  sellerId: string
  buyerId: string
  status: TradeStatus
  snapshot: TradeSnapshot
  agreedPrice: number | null
  createdAt: string
  updatedAt: string
}

export type Report = {
  id: string
  reporterId: string
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  createdAt: string
}

export type AppState = {
  schemaVersion: 1
  currentUserId: string
  users: User[]
  listings: Listing[]
  favorites: Favorite[]
  inquiries: Inquiry[]
  messages: Message[]
  trades: Trade[]
  reports: Report[]
}

export type ListingInput = {
  title: string
  sport: Sport | ''
  player: string
  manufacturer: string
  setName: string
  year: string
  cardNumber: string
  parallel: string
  condition: Condition | ''
  conditionNote: string
  gradeStatus: GradeStatus | ''
  grader: string
  grade: string
  certNumber: string
  transactionType: TransactionType | ''
  askingPrice: string
  tradeWish: string
  method: MeetupMethod | ''
  meetupArea: string
  shippingFee: string
  images: string[]
  ownershipConfirmed: boolean
}

export type ParsedListing = {
  title: string
  sport: Sport
  player: string
  manufacturer: string | null
  setName: string | null
  year: string | null
  cardNumber: string | null
  parallel: string | null
  condition: Condition
  conditionNote: string
  gradeStatus: GradeStatus
  grader: string | null
  grade: string | null
  certNumber: string | null
  transactionType: TransactionType
  askingPrice: number | null
  tradeWish: string | null
  method: MeetupMethod
  meetupArea: string | null
  shippingFee: number | null
  images: string[]
}
