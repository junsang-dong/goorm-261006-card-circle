import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { formatAskingPrice, formatKrw, formatWhen } from '../../lib/format'
import { listingStatusLabel, tradeStatusLabel } from '../../lib/labels'
import { isPublicListing, listingById, userById } from '../../lib/query'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/format'

type Tab = 'listings' | 'favorites' | 'trades'

export function ProfilePage() {
  const { state, dispatch, resetDemo } = useStore()
  const [tab, setTab] = useState<Tab>('listings')
  const [resetArmed, setResetArmed] = useState(false)
  const me = userById(state, state.currentUserId)
  const mine = state.listings.filter((listing) => listing.ownerId === state.currentUserId && listing.status !== 'draft')
  const favorites = state.favorites
    .filter((item) => item.userId === state.currentUserId)
    .map((item) => listingById(state, item.listingId))
    .filter((listing) => listing && (isPublicListing(listing) || listing.ownerId === state.currentUserId))
  const trades = state.trades
    .filter((trade) => trade.sellerId === state.currentUserId || trade.buyerId === state.currentUserId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const external = mine.filter((listing) => listing.completionSource === 'external')

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold">내 정보</h2>
      <section className="mt-3 rounded-xl bg-white p-4 ring-1 ring-outline-variant/60">
        <p className="text-xs text-outline">데모 회원</p>
        <p className="text-xl font-bold">{me?.nickname}</p>
        <p className="text-xs text-on-surface-variant">로그인 ID {me?.loginId}</p>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">
          위쪽의 지금 보는 사람으로 다른 데모 회원의 매물·문의·예약을 볼 수 있습니다. 운영 로그인 화면은 아닙니다.
        </p>
      </section>

      <div className="mt-4 flex gap-2">
        {(
          [
            ['listings', '내 매물'],
            ['favorites', '관심'],
            ['trades', '거래 기록'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', tab === key ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'listings' ? (
        <ul className="mt-3 flex flex-col gap-2">
          {mine.length === 0 ? <Empty text="등록한 매물이 없습니다." /> : null}
          {mine.map((listing) => (
            <li key={listing.id}>
              <Link to={`/listings/${listing.id}`} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-outline-variant/60">
                <img src={listing.images[0]} alt="" className="h-16 w-12 rounded-lg object-cover" />
                <span>
                  <span className="block text-sm font-semibold">{listing.title}</span>
                  <span className="text-sm font-extrabold text-primary tabular-nums">{formatAskingPrice(listing.transactionType, listing.askingPrice)}</span>
                  <span className="mt-1 block text-[11px] font-semibold">{listingStatusLabel(listing)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'favorites' ? (
        <ul className="mt-3 flex flex-col gap-2">
          {favorites.length === 0 ? <Empty text="관심 저장한 매물이 없습니다." /> : null}
          {favorites.map((listing) =>
            listing ? (
              <li key={listing.id}>
                <Link to={`/listings/${listing.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-outline-variant/60">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{listing.title}</span>
                    <span className="text-xs text-on-surface-variant">{formatAskingPrice(listing.transactionType, listing.askingPrice)}</span>
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-error"
                    onClick={(event) => {
                      event.preventDefault()
                      dispatch({ type: 'set-favorite', listingId: listing.id, saved: false })
                    }}
                  >
                    해제
                  </button>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      {tab === 'trades' ? (
        <div className="mt-3 flex flex-col gap-4">
          <section>
            <h3 className="text-sm font-semibold">진행·완료 기록</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {trades.length === 0 ? <Empty text="거래 기록이 없습니다." /> : null}
              {trades.map((trade) => {
                const listing = listingById(state, trade.listingId)
                const otherId = trade.sellerId === state.currentUserId ? trade.buyerId : trade.sellerId
                const other = userById(state, otherId)
                return (
                  <li key={trade.id} className="rounded-xl bg-white p-3 text-sm ring-1 ring-outline-variant/60">
                    <Link to={`/inquiries/${trade.inquiryId}`} className="font-semibold">
                      {listing?.title}
                    </Link>
                    <p className="text-xs text-on-surface-variant">
                      {other?.nickname} · {tradeStatusLabel[trade.status]} · {formatWhen(trade.updatedAt)}
                    </p>
                    {trade.status === 'confirmed' ? (
                      <p className="mt-1 text-xs font-semibold text-secondary">
                        당사자 확인{trade.agreedPrice != null ? ` · 합의 ${formatKrw(trade.agreedPrice)}` : ''}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold">외부 거래 완료</h3>
            <p className="text-xs text-on-surface-variant">쌍방 확인 실적에 넣지 않습니다.</p>
            <ul className="mt-2 flex flex-col gap-2">
              {external.length === 0 ? <Empty text="외부 완료로 표시한 매물이 없습니다." /> : null}
              {external.map((listing) => (
                <li key={listing.id}>
                  <Link to={`/listings/${listing.id}`} className="block rounded-xl bg-white p-3 text-sm ring-1 ring-outline-variant/60">
                    {listing.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      <section className="mt-6 rounded-xl bg-surface-container-low p-4 text-sm">
        <h3 className="font-semibold">비밀번호</h3>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">데모 모드에는 비밀번호가 없습니다.</p>
        {resetArmed ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs">이 브라우저의 등록·문의·관심 변경이 처음 시드로 돌아갑니다.</p>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo()
                setResetArmed(false)
              }}
            >
              초기화 확정
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="mt-3 w-full" onClick={() => setResetArmed(true)}>
            데모 데이터 초기화
          </Button>
        )}
      </section>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-on-surface-variant">{text}</p>
}
