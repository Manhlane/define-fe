'use client'

import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  Cog6ToothIcon,
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  CircleStackIcon,
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
  { name: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
  { name: 'Payments', icon: CurrencyDollarIcon, href: '/payments' },
  { name: 'Clients', icon: UserGroupIcon, href: '/clients' },
]

const bottomNav: NavItem[] = [
  { name: 'Profile', icon: UserCircleIcon, href: '/profile' },
  { name: 'Settings', icon: Cog6ToothIcon },
  { name: 'Logout', icon: ArrowRightOnRectangleIcon },
]

// Empty states
type EmptyState = {
  title: string
  subtitle: string
  action: string
  icon: IconComponent
}

const emptyStates: Record<string, EmptyState> = {
  Dashboard: {
    title: 'Welcome to your Dashboard',
    subtitle: 'You’ll see a snapshot of your activity here once you get going.',
    action: 'Explore Features',
    icon: HomeIcon,
  },
  Payments: {
    title: 'No payments recorded',
    subtitle: 'Track your earnings and manage your payouts here.',
    action: 'Create Payment Request',
    icon: CurrencyDollarIcon,
  },
  Clients: {
    title: 'No clients added',
    subtitle: 'Invite or add clients to start working with them.',
    action: 'Add Client',
    icon: UserGroupIcon,
  },
  Profile: {
    title: 'Your profile is empty',
    subtitle: 'Complete your profile so clients can know more about you.',
    action: 'Edit Profile',
    icon: UserCircleIcon,
  },
  Settings: {
    title: 'No settings configured',
    subtitle: 'Manage your account and app preferences here.',
    action: 'Update Settings',
    icon: Cog6ToothIcon,
  },
  Logout: {
    title: 'Ready to sign out?',
    subtitle: 'You can always log back in anytime.',
    action: 'Logout',
    icon: ArrowRightOnRectangleIcon,
  },
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const STORAGE_KEY = 'define.auth';
const LOGOUT_URL = 'http://localhost:3002/auth/logout';

function resolveNavByPath(pathname: string): string {
  const navItemsWithHref = [...mainNav, ...bottomNav].filter(
    (item): item is NavItem & { href: string } => typeof item.href === 'string'
  );

  const matchedNav = navItemsWithHref.find((item) => {
    if (!item.href) return false;
    if (item.href === '/') {
      return pathname === '/';
    }
    if (pathname === item.href) return true;
    return item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`);
  });

  if (matchedNav) {
    return matchedNav.name;
  }

  if (pathname.startsWith('/dashboard')) {
    return 'Dashboard';
  }

  return 'Dashboard';
}

export default function DefineLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(() => resolveNavByPath(pathname ?? '/dashboard'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

    setActive('Dashboard');
    router.push('/login');
    //setIsLoggingOut(false);
  }, [isLoggingOut, router]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const resolved = resolveNavByPath(pathname);
    const isDashboardRoot = pathname === '/dashboard';

    setActive((prev) => {
      if (isDashboardRoot) {
        // Preserve manual selection for dashboard secondary sections (Bookings, Payments placeholder, etc.)
        return prev;
      }
      return resolved;
    });
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
            if (pathname !== '/dashboard') {
              router.push('/dashboard');
            }
          }}
          disabled={isLogout && isLoggingOut}
          className={classNames(
            'group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
            isActive
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-black hover:ring-1 hover:ring-inset hover:ring-black dark:text-white dark:hover:ring-white dark:hover:ring-inset'
          )}
        >
          <item.icon
            aria-hidden="true"
            className={classNames(
              'h-5 w-5 shrink-0',
              isActive
                ? 'text-white dark:text-black'
                : 'text-black dark:text-white group-hover:text-black dark:group-hover:text-white'
            )}
          />
          <span className="truncate flex items-center gap-2">
            {item.name}
          </span>
        </button>
      </li>
    )
  }

  const renderEmptyState = () => {
    const state = emptyStates[active] ?? emptyStates['Dashboard']
    const Icon = state.icon
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-white/15 p-12">
          <Icon className="mx-auto h-12 w-12 text-black dark:text-white" aria-hidden="true" />
          <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
            {state.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{state.subtitle}</p>
          <div className="mt-8">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-black px-5 py-3 text-sm font-medium text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              {state.action}
            </button>
          </div>
        </div>
      </div>
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
            <CircleStackIcon className="mx-auto h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Signing out…</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">We’ll be right here when you get back.</p>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center bg-white px-4 py-2 shadow-sm dark:bg-gray-900 lg:hidden">
        <button
          type="button"
          className="text-gray-700 dark:text-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="ml-3 text-lg font-semibold text-black dark:text-white">define!.</div>
      </div>

      {/* Mobile sidebar */}
      <Dialog as="div" className="lg:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
        <div className="fixed inset-0 z-50 flex">
          <Dialog.Panel className="relative flex w-64 flex-col bg-white p-6 dark:bg-gray-900">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-700 dark:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="mt-10 flex min-h-0 flex-1 flex-col">
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-900">
          <div className="flex h-16 items-center text-xl font-semibold text-black dark:text-white">
            define!.
          </div>
          <div className="flex flex-1 min-h-0 flex-col">
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
      <div className="lg:pl-64">
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          {pathname === '/dashboard' && active !== 'Dashboard' ? renderEmptyState() : children}
        </main>
      </div>
    </div>
  )
}
