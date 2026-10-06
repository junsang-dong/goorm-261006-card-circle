import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { myUnreadTotal, userById } from '../lib/query'
import { useStore } from '../lib/store'
import { cn } from '../lib/format'
import { Icon } from './ui'

function isStack(path: string) {
  if (path === '/listings/new') return true
  if (/^\/listings\/[^/]+\/edit$/.test(path)) return true
  if (/^\/listings\/[^/]+$/.test(path)) return true
  if (/^\/inquiries\/[^/]+$/.test(path)) return true
  return false
}

export function AppShell() {
  const location = useLocation()
  const stack = isStack(location.pathname)
  const { state, persistError, dispatch } = useStore()
  const unread = myUnreadTotal(state)
  const me = userById(state, state.currentUserId)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [shellTop, setShellTop] = useState(48)

  useEffect(() => {
    const element = bannerRef.current
    if (!element) return
    const sync = () => setShellTop(element.offsetHeight)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(element)
    return () => observer.disconnect()
  }, [persistError, stack])

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface text-on-surface" style={{ ['--shell-top' as string]: `${shellTop}px` }}>
      <div ref={bannerRef} className="sticky top-0 z-40">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-primary-fixed px-4 py-2 text-xs text-on-primary-fixed">
          <p className="font-semibold">데모: 이 브라우저에만 저장</p>
          <label className="flex items-center gap-1 font-semibold">
            지금 보는 사람
            <select
              aria-label="지금 보는 사람"
              className="max-w-40 rounded-md bg-white px-2 py-1 text-xs text-on-surface"
              value={state.currentUserId}
              onChange={(event) => dispatch({ type: 'set-user', userId: event.target.value })}
            >
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nickname}
                </option>
              ))}
            </select>
          </label>
        </div>
        {persistError ? (
          <p role="alert" className="bg-error-container px-4 py-2 text-xs text-on-error-container">
            {persistError}
          </p>
        ) : null}
        {stack ? null : (
          <header className="flex h-14 items-center justify-between bg-surface-container-lowest/90 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-[11px] font-extrabold text-white">
                CC
              </span>
              <div>
                <p className="text-base leading-none font-semibold">카드서클</p>
                <p className="text-[10px] font-bold text-primary">초대 지인 데모</p>
              </div>
            </div>
            <p className="max-w-28 truncate text-xs text-on-surface-variant">{me?.nickname}</p>
          </header>
        )}
      </div>
      <main className={stack ? '' : 'pb-28'}>
        <Outlet />
        {/^\/inquiries\/[^/]+$/.test(location.pathname) ? null : (
          <footer className="px-4 py-8 text-center text-[11px] leading-relaxed break-words text-outline">
            Developed by Jun · NextPlatform | React · Vite · TypeScript · Vercel / Built with Codex · SPEC with ChatGPT |
            Version 1.0.0 · © 2026
          </footer>
        )}
      </main>
      {stack ? null : (
        <nav
          aria-label="주요 메뉴"
          className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-surface-container bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        >
          <div className="flex h-16 items-center justify-around px-1">
            <Tab to="/" label="둘러보기" icon="style" end />
            <NavLink
              to="/listings/new"
              aria-label="카드 등록"
              className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg"
            >
              <Icon name="add" />
            </NavLink>
            <Tab to="/inquiries" label="문의함" icon="chat_bubble" badge={unread} />
            <Tab to="/me" label="내 정보" icon="person" />
          </div>
        </nav>
      )}
    </div>
  )
}

function Tab({ to, label, icon, end = false, badge = 0 }: { to: string; label: string; icon: string; end?: boolean; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('relative flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-on-surface-variant')
      }
    >
      <Icon name={icon} />
      {label}
      {badge > 0 ? (
        <span className="absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] text-on-error">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}
