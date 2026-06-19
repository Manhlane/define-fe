'use client'

import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  HomeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

// Navigation
type IconComponent = (props: ComponentProps<'svg'>) => ReactNode

type NavItem = {
  name: string
  icon: IconComponent
  href?: string
  comingSoon?: boolean
}

const mainNav: NavItem[] = [
  { name: 'Create payment link', icon: PlusIcon, href: '/create-payment-link' },
  { name: 'Home', icon: HomeIcon, href: '/home' },
  { name: 'Dashboard', icon: ClockIcon, href: '/transactions' },
]

const bottomNav: NavItem[] = [
  { name: 'Profile', icon: UserCircleIcon, href: '/profile' },
  { name: 'Logout', icon: ArrowRightOnRectangleIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const STORAGE_KEY = 'define.auth';
const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://34.251.72.37:3000/auth';
const LOGOUT_URL = `${AUTH_BASE_URL}/logout`;

function resolveNavByPath(pathname: string): string {
  const navItemsWithHref = [...mainNav, ...bottomNav].filter(
    (item): item is NavItem & { href: string } => typeof item.href === 'string'
  );

  const matchedNav = navItemsWithHref.find((item) => {
    if (!item.href) return false;
    if (item.href === '/home') {
      return pathname === '/home';
    }
    if (pathname === item.href) return true;
    return item.href !== '/home' && pathname.startsWith(`${item.href}/`);
  });

  if (matchedNav) {
    return matchedNav.name;
  }

  return 'Home';
}

export default function DefineLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(() => resolveNavByPath(pathname ?? '/home'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleGlobalLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      let accessToken: string | undefined;
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { accessToken?: string };
            accessToken = parsed?.accessToken;
          } catch (error) {
            console.warn('Failed to parse stored auth payload', error);
          }
        }
      }

      if (accessToken) {
        try {
          const res = await fetch(LOGOUT_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!res.ok && res.status !== 401) {
            try {
              const body = await res.json();
              console.warn('Logout responded with error', body);
            } catch {
              // ignore parse errors
            }
          }
        } catch (error) {
          console.error('Logout request failed', error);
        }
      }
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem('define.profile');
      }
    }

    // Give the user a moment to register the loader before redirecting.
    await new Promise((resolve) => setTimeout(resolve, 500));

    setActive('Home');
    router.push('/welcome-to-dfn');
    //setIsLoggingOut(false);
  }, [isLoggingOut, router]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const resolved = resolveNavByPath(pathname);
    setActive(resolved);
  }, [pathname]);

  const isFullBleedRoute =
    pathname?.startsWith('/create-payment-link') || pathname?.startsWith('/transactions');

  const renderNavItem = (item: NavItem) => {
    const isActive = active === item.name;
    const isLogout = item.name === 'Logout';

    return (
      <li key={item.name}>
        <button
          onClick={() => {
            if (isLogout) {
              setSidebarOpen(false);
              void handleGlobalLogout();
              return;
            }

            if (item.href) {
              setActive(item.name);
              setSidebarOpen(false);
              if (pathname !== item.href) {
                router.push(item.href);
              }
              return;
            }

            setActive(item.name);
            setSidebarOpen(false);
            if (pathname !== '/home') {
              router.push('/home');
            }
          }}
          disabled={isLogout && isLoggingOut}
          className={classNames(
            isActive
              ? 'bg-[var(--app-accent-soft)] text-[var(--app-foreground)] shadow-[inset_0_0_0_1px_var(--app-border-soft)]'
              : 'hover:bg-[rgba(255,255,255,0.04)]',
            'group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-muted)] transition disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          <item.icon
            aria-hidden="true"
            className={classNames(
              'h-5 w-5 shrink-0',
              isActive ? 'text-[var(--app-accent-strong)]' : 'text-[var(--app-muted)] group-hover:text-[var(--app-foreground)]'
            )}
          />
          {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
        </button>
      </li>
    )
  }

  return (
    <div className="dfn-indigo-page relative min-h-screen text-[var(--app-foreground)]">
      <Dialog open={isLoggingOut} onClose={() => {}} className="relative z-[90]">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-[#030611]/70 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-200"
        />
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-xs transform rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-8 text-center shadow-[var(--app-shadow)] transition-all data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <ClockIcon className="mx-auto h-10 w-10 animate-spin text-[var(--app-accent)]" />
            <p className="mt-4 text-lg font-semibold text-[var(--app-foreground)]">Signing out…</p>
            <p className="mt-2 text-sm text-[var(--app-muted-soft)]">We’ll be right here when you get back.</p>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--app-border)] bg-[rgba(5,7,19,0.88)] px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-[var(--app-muted)]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="text-xl font-semibold text-[var(--app-foreground)]"
            onClick={() => router.push('/home')}
            aria-label="Go to home"
          >
            dfn!.
          </button>
        </div>
        <button
          type="button"
          className="text-[var(--app-muted)]"
          onClick={() => router.push('/profile')}
          aria-label="Profile"
        >
          <UserCircleIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <Dialog as="div" className="lg:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
        <div className="fixed inset-0 z-50 flex">
          <Dialog.Panel className="relative flex w-72 flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-5">
            <div className="flex items-center justify-between text-xl font-semibold text-[var(--app-foreground)]">
              <span>dfn!.</span>
              <button
                type="button"
                className="text-[var(--app-muted)]"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto pr-2">
                <ul role="list" className="space-y-1">
                  {mainNav.map(renderNavItem)}
                </ul>
              </div>
              <div className="my-4 border-t border-[var(--app-border)]" />
              <ul role="list" className="space-y-1">
                {bottomNav.map(renderNavItem)}
              </ul>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div
        className={classNames(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        )}
      >
        <div className="relative flex grow flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] px-6 pb-4">
          <div className="relative flex h-16 items-center justify-between text-2xl font-semibold text-[var(--app-foreground)]">
            {!sidebarCollapsed && <span>dfn!.</span>}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--app-muted)] transition hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-foreground)]"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="relative flex flex-1 min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto pr-2">
              <nav className="mt-4">
                <ul role="list" className="space-y-1">
                  {mainNav.map(renderNavItem)}
                </ul>
              </nav>
            </div>
            <div className="my-4 border-t border-[var(--app-border)]" />
            <nav>
              <ul role="list" className="space-y-1">
                {bottomNav.map(renderNavItem)}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={classNames(sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <main
          className={classNames(
            'min-h-screen',
            isFullBleedRoute ? '' : 'px-4 py-10 sm:px-6 lg:px-8'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
