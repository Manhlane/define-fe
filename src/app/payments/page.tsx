'use client';

import DefineLayout from '../../components/DefineLayout';
import { FormEvent, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { ArrowDownTrayIcon, PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'

interface Transaction {
  id: string;
  name: string;
  avatarUrl?: string;
  type: string;
  amount: string;
  status: string;
  date: string;
  reference: string;
  description?: string;
}

const filters = ['All', 'Released', 'In Escrow', 'Paid Out', 'Pending'] as const

type StatusFilter = (typeof filters)[number]

function PaymentsPageContent() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All')
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    amount: '',
    dueDate: '',
    description: '',
  })

  const statusClasses: Record<string, string> = {
    Released: 'bg-green-100 text-green-700',
    'In Escrow': 'bg-gray-100 text-gray-700',
    'Paid Out': 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  }

  const overviewStats = [
    {
      name: 'Total Transactions',
      value: transactions.length.toString(),
      change: transactions.length === 0 ? 'Create a payment request to begin' : 'Across all statuses',
      highlight: true,
    },
    {
      name: 'Pending Requests',
      value: transactions.filter((tx) => tx.status === 'Pending').length.toString(),
      change: 'Awaiting client action',
      highlight: false,
    },
    {
      name: 'In Escrow',
      value: transactions.filter((tx) => tx.status === 'In Escrow').length.toString(),
      change: 'Funds held for bookings',
      highlight: false,
    },
    {
      name: 'Payouts',
      value: transactions.filter((tx) => tx.status === 'Paid Out').length.toString(),
      change: 'Released to your account',
      highlight: false,
    },
  ] as const

  const filteredTransactions = useMemo(() => {
    return activeFilter === 'All'
      ? transactions
      : transactions.filter((tx) => tx.status === activeFilter)
  }, [activeFilter, transactions])

  const pageSize = 8
  const totalItems = filteredTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems)

  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize)

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter)
    setPage(1)
  }

  const hasTransactions = transactions.length > 0

  const handleRequestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amountValue = Number(requestForm.amount)

    if (!requestForm.name.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      return
    }

    const today = new Date()
    const formattedDate = requestForm.dueDate
      ? new Date(requestForm.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
      : today.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      name: requestForm.name.trim(),
      type: 'Payment Request',
      amount: `R${amountValue.toFixed(2)}`,
      status: 'Pending',
      date: formattedDate,
      reference: `#DFN-${Math.floor(Math.random() * 9000 + 1000)}`,
      description: requestForm.description?.trim() || 'Payment request created from the dashboard.',
    }

    setTransactions((prev) => [newTransaction, ...prev])
    setActiveFilter('All')
    setPage(1)
    setRequestForm({
      name: '',
      email: '',
      amount: '',
      dueDate: '',
      description: '',
    })
    setRequestModalOpen(false)
  }

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Header */}
      <header className="border-b border-black px-6 py-6 sm:px-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Track your escrow, payouts, and transactions</p>
      </header>

      {/* Overview */}
      <section className="px-6 pt-10 sm:px-10">
        <div className="overflow-hidden rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat, index) => {
              const isHighlight = stat.highlight;
              const cardClasses = [
                'px-5 py-6 sm:px-6 lg:px-8 flex flex-col gap-2',
                isHighlight ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
                'border-black',
                index > 0 ? 'border-t' : 'border-t-0',
                index < 2 ? 'sm:border-t-0' : 'sm:border-t',
                index < 4 ? 'lg:border-t-0' : 'lg:border-t',
                index % 2 === 0 ? 'sm:border-l-0' : 'sm:border-l',
                index % 4 === 0 ? 'lg:border-l-0' : 'lg:border-l',
              ].join(' ');

              return (
                <div key={stat.name} className={cardClasses}>
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${
                      isHighlight ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {stat.name}
                  </p>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className={`text-xs ${isHighlight ? 'text-white/60' : 'text-gray-500'}`}>{stat.change}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="p-6 sm:p-10">
        <div className="flex flex-col gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {hasTransactions && (
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterChange(filter)}
                      className={`rounded-full border px-4 py-1 text-xs font-medium transition active:scale-[0.99] ${
                        isActive
                          ? 'border-black bg-black text-white'
                          : 'border-neutral-300 text-black hover:bg-neutral-50'
                      }`}
                    >
                      {filter}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-900"
                onClick={() => setRequestModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Create Payment Request
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                onClick={() => setWithdrawModalOpen(true)}
              >
                <BanknotesIcon className="h-4 w-4" />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {hasTransactions ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-black border-t border-b border-black bg-white">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Reference</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-black hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(tx)
                        setIsOpen(true)
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black bg-gray-100 text-sm font-semibold text-gray-600">
                            {tx.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={tx.avatarUrl} alt={tx.name} className="h-full w-full object-cover" />
                            ) : (
                              tx.name
                                .split(' ')
                                .map((part) => part.charAt(0))
                                .join('')
                                .toUpperCase()
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tx.name}</p>
                            <p className="text-xs text-gray-500">{tx.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{tx.reference}</td>
                      <td className="py-3 px-4">{tx.amount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[tx.status]}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{tx.date}</td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()} // prevent row click
                      >
                        <button
                          onClick={() => alert(`Downloading invoice for ${tx.reference}...`)}
                          className="p-1 hover:text-black text-gray-600"
                          title="Download Invoice"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        No transactions match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
              <p className="text-sm text-gray-500">
                {totalItems === 0
                  ? 'No transactions found'
                  : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} transactions`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 text-sm border border-neutral-300 text-black rounded-lg transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                >
                  ← Prev
                </button>
                <span className="px-3 py-1 text-sm border border-black rounded-lg bg-black text-white">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  className="px-3 py-1 text-sm border border-neutral-300 text-black rounded-lg transition hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <PlusIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">No payments yet</h3>
              <p className="text-sm text-gray-600">
                Send your first payment request to see transactions appear here.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-900"
              >
                <PlusIcon className="h-4 w-4" />
                Create Payment Request
              </button>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99]"
              >
                <BanknotesIcon className="h-4 w-4" />
                Withdraw Funds
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Transaction Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-black">
            {selectedTransaction ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Amount:</span> {selectedTransaction.amount}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[selectedTransaction.status]}`}
                    >
                      {selectedTransaction.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span> {selectedTransaction.date}
                  </p>
                  <p>
                    <span className="font-semibold">Reference:</span> {selectedTransaction.reference}
                  </p>
                  <p>
                    <span className="font-semibold">Description:</span>{' '}
                    {selectedTransaction.description || 'No additional details.'}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-black transition hover:bg-neutral-50 active:scale-[0.99]"
                >
                  Close
                </button>
                  <button
                    onClick={() =>
                      alert(`Downloading invoice for ${selectedTransaction.reference}...`)
                    }
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Invoice
                  </button>
                </div>
              </>
            ) : (
              <p>Loading transaction...</p>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Payment Request Modal */}
      <Dialog open={requestModalOpen} onClose={() => setRequestModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl border border-black bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Send Payment Request</h3>
            <p className="mt-1 text-sm text-gray-500">Let your client know how much to settle and when it’s due.</p>

            <form className="mt-6 space-y-4" onSubmit={handleRequestSubmit}>
              <div>
                <input
                  type="text"
                  placeholder="e.g. Thandi Khumalo"
                  aria-label="Client name"
                  value={requestForm.name}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="client@email.com"
                  aria-label="Client email"
                  value={requestForm.email}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <div className="mt-1 flex rounded-lg border border-black">
                  <span className="inline-flex items-center rounded-l-lg border-r border-black bg-gray-100 px-3 text-sm text-gray-600">R</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    aria-label="Amount"
                    value={requestForm.amount}
                    onChange={(event) => setRequestForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="w-full rounded-r-lg px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <input
                  type="date"
                  aria-label="Payment due date"
                  value={requestForm.dueDate}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="Add context for your client (optional)"
                  aria-label="Notes"
                  value={requestForm.description}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-900"
                >
                  Send payment request
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Withdraw Funds Modal */}
      <Dialog open={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl border border-black bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Withdraw Funds</h3>
            <p className="mt-1 text-sm text-gray-500">Move available balance into your linked bank account.</p>

            <form className="mt-6 space-y-4">
              <div>
                <div className="mt-1 flex rounded-lg border border-black">
                  <span className="inline-flex items-center rounded-l-lg border-r border-black bg-gray-100 px-3 text-sm text-gray-600">R</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    aria-label="Amount"
                    className="w-full rounded-r-lg px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <select
                  aria-label="Destination account"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option>FNB •••• 7890 (Primary)</option>
                  <option>Standard Bank •••• 1123</option>
                  <option>Add new account…</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="e.g. October payout"
                  aria-label="Reference (optional)"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                >
                  Withdraw funds
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <DefineLayout>
      <PaymentsPageContent />
    </DefineLayout>
  );
}
