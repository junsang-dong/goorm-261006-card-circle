import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ListingCard } from '../../components/ListingCard'
import { Icon } from '../../components/ui'
import { filterListings, sportCounts, type ListingQuery } from '../../lib/query'
import { useStore } from '../../lib/store'
import { sportEmoji, sportLabel, transactionLabel } from '../../lib/labels'
import type { Sport, TransactionType } from '../../types'
import { cn } from '../../lib/format'

const sports: Array<Sport | 'all'> = ['all', 'baseball', 'basketball', 'soccer', 'other']
const types: Array<TransactionType | 'all'> = ['all', 'sale', 'trade', 'giveaway']
const statuses: Array<ListingQuery['status']> = ['all', 'available', 'reserved', 'completed']

const statusLabel: Record<ListingQuery['status'], string> = {
  all: '상태 전체',
  available: '진행중',
  reserved: '예약중',
  completed: '거래완료',
}

const sortLabel: Record<ListingQuery['sort'], string> = {
  latest: '최신 등록순',
  price_asc: '낮은 가격순',
  price_desc: '높은 가격순',
}

function readQuery(params: URLSearchParams): ListingQuery {
  const sport = params.get('sport')
  const type = params.get('type')
  const status = params.get('status')
  const sort = params.get('sort')
  return {
    search: params.get('q') ?? '',
    sport: sports.includes(sport as Sport | 'all') ? (sport as Sport | 'all') : 'all',
    transactionType: types.includes(type as TransactionType | 'all') ? (type as TransactionType | 'all') : 'all',
    status: statuses.includes(status as ListingQuery['status']) ? (status as ListingQuery['status']) : 'all',
    sort: sort === 'price_asc' || sort === 'price_desc' || sort === 'latest' ? sort : 'latest',
  }
}

export function BrowsePage() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const query = readQuery(params)
  const counts = useMemo(() => sportCounts(state.listings), [state.listings])
  const listings = useMemo(() => filterListings(state.listings, query), [state.listings, query])

  const set = (patch: Partial<Record<string, string>>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === 'all' || value === 'latest') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const cycleSort = () => {
    const order: ListingQuery['sort'][] = ['latest', 'price_asc', 'price_desc']
    const next = order[(order.indexOf(query.sort) + 1) % order.length]
    set({ sort: next })
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <section className="px-4 pt-3">
        <div className="rounded-xl bg-surface-container-high p-4">
          <p className="text-[11px] font-bold tracking-wide text-primary">지인 기반 카드 서클</p>
          <h2 className="mt-1 text-base font-semibold">지인들과 직접 나누는 카드 컬렉션</h2>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
            사진, 상태, 희망 가격은 등록 회원이 직접 입력합니다. 앱은 대금을 보관하거나 배송을 대신하지 않습니다.
          </p>
          <Link
            to="/listings/new"
            className="mt-3 inline-flex h-10 items-center rounded-lg bg-primary-container px-3 text-sm font-semibold text-white"
          >
            카드 등록
          </Link>
        </div>
      </section>

      <div className="px-4">
        <label className="relative block">
          <span className="sr-only">매물 검색</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline" />
          <input
            value={query.search}
            onChange={(event) => set({ q: event.target.value })}
            placeholder="선수, 제목, 세트, 카드 번호"
            className="h-11 w-full rounded-lg border border-outline-variant bg-white pr-3 pl-10 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 px-4">
        {sports.map((sport) => (
          <button
            key={sport}
            type="button"
            aria-pressed={query.sport === sport}
            onClick={() => set({ sport })}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold',
              query.sport === sport ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant',
            )}
          >
            {sport === 'all' ? '전체' : `${sportEmoji[sport]} ${sportLabel[sport]}`} {counts[sport]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <div className="flex flex-wrap gap-1.5">
          {types.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={query.transactionType === type}
              onClick={() => set({ type })}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-semibold',
                query.transactionType === type ? 'bg-surface-container-highest text-primary' : 'bg-surface-container-low text-on-surface-variant',
              )}
            >
              {type === 'all' ? '거래 전체' : transactionLabel[type]}
            </button>
          ))}
        </div>
        <button type="button" onClick={cycleSort} className="inline-flex items-center gap-0.5 rounded-lg bg-surface-container-low px-2 py-1 text-[11px] font-semibold">
          <Icon name="swap_vert" className="text-base" />
          {sortLabel[query.sort]}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={query.status === status}
            onClick={() => set({ status })}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              query.status === status ? 'bg-on-surface text-white' : 'bg-surface-container-low text-on-surface-variant',
            )}
          >
            {statusLabel[status]}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-on-surface-variant">조건에 맞는 매물이 없습니다.</p>
      ) : (
        <section className="grid grid-cols-2 gap-3 px-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </div>
  )
}
