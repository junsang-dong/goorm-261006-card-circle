import { Link } from 'react-router-dom'
import { formatWhen } from '../../lib/format'
import { listingStatusLabel } from '../../lib/labels'
import { listingById, messagesFor, unreadCount, userById } from '../../lib/query'
import { useStore } from '../../lib/store'

export function InquiryListPage() {
  const { state } = useStore()
  const mine = state.inquiries
    .filter((inquiry) => inquiry.buyerId === state.currentUserId || inquiry.sellerId === state.currentUserId)
    .sort((a, b) => {
      const aTime = messagesFor(state, a.id).at(-1)?.createdAt ?? a.createdAt
      const bTime = messagesFor(state, b.id).at(-1)?.createdAt ?? b.createdAt
      return bTime.localeCompare(aTime)
    })

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold">문의함</h2>
      <p className="mt-1 text-xs text-on-surface-variant">내가 참여한 비공개 대화만 보입니다.</p>
      {mine.length === 0 ? <p className="py-10 text-center text-sm text-on-surface-variant">아직 문의가 없습니다.</p> : null}
      <ul className="mt-3 flex flex-col gap-2">
        {mine.map((inquiry) => {
          const listing = listingById(state, inquiry.listingId)
          const otherId = inquiry.buyerId === state.currentUserId ? inquiry.sellerId : inquiry.buyerId
          const other = userById(state, otherId)
          const last = messagesFor(state, inquiry.id).at(-1)
          const unread = unreadCount(state, inquiry)
          return (
            <li key={inquiry.id}>
              <Link to={`/inquiries/${inquiry.id}`} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-outline-variant/60">
                {listing ? <img src={listing.images[0]} alt="" className="h-16 w-12 rounded-lg object-cover" /> : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{other?.nickname}</span>
                    <span className="shrink-0 text-[11px] text-outline">{last ? formatWhen(last.createdAt) : formatWhen(inquiry.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-on-surface-variant">{listing?.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{last?.body ?? '메시지가 없습니다.'}</span>
                    {unread > 0 ? <span className="rounded-full bg-error px-1.5 text-[10px] font-bold text-white">{unread}</span> : null}
                  </span>
                  {listing ? <span className="mt-1 inline-block text-[11px] font-semibold text-primary">{listingStatusLabel(listing)}</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
