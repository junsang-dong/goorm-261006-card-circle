import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, StackHeader, fieldClass } from '../../components/ui'
import { DomainError } from '../../lib/errors'
import { formatAskingPrice, formatKrw, formatWhen } from '../../lib/format'
import { listingStatusLabel } from '../../lib/labels'
import { canMessage, latestTradeForInquiry, listingById, messagesFor, userById } from '../../lib/query'
import { useStore } from '../../lib/store'

export function InquiryThreadPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const inquiry = state.inquiries.find((item) => item.id === id)
  const participant = inquiry && (inquiry.buyerId === state.currentUserId || inquiry.sellerId === state.currentUserId)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState(() => crypto.randomUUID())
  const [price, setPrice] = useState('')
  const [confirming, setConfirming] = useState<'cancel' | 'dispute' | null>(null)

  const messages = inquiry ? messagesFor(state, inquiry.id) : []

  useEffect(() => {
    if (!participant || !inquiry) return
    try {
      dispatch({ type: 'mark-read', inquiryId: inquiry.id })
    } catch {
      /* 권한 없는 화면에서는 읽음 처리를 건너뜁니다. */
    }
  }, [dispatch, inquiry, messages.length, participant])

  if (!inquiry || !participant) {
    return (
      <div>
        <StackHeader title="문의" onBack={() => navigate('/inquiries')} />
        <p className="px-4 py-8 text-sm">이 문의를 볼 수 없습니다.</p>
      </div>
    )
  }

  const listing = listingById(state, inquiry.listingId)
  const otherId = inquiry.buyerId === state.currentUserId ? inquiry.sellerId : inquiry.buyerId
  const other = userById(state, otherId)
  const trade = latestTradeForInquiry(state, inquiry.id)
  const mineSeller = state.currentUserId === inquiry.sellerId
  const open = listing ? canMessage(state, inquiry) : false

  const run = (action: Parameters<typeof dispatch>[0]) => {
    setError(null)
    try {
      dispatch(action)
      setConfirming(null)
    } catch (caught) {
      setError(caught instanceof DomainError ? caught.message : '처리하지 못했습니다.')
    }
  }

  const send = () => {
    setError(null)
    try {
      dispatch({ type: 'send-message', inquiryId: inquiry.id, body, clientMessageId: clientId })
      setBody('')
      setClientId(crypto.randomUUID())
    } catch (caught) {
      setError(caught instanceof DomainError ? caught.message : '메시지를 보내지 못했습니다.')
    }
  }

  const requestCompletion = () => {
    if (!trade) return
    const cleaned = price.replace(/[₩원,\s]/g, '')
    let proposedPrice: number | null = null
    if (cleaned) {
      if (!/^\d+$/.test(cleaned)) {
        setError('합의 가격은 정수로 입력해 주세요.')
        return
      }
      proposedPrice = Number(cleaned)
    }
    run({ type: 'request-completion', tradeId: trade.id, proposedPrice })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <StackHeader title={other?.nickname ?? '문의'} onBack={() => navigate('/inquiries')} />
      {listing ? (
        <Link to={`/listings/${listing.id}`} className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-surface-container-low p-2.5">
          <img src={listing.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-tertiary">{listingStatusLabel(listing)}</span>
            <span className="block truncate text-sm font-semibold">{listing.title}</span>
            <span className="text-sm font-extrabold text-primary tabular-nums">{formatAskingPrice(listing.transactionType, listing.askingPrice)}</span>
          </span>
        </Link>
      ) : null}

      <div className="mx-4 mt-3 rounded-xl bg-white p-3 text-sm ring-1 ring-outline-variant/60">
        <TradeNotice status={trade?.status} agreedPrice={trade?.agreedPrice ?? null} proposedPrice={trade?.snapshot.proposedPrice ?? null} />
        <div className="mt-3 flex flex-col gap-2">
          {mineSeller && listing?.status === 'available' ? (
            <Button onClick={() => run({ type: 'reserve', listingId: listing.id, inquiryId: inquiry.id })}>이 문의를 예약으로 지정</Button>
          ) : null}
          {trade && (trade.status === 'reserved' || trade.status === 'completion_requested' || trade.status === 'disputed') ? (
            confirming === 'cancel' ? (
              <div className="rounded-lg bg-surface-container-low p-3">
                <p>예약을 취소하면 매물이 다시 열립니다.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => setConfirming(null)}>
                    돌아가기
                  </Button>
                  <Button variant="danger" onClick={() => run({ type: 'cancel-trade', tradeId: trade.id })}>
                    예약 취소
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirming('cancel')}>
                예약 취소
              </Button>
            )
          ) : null}
          {mineSeller && trade?.status === 'reserved' && listing?.transactionType === 'sale' ? (
            <label className="text-xs font-semibold text-on-surface-variant">
              합의 가격 (선택, 희망 가격과 별도)
              <input className={`${fieldClass} mt-1`} inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} />
            </label>
          ) : null}
          {mineSeller && trade?.status === 'reserved' ? <Button onClick={requestCompletion}>거래 완료 요청</Button> : null}
          {!mineSeller && trade?.status === 'completion_requested' ? (
            <>
              <Button onClick={() => run({ type: 'confirm-trade', tradeId: trade.id })}>완료 확인</Button>
              {confirming === 'dispute' ? (
                <div className="rounded-lg bg-surface-container-low p-3">
                  <p>이의를 제기하면 매물은 예약 상태로 남습니다.</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setConfirming(null)}>
                      돌아가기
                    </Button>
                    <Button variant="danger" onClick={() => run({ type: 'dispute-trade', tradeId: trade.id })}>
                      이의 제기
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setConfirming('dispute')}>
                  이의 제기
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        {messages.map((message) => {
          const own = message.senderId === state.currentUserId
          return (
            <div key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${own ? 'self-end bg-primary-container text-white' : 'self-start bg-white ring-1 ring-outline-variant/70'}`}>
              <p className="whitespace-pre-wrap">{message.body}</p>
              <p className={`mt-1 text-[10px] ${own ? 'text-on-primary-container' : 'text-outline'}`}>{formatWhen(message.createdAt)}</p>
            </div>
          )
        })}
      </div>

      <form
        className="sticky bottom-0 border-t border-surface-container bg-white px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        {error ? (
          <p role="alert" className="mb-2 text-xs font-semibold text-error">
            {error}
          </p>
        ) : null}
        {open ? (
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="message-body">
              메시지
            </label>
            <textarea
              id="message-body"
              className={`${fieldClass} h-12 py-3`}
              maxLength={2000}
              placeholder="메시지를 입력하세요"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
            <Button type="submit" className="shrink-0">
              보내기
            </Button>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">완료되었거나 철회된 매물에는 새 메시지를 보낼 수 없습니다. 신고는 상세 화면에서 기록할 수 있습니다.</p>
        )}
      </form>
    </div>
  )
}

function TradeNotice({
  status,
  agreedPrice,
  proposedPrice,
}: {
  status?: string
  agreedPrice: number | null
  proposedPrice: number | null
}) {
  if (status === 'reserved') return <p>등록자가 이 문의를 예약 상대로 지정했습니다. 다른 회원의 새 문의는 시작되지 않습니다.</p>
  if (status === 'completion_requested') {
    return (
      <p>
        등록자가 완료 확인을 요청했습니다. 앱은 대금 지급을 확인하지 않습니다.
        {proposedPrice != null ? ` 제안 합의 가격 ${formatKrw(proposedPrice)}은 상대가 확인하기 전입니다.` : ''}
      </p>
    )
  }
  if (status === 'confirmed') {
    return (
      <p>
        양쪽이 완료에 동의했습니다. 이 기록은 대금 지급의 증거가 아닙니다.
        {agreedPrice != null ? ` 확정 합의 가격 ${formatKrw(agreedPrice)}.` : ''}
      </p>
    )
  }
  if (status === 'disputed') return <p>상대가 완료에 이의를 제기했습니다. 매물은 예약 상태로 남아 있습니다.</p>
  if (status === 'cancelled') return <p>예약이 취소되어 매물이 다시 열렸습니다.</p>
  return <p>희망 가격과 상태는 매물에 표시된 등록자 입력입니다. 합의 내용은 이 대화에서만 오갑니다.</p>
}
