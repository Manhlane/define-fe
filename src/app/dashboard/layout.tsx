'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import {
  Cog6ToothIcon,
  HomeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UserCircleIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  CameraIcon,
  Bars3Icon,
  XMarkIcon,
  BoltIcon,
  CreditCardIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

// Navigation
const mainNav = [
  { name: 'Dashboard', icon: HomeIcon },
  { name: 'Bookings', icon: CalendarDaysIcon },
  { name: 'Payments', icon: CurrencyDollarIcon },
  { name: 'Clients', icon: UserGroupIcon },
  { name: 'Analytics', icon: ChartBarIcon },
  { name: 'Offer a Service', icon: CameraIcon },
]

const quickActions = [
  { name: 'Add Booking', icon: BoltIcon },
  { name: 'Create Payment Request', icon: CreditCardIcon },
  { name: 'Add Client', icon: UserPlusIcon },
]

const bottomNav = [
  { name: 'Profile', icon: UserCircleIcon },
  { name: 'Help', icon: QuestionMarkCircleIcon },
  { name: 'Settings', icon: Cog6ToothIcon },
  { name: 'Logout', icon: ArrowRightOnRectangleIcon },
]

// Empty states
const emptyStates: Record<
  string,
  { title: string; subtitle: string; action: string; icon: any }
> = {
  Dashboard: {
    title: 'Welcome to your Dashboard',
    subtitle: 'You’ll see a snapshot of your activity here once you get going.',
    action: 'Explore Features',
    icon: HomeIcon,
  },
  Bookings: {
    title: 'No bookings yet',
    subtitle: 'Start by scheduling a new booking with your client.',
    action: 'Add Booking',
    icon: CalendarDaysIcon,
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
  Analytics: {
    title: 'No analytics yet',
    subtitle: 'You’ll see reports and insights once you have some activity.',
    action: 'View Reports',
    icon: ChartBarIcon,
  },
  Profile: {
    title: 'Your profile is empty',
    subtitle: 'Complete your profile so clients can know more about you.',
    action: 'Edit Profile',
    icon: UserCircleIcon,
  },
  Help: {
    title: 'Need help?',
    subtitle: 'Browse our help resources or contact support.',
    action: 'Get Support',
    icon: QuestionMarkCircleIcon,
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
  'Offer a Service': {
    title: 'You haven’t onboarded yet',
    subtitle:
      'Become a service provider to start offering photography services and accepting bookings.',
    action: 'Start Onboarding',
    icon: CameraIcon,
  },
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DefineLayout() {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderNavItem = (item: any) => {
    const isActive = active === item.name
    const isOfferService = item.name === 'Offer a Service'

    return (
      <li key={item.name}>
        <button
          onClick={() => {
            setActive(item.name)
            setSidebarOpen(false)
          }}
          className={classNames(
            'group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium',
            isActive
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-black hover:ring-1 hover:ring-black dark:text-white dark:hover:ring-white'
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
            {isOfferService && (
              <span className="inline-flex items-center rounded-md bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                New
              </span>
            )}
          </span>
        </button>
      </li>
    )
  }

  const renderEmptyState = () => {
    const state = emptyStates[active]
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
    <div>
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
          <Dialog.Panel className="relative flex w-64 flex-col bg-white dark:bg-gray-900 p-6">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-700 dark:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="mt-10">
              <ul role="list" className="space-y-1">
                {mainNav.map(renderNavItem)}
              </ul>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
              <ul role="list" className="space-y-1">
                {quickActions.map(renderNavItem)}
              </ul>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
              <ul role="list" className="space-y-1">{bottomNav.map(renderNavItem)}</ul>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col justify-between border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-900">
          <div>
            <div className="flex h-16 items-center text-xl font-semibold text-black dark:text-white">
              define!.
            </div>
            <nav className="mt-4">
              <ul role="list" className="space-y-1">{mainNav.map(renderNavItem)}</ul>
            </nav>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
            <nav>
              <ul role="list" className="space-y-1">{quickActions.map(renderNavItem)}</ul>
            </nav>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
          <nav>
            <ul role="list" className="space-y-1">{bottomNav.map(renderNavItem)}</ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-10 px-4 sm:px-6 lg:px-8 min-h-screen">{renderEmptyState()}</main>
      </div>
    </div>
  )
}
