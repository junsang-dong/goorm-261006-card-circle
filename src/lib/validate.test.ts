import { describe, expect, it } from 'vitest'
import { emptyListingInput, validateListingInput } from './validate'
import { placeholderImage } from './images'

function readyInput() {
  const input = emptyListingInput()
  input.title = '2024 데모 카드 제목'
  input.sport = 'baseball'
  input.player = '데모 선수'
  input.condition = 'near_mint'
  input.conditionNote = '모서리와 표면을 직접 확인했고 스크래치는 없습니다.'
  input.gradeStatus = 'ungraded'
  input.transactionType = 'sale'
  input.askingPrice = '35000'
  input.method = 'delivery'
  input.shippingFee = '0'
  input.images = [placeholderImage('baseball', '데모', '앞면'), placeholderImage('baseball', '데모', '뒷면')]
  input.ownershipConfirmed = true
  return input
}

describe('매물 가격 규칙', () => {
  it('판매는 양의 정수만 받습니다', () => {
    const ok = validateListingInput(readyInput())
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.value.askingPrice).toBe(35000)

    const zero = readyInput()
    zero.askingPrice = '0'
    const zeroResult = validateListingInput(zero)
    expect(zeroResult.ok).toBe(false)

    const blank = readyInput()
    blank.askingPrice = ''
    expect(validateListingInput(blank).ok).toBe(false)
  })

  it('나눔은 0원이고 교환은 가격 없이 희망 조건이 필요합니다', () => {
    const giveaway = readyInput()
    giveaway.transactionType = 'giveaway'
    giveaway.askingPrice = '0'
    const giveawayOk = validateListingInput(giveaway)
    expect(giveawayOk.ok).toBe(true)
    if (giveawayOk.ok) expect(giveawayOk.value.askingPrice).toBe(0)

    const giveawayPaid = readyInput()
    giveawayPaid.transactionType = 'giveaway'
    giveawayPaid.askingPrice = '1000'
    expect(validateListingInput(giveawayPaid).ok).toBe(false)

    const trade = readyInput()
    trade.transactionType = 'trade'
    trade.askingPrice = ''
    trade.tradeWish = ''
    expect(validateListingInput(trade).ok).toBe(false)

    trade.tradeWish = '같은 선수 오토 카드와 교환하고 싶습니다.'
    trade.askingPrice = '10000'
    expect(validateListingInput(trade).ok).toBe(false)

    trade.askingPrice = ''
    const tradeOk = validateListingInput(trade)
    expect(tradeOk.ok).toBe(true)
    if (tradeOk.ok) expect(tradeOk.value.askingPrice).toBeNull()
  })

  it('앞뒷면 사진과 카드 번호 앞자리 0을 유지합니다', () => {
    const input = readyInput()
    input.images = [input.images[0]]
    expect(validateListingInput(input).ok).toBe(false)

    const numbered = readyInput()
    numbered.cardNumber = '0072'
    const result = validateListingInput(numbered)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.cardNumber).toBe('0072')
  })
})
