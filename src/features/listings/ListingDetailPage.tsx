import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Icon, StackHeader } from '../../components/ui'
import { DomainError } from '../../lib/errors'
import { formatAskingPrice, formatShipping, formatWhen } from '../../lib/format'
import { conditionLabel, gradeText, listingStatusLabel, methodLabel, sportLabel, transactionLabel } from '../../lib/labels'
import { isFavorite, listingById, userById } from '../../lib/query'
import { useStore } from '../../lib/store'
import type { ReportReason } from '../../types'

const reasons: ReportReason[] = ['condition_mismatch', 'stolen_photo', 'false_info', 'spam', 'dispute', 'other']

export function ListingDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const listing = listingById(state, id)
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('condition_mismatch')
  const [reported, setReported] = useState(false)
  const [danger, setDanger] = useState<'withdraw' | 'external' | null>(null)

  if (!listing || (listing.status === 'withdrawn' && listing.ownerId !== state.currentUserId)) {
    return (
      <div>
        <StackHeader title="카드 상세" onBack={() => navigate('/')} />
        <p className="px-4 py-10 text-sm text-on-surface-variant">이 매물을 볼 수 없습니다.</p>
      </div>
    )
  }

  const owner = userById(state, listing.ownerId)
  const mine = listing.ownerId === state.currentUserId
  const saved = isFavorite(state, listing.id)
  const grade = gradeText(listing)
  const existing = state.inquiries.find((item) => item.listingId === listing.id && item.buyerId === state.currentUserId)
  const canInquire = Boolean(existing) || listing.status === 'available'

  const inquire = () => {
    setError(null)
    try {
      const next = dispatch({ type: 'open-inquiry', listingId: listing.id })
      const inquiry = next.inquiries.find((item) => item.listingId === listing.id && item.buyerId === state.currentUserId)
      if (inquiry) navigate(`/inquiries/${inquiry.id}`)
    } catch (caught) {
      setError(caught instanceof DomainError ? caught.message : '문의를 시작하지 못했습니다.')
    }
  }

  const run = (action: Parameters<typeof dispatch>[0]) => {
    setError(null)
    try {
      dispatch(action)
    } catch (caught) {
      setError(caught instanceof DomainError ? caught.message : '처리하지 못했습니다.')
    }
  }

  return (
    <div className="pb-28">
      <StackHeader title="카드 상세" onBack={() => navigate(-1)} />
      <div className="relative bg-surface-container-low">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            const el = event.currentTarget
            setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)))
          }}
        >
          {listing.images.map((src, imageIndex) => (
            <img
              key={src.slice(0, 48) + imageIndex}
              src={src}
              alt={`${listing.title} 사진 ${imageIndex + 1}`}
              className="aspect-[4/5] w-full shrink-0 snap-center object-contain p-4"
            />
          ))}
        </div>
        <p className="absolute top-3 right-3 rounded-full bg-inverse-surface/80 px-2 py-1 text-[11px] text-inverse-on-surface">
          {index + 1} / {listing.images.length}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-surface-container-high px-2 py-0.5 text-xs font-semibold">{sportLabel[listing.sport]}</span>
            <span className="text-xs text-on-surface-variant">{[listing.year, listing.manufacturer, listing.setName].filter(Boolean).join(' ')}</span>
            <span className="ml-auto rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-container">
              {listingStatusLabel(listing)}
            </span>
          </div>
          <h2 className="mt-2 text-[22px] leading-8 font-bold">{listing.title}</h2>
          <p className="mt-2 text-xl font-extrabold text-primary tabular-nums">{formatAskingPrice(listing.transactionType, listing.askingPrice)}</p>
          <p className="text-xs text-on-surface-variant">{formatShipping(listing.shippingFee)}</p>
          {listing.isDemo ? <p className="mt-1 text-[11px] font-semibold text-outline">데모 매물 · 가상 가격</p> : null}
        </div>

        <div className="flex gap-2 rounded-xl bg-surface-container p-3 text-xs leading-5 text-on-surface-variant">
          <Icon name="lightbulb" className="text-tertiary" />
          <p>가격과 상태는 등록자가 입력했습니다. 앱은 진품이나 대금 지급을 확인하지 않습니다.</p>
        </div>

        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-outline-variant/50">
          <h3 className="text-sm font-semibold">상태와 등급 입력</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Info label="등록자 평가" value={conditionLabel[listing.condition]} />
            <Info label="거래 유형" value={transactionLabel[listing.transactionType]} />
            <Info label="등급 구분" value={listing.gradeStatus === 'graded' ? '등급 평가 있음' : '등급 평가 없음'} />
            <Info label="등록자 입력 등급" value={grade ?? '없음'} />
            <Info label="카드 번호" value={listing.cardNumber ?? '없음'} />
            <Info label="패러렐·판본" value={listing.parallel ?? '없음'} />
            <Info label="거래 방법" value={methodLabel[listing.method]} />
            <Info label="직거래 지역" value={listing.meetupArea ?? '없음'} />
          </dl>
          {listing.certNumber ? <p className="mt-3 text-xs text-on-surface-variant">인증번호 {listing.certNumber} · 앱이 진위를 확인한 번호가 아닙니다.</p> : null}
          <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{listing.conditionNote}</p>
          {listing.tradeWish ? (
            <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-sm">
              <span className="font-semibold">교환 희망 조건</span>
              <br />
              {listing.tradeWish}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-outline-variant/50">
          <p className="text-xs text-outline">등록자</p>
          <p className="text-base font-semibold">{owner?.nickname}</p>
          <p className="text-xs text-on-surface-variant">직접 등록 정보 · {formatWhen(listing.createdAt)}</p>
          {listing.completionSource === 'mutual' ? (
            <p className="mt-2 text-xs font-semibold text-secondary">당사자 확인 거래 기록입니다. 대금 지급의 증거는 아닙니다.</p>
          ) : null}
          {listing.completionSource === 'external' ? (
            <p className="mt-2 text-xs font-semibold text-tertiary">외부 거래 완료로 표시했습니다. 쌍방 확인 실적이 아닙니다.</p>
          ) : null}
        </section>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        ) : null}

        {mine && listing.status === 'available' ? (
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/listings/${listing.id}/edit`} className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-variant text-sm font-semibold">
              수정
            </Link>
            <Button variant="ghost" onClick={() => setDanger(danger === 'external' ? null : 'external')}>
              외부 거래 완료
            </Button>
            <Button variant="danger" className="col-span-2" onClick={() => setDanger(danger === 'withdraw' ? null : 'withdraw')}>
              판매 철회
            </Button>
            {danger === 'external' ? (
              <div className="col-span-2 rounded-xl bg-surface-container-low p-3 text-sm">
                <p>앱 밖에서 거래를 마친 경우입니다. 쌍방 확인 실적으로 집계되지 않습니다.</p>
                <Button className="mt-2 w-full" onClick={() => run({ type: 'external-complete', listingId: listing.id })}>
                  외부 완료로 표시
                </Button>
              </div>
            ) : null}
            {danger === 'withdraw' ? (
              <div className="col-span-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
                <p>진행 중인 예약이 있으면 취소되고, 매물은 둘러보기에서 빠집니다.</p>
                <Button variant="danger" className="mt-2 w-full" onClick={() => run({ type: 'withdraw-listing', listingId: listing.id })}>
                  철회 확정
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        {mine && listing.status === 'reserved' ? (
          <p className="text-sm text-on-surface-variant">예약 중에는 가격과 사진을 바꿀 수 없습니다. 문의에서 예약을 취소한 뒤 수정해 주세요.</p>
        ) : null}

        <button type="button" className="text-left text-sm font-semibold text-error" onClick={() => setReportOpen((open) => !open)}>
          신고하기
        </button>
        {reportOpen ? (
          <form
            className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3"
            onSubmit={(event) => {
              event.preventDefault()
              dispatch({ type: 'report', targetType: 'listing', targetId: listing.id, reason })
              setReported(true)
            }}
          >
            <label className="text-xs font-semibold" htmlFor="report-reason">
              신고 사유
            </label>
            <select id="report-reason" className="h-11 rounded-lg border border-outline-variant bg-white px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {reasonLabel(item)}
                </option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant">신고는 이 브라우저에만 기록됩니다. 운영자 검토는 데모에 포함되지 않습니다.</p>
            <Button type="submit">신고 기록</Button>
            {reported ? <p className="text-xs font-semibold text-secondary">이 브라우저에 기록했습니다.</p> : null}
          </form>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 gap-2 border-t border-surface-container bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? '관심 해제' : '관심 저장'}
          className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant"
          onClick={() => dispatch({ type: 'set-favorite', listingId: listing.id, saved: !saved })}
        >
          <Icon name="favorite" filled={saved} className={saved ? 'text-error' : ''} />
        </button>
        {mine ? (
          <Link to="/inquiries" className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-primary-container text-sm font-semibold text-white">
            문의함 보기
          </Link>
        ) : (
          <Button className="flex-1" onClick={inquire} disabled={!canInquire}>
            {existing ? '문의 이어하기' : canInquire ? '문의하기' : '새 문의 불가'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-2">
      <dt className="text-[11px] text-outline">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function reasonLabel(reason: ReportReason) {
  const labels: Record<ReportReason, string> = {
    condition_mismatch: '상태 불일치',
    stolen_photo: '도용 사진',
    false_info: '허위 정보',
    spam: '스팸',
    dispute: '거래 분쟁',
    other: '기타',
  }
  return labels[reason]
}
