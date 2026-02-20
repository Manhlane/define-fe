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
  { name: 'Home', icon: HomeIcon, href: '/home' },
  { name: 'Transactions', icon: ClockIcon, href: '/transactions' },
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
            isActive ? 'bg-gray-50' : 'hover:bg-gray-50',
            'group flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5 dark:bg-transparent'
          )}
        >
          <item.icon
            aria-hidden="true"
            className={classNames(
              'h-5 w-5 shrink-0 text-gray-400',
              isActive ? 'text-gray-500 dark:text-gray-300' : 'group-hover:text-gray-500 dark:group-hover:text-gray-300'
            )}
          />
          {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
        </button>
      </li>
    )
  }

  return (
    <div className="relative">
      <Dialog open={isLoggingOut} onClose={() => {}} className="relative z-[90]">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-200"
        />
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-xs transform rounded-2xl bg-white px-6 py-8 text-center shadow-xl transition-all data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-900/95 dark:text-white"
          >
            <ClockIcon className="mx-auto h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Signing out…</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">We’ll be right here when you get back.</p>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-3 dark:bg-gray-900 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-gray-700 dark:text-white"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="text-xl font-semibold text-black dark:text-white"
            onClick={() => router.push('/home')}
            aria-label="Go to home"
          >
            dfn!.
          </button>
        </div>
        <button
          type="button"
          className="text-gray-700 dark:text-white"
          onClick={() => router.push('/profile')}
          aria-label="Profile"
        >
          <UserCircleIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <Dialog as="div" className="lg:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
        <div className="fixed inset-0 z-50 flex">
          <Dialog.Panel className="relative flex w-72 flex-col border-r border-gray-200 bg-white px-6 py-5 dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between text-xl font-semibold text-black dark:text-white">
              <span>dfn!.</span>
              <button
                type="button"
                className="text-gray-700 dark:text-white"
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
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
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
        <div className="relative flex grow flex-col border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-900">
          <div className="relative flex h-16 items-center justify-between text-2xl font-semibold text-black dark:text-white">
            {!sidebarCollapsed && <span>dfn!.</span>}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
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
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
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
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
