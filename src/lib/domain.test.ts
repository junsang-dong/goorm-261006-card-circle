import { describe, expect, it } from 'vitest'
import { reduce } from './domain'
import { DomainError } from './errors'
import { createSeed } from './seed'
import { emptyListingInput } from './validate'
import { placeholderImage } from './images'

function asUser(userId: string) {
  return reduce(createSeed(), { type: 'set-user', userId })
}

describe('예약과 완료 권한', () => {
  it('등록자만 예약할 수 있고 두 번째 예약은 거절합니다', () => {
    let state = asUser('user-yujin')
    state = reduce(state, { type: 'open-inquiry', listingId: 'listing-01' })
    const inquiry = state.inquiries.find((item) => item.listingId === 'listing-01' && item.buyerId === 'user-yujin')
    expect(inquiry).toBeTruthy()

    state = reduce(state, { type: 'set-user', userId: 'user-minsu' })
    expect(() => reduce(state, { type: 'reserve', listingId: 'listing-01', inquiryId: inquiry!.id })).toThrow(DomainError)

    state = reduce(state, { type: 'set-user', userId: 'user-landers' })
    state = reduce(state, { type: 'reserve', listingId: 'listing-01', inquiryId: inquiry!.id })
    expect(state.listings.find((item) => item.id === 'listing-01')?.status).toBe('reserved')
    expect(state.trades.filter((trade) => trade.listingId === 'listing-01' && trade.status === 'reserved')).toHaveLength(1)

    expect(() => reduce(state, { type: 'reserve', listingId: 'listing-01', inquiryId: inquiry!.id })).toThrow(DomainError)

    state = reduce(state, { type: 'set-user', userId: 'user-goal' })
    expect(() => reduce(state, { type: 'open-inquiry', listingId: 'listing-01' })).toThrow(DomainError)
  })

  it('완료 확인은 지정된 상대만 할 수 있습니다', () => {
    const buyer = reduce(asUser('user-goal'), { type: 'confirm-trade', tradeId: 'trade-l11' })
    expect(buyer.trades.find((trade) => trade.id === 'trade-l11')?.status).toBe('confirmed')
    expect(buyer.listings.find((listing) => listing.id === 'listing-11')?.completionSource).toBe('mutual')

    expect(() => reduce(asUser('user-court'), { type: 'confirm-trade', tradeId: 'trade-l11' })).toThrow(DomainError)
  })

  it('외부 완료는 쌍방 확인 거래로 집계하지 않습니다', () => {
    const before = createSeed().trades.length
    const state = reduce(asUser('user-goal'), { type: 'external-complete', listingId: 'listing-16' })
    const listing = state.listings.find((item) => item.id === 'listing-16')
    expect(listing?.status).toBe('completed')
    expect(listing?.completionSource).toBe('external')
    expect(state.trades).toHaveLength(before)
    expect(state.trades.some((trade) => trade.listingId === 'listing-16' && trade.status === 'confirmed')).toBe(false)
  })

  it('예약 중에는 매물을 수정할 수 없습니다', () => {
    const input = emptyListingInput()
    input.title = '수정되면 안 되는 제목입니다'
    input.sport = 'baseball'
    input.player = '류현진'
    input.condition = 'good'
    input.conditionNote = '예약 중 수정이 막히는지 확인하는 설명입니다.'
    input.transactionType = 'sale'
    input.askingPrice = '10000'
    input.method = 'delivery'
    input.images = [placeholderImage('baseball', '류현진', '앞면'), placeholderImage('baseball', '류현진', '뒷면')]
    input.ownershipConfirmed = true
    const listing = createSeed().listings.find((item) => item.id === 'listing-02')!
    expect(() =>
      reduce(asUser('user-landers'), { type: 'update-listing', listingId: 'listing-02', version: listing.version, input }),
    ).toThrow(DomainError)
  })
})

describe('데모 시드', () => {
  it('회원 5명, 매물 20개, 문의 6개, 거래 3개를 만듭니다', () => {
    const state = createSeed()
    expect(state.users).toHaveLength(5)
    expect(state.listings).toHaveLength(20)
    expect(state.listings.filter((listing) => listing.sport === 'baseball')).toHaveLength(8)
    expect(state.listings.filter((listing) => listing.sport === 'basketball')).toHaveLength(6)
    expect(state.listings.filter((listing) => listing.sport === 'soccer')).toHaveLength(4)
    expect(state.listings.filter((listing) => listing.sport === 'other')).toHaveLength(2)
    expect(state.inquiries).toHaveLength(6)
    expect(state.trades).toHaveLength(3)
    expect(state.listings.find((listing) => listing.id === 'listing-18')?.completionSource).toBe('external')
  })
})

describe('메시지 중복 방지', () => {
  it('같은 clientMessageId는 한 번만 저장합니다', () => {
    const once = reduce(asUser('user-minsu'), {
      type: 'send-message',
      inquiryId: 'inquiry-l15',
      body: '토요일 오후 가능합니다.',
      clientMessageId: 'click-1',
    })
    const twice = reduce(once, {
      type: 'send-message',
      inquiryId: 'inquiry-l15',
      body: '토요일 오후 가능합니다.',
      clientMessageId: 'click-1',
    })
    const count = twice.messages.filter((message) => message.clientMessageId === 'click-1').length
    expect(count).toBe(1)
    expect(twice.messages).toHaveLength(once.messages.length)
  })

  it('완료된 매물에는 새 메시지를 보내지 않습니다', () => {
    expect(() =>
      reduce(asUser('user-court'), {
        type: 'send-message',
        inquiryId: 'inquiry-l06',
        body: '추가 메시지',
        clientMessageId: 'after-complete',
      }),
    ).toThrow(DomainError)
  })
})
