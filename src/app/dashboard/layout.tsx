'use client'

import { useState } from 'react'
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

  const renderNavItem = (item: any) => {
    const isActive = active === item.name
    const isOfferService = item.name === 'Offer a Service'

    return (
      <li key={item.name}>
        <button
          onClick={() => setActive(item.name)}
          className={classNames(
            isActive
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-black hover:bg-gray-100 hover:text-black dark:text-white dark:hover:bg-gray-800 dark:hover:text-white',
            'group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium transition'
          )}
        >
          <item.icon
            aria-hidden="true"
            className={classNames(
              isActive
                ? 'text-white dark:text-black'
                : 'text-black dark:text-white',
              'h-5 w-5 shrink-0'
            )}
          />
          <span className="truncate flex items-center gap-2">
            {item.name}
            {isOfferService && (
              <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
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
        <Icon className="h-16 w-16 text-black dark:text-white" aria-hidden="true" />
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
          {state.title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{state.subtitle}</p>
        <div className="mt-8">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-black px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <PlusIcon className="mr-2 h-6 w-6" aria-hidden="true" />
            {state.action}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col justify-between border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-900">
          <div>
            <div className="flex h-16 items-center text-xl font-semibold text-black dark:text-white">
              define!.
            </div>
            <nav className="mt-4">
              <ul role="list" className="space-y-1">
                {mainNav.map(renderNavItem)}
              </ul>
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
