import { Link } from 'react-router-dom'
import { formatAskingPrice } from '../lib/format'
import { conditionLabel, gradeText, listingStatusLabel, sportLabel, transactionLabel } from '../lib/labels'
import { isFavorite, userById } from '../lib/query'
import { useStore } from '../lib/store'
import type { Listing } from '../types'
import { Icon } from './ui'

export function ListingCard({ listing }: { listing: Listing }) {
  const { state, dispatch } = useStore()
  const owner = userById(state, listing.ownerId)
  const saved = isFavorite(state, listing.id)
  const grade = gradeText(listing)
  const status = listingStatusLabel(listing)

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-outline-variant/60">
      <Link to={`/listings/${listing.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] bg-surface-container-low">
          <img src={listing.images[0]} alt={`${listing.title} 앞면`} className="h-full w-full object-cover" />
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {grade ? (
              <span className="rounded bg-inverse-surface px-1.5 py-0.5 text-[10px] font-bold text-inverse-on-surface">{grade}</span>
            ) : null}
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
              {transactionLabel[listing.transactionType]}
            </span>
          </div>
          <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between gap-1">
            <span className="truncate rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">{conditionLabel[listing.condition]}</span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                listing.status === 'reserved'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : listing.status === 'completed'
                    ? 'bg-surface-container-highest text-on-surface-variant'
                    : 'bg-white/90 text-on-surface'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          <p className="truncate text-[11px] font-semibold text-primary">
            {sportLabel[listing.sport]}
            {listing.setName ? ` · ${listing.setName}` : ''}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold">{listing.title}</h3>
          <p className="text-lg leading-none font-extrabold text-primary tabular-nums">
            {formatAskingPrice(listing.transactionType, listing.askingPrice)}
          </p>
          <p className="mt-auto flex items-center justify-between gap-1 pt-1 text-[11px] text-on-surface-variant">
            <span className="truncate">{owner?.nickname}</span>
            {listing.isDemo ? <span className="shrink-0 rounded-full bg-surface-container px-1.5 py-0.5">데모</span> : null}
          </p>
        </div>
      </Link>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? '관심 해제' : '관심 저장'}
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-on-surface"
        onClick={() => dispatch({ type: 'set-favorite', listingId: listing.id, saved: !saved })}
      >
        <Icon name="favorite" filled={saved} className={saved ? 'text-error' : ''} />
      </button>
    </article>
  )
}
