'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DefineLayout from '../dashboard/layout';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  avatarUrl?: string;
  bookingsCount: number;
};

const seedContacts: Contact[] = [
  {
    id: '1',
    name: 'Thandi Khumalo',
    email: 'thandi@lumalens.com',
    phone: '+27 71 555 0098',
    company: 'Luma Lens Studio',
    avatarUrl: 'https://i.pravatar.cc/160?img=33',
    bookingsCount: 6,
  },
  {
    id: '2',
    name: 'Sipho Nkosi',
    email: 'sipho@highlightfilms.co.za',
    phone: '+27 82 110 7771',
    company: 'Highlight Films',
    avatarUrl: 'https://i.pravatar.cc/160?img=12',
    bookingsCount: 4,
  },
  {
    id: '3',
    name: 'Mandla Mdluli',
    email: 'mandla@mdlulicorp.africa',
    phone: '+27 63 220 4410',
    company: 'Mdluli Corp',
    avatarUrl: 'https://i.pravatar.cc/160?img=45',
    bookingsCount: 9,
  },
  {
    id: '4',
    name: 'Laura Daniels',
    email: 'laura@danielsandco.com',
    phone: '+44 20 5555 9821',
    company: 'Daniels & Co.',
    avatarUrl: 'https://i.pravatar.cc/160?img=28',
    bookingsCount: 5,
  },
];

type ModalMode = 'add' | 'edit' | null;

function ClientsPageContent() {
  const [contacts, setContacts] = useState<Contact[]>(seedContacts);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<Contact>({ id: '', name: '', email: '', phone: '', company: '', avatarUrl: '', bookingsCount: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [page, setPage] = useState(1);

  const nextId = useRef(seedContacts.length + 1);

  const initialsFor = useMemo(
    () =>
      (name: string) =>
        name
          .split(' ')
          .filter(Boolean)
          .map((part) => part.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'C',
    []
  );

  const makeAvatar = (seed: string) => `https://i.pravatar.cc/160?u=${encodeURIComponent(seed)}`;

  const openAddModal = () => {
    setModalMode('add');
    setActiveContact(null);
    setForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      company: '',
      avatarUrl: makeAvatar(`new-${Date.now()}-${Math.random()}`),
      bookingsCount: 0,
    });
  };

  const openEditModal = (contact: Contact) => {
    setModalMode('edit');
    setActiveContact(contact);
    setForm({ ...contact });
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveContact(null);
    setForm({ id: '', name: '', email: '', phone: '', company: '', avatarUrl: '', bookingsCount: 0 });
  };

  const handleFormChange = (field: keyof Contact, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      return;
    }

    const trimmedAvatar = form.avatarUrl?.trim();
    const fallbackAvatar = `https://i.pravatar.cc/160?u=${encodeURIComponent(form.email || form.name || `${nextId.current}`)}`;
    const resolvedAvatar = trimmedAvatar || fallbackAvatar;

    if (modalMode === 'add') {
      const newContact: Contact = {
        id: `${nextId.current++}`,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company?.trim() || undefined,
        avatarUrl: resolvedAvatar,
        bookingsCount: form.bookingsCount ?? 0,
      };
      setContacts((prev) => [...prev, newContact]);
      setPage(1);
    } else if (modalMode === 'edit' && activeContact) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === activeContact.id
            ? {
                ...contact,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                company: form.company?.trim() || undefined,
                avatarUrl: resolvedAvatar,
                bookingsCount: form.bookingsCount ?? contact.bookingsCount,
              }
            : contact
        )
      );
    }

    closeModal();
  };

  const confirmDelete = (contact: Contact) => {
    setDeleteTarget(contact);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setContacts((prev) => prev.filter((contact) => contact.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.phone ?? '', contact.company ?? '', String(contact.bookingsCount)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [contacts, search]);

  const pageSize = 6;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const safePage = Math.min(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems);
  const paginated = filtered.slice(startIndex, startIndex + pageSize);
  const previewAvatar =
    (form.avatarUrl ?? '').trim() ||
    (modalMode === 'edit' ? activeContact?.avatarUrl ?? '' : makeAvatar(`new-${nextId.current}`));

  const handleChangeAvatar = () => {
    setForm((prev) => ({
      ...prev,
      avatarUrl: makeAvatar(`${prev.email || prev.name || 'client'}-${Date.now()}-${Math.random()}`),
    }));
  };

  return (
    <div className="bg-white min-h-screen text-black">
      <header className="border-b border-black px-6 py-6 sm:px-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-500">Keep your client directory up to date and ready for new projects.</p>
      </header>

      <section className="p-6 sm:p-10">
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <p className="text-xs text-gray-500">
              {contacts.length} {contacts.length === 1 ? 'client saved' : 'clients saved'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone or company"
              className="w-full rounded-full border border-black px-4 py-1.5 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:w-72"
            />
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-900"
            >
              Add contact
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-black border-t border-b border-black bg-white">
              <tr>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Company</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-black hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setDetailContact(contact)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black bg-gray-100 text-sm font-semibold text-gray-600">
                        {contact.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={contact.avatarUrl} alt={contact.name} className="h-full w-full object-cover" />
                        ) : (
                          initialsFor(contact.name)
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {contact.bookingsCount}
                            {contact.bookingsCount === 1 ? ' booking' : ' bookings'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{contact.email}</td>
                  <td className="py-3 px-4">{contact.phone}</td>
                  <td className="py-3 px-4">{contact.company || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClickCapture={(event) => {
                          event.stopPropagation();
                          openEditModal(contact);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-black px-3 py-1 text-xs font-medium text-black hover:bg-black hover:text-white"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClickCapture={(event) => {
                          event.stopPropagation();
                          confirmDelete(contact);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    You haven’t added any clients yet. Start by adding your first contact.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {totalItems === 0
              ? 'No clients match this search'
              : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} clients`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1 text-sm border border-black rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-sm border border-black rounded-lg bg-black text-white">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1 text-sm border border-black rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      <Dialog open={modalMode !== null} onClose={closeModal} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl border border-black bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {modalMode === 'edit' ? 'Edit client' : 'Add client'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {modalMode === 'edit' ? 'Update the client’s latest details.' : 'Add a new client to your directory.'}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-3">
                <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-black bg-gray-100 text-sm font-semibold text-gray-700">
                  {previewAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewAvatar} alt={form.name || 'Client avatar'} className="h-full w-full object-cover" />
                  ) : (
                    initialsFor(form.name || activeContact?.name || '')
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleChangeAvatar}
                  className="rounded-full border border-black px-4 py-1.5 text-xs font-medium text-black hover:bg-black hover:text-white"
                >
                  Change image
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleFormChange('name', event.target.value)}
                  required
                  placeholder="e.g. Thandi Khumalo"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFormChange('email', event.target.value)}
                  required
                  placeholder="client@email.com"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => handleFormChange('phone', event.target.value)}
                  placeholder="e.g. +27 71 555 0098"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(event) => handleFormChange('company', event.target.value)}
                  placeholder="Company or organisation"
                  className="mt-1 block w-full rounded-lg border border-black px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-black px-4 py-2 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-900"
                >
                  {modalMode === 'edit' ? 'Save changes' : 'Add contact'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl border border-black bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Remove client?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will detach {deleteTarget?.name} from your directory. You can always add them again later.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-black px-4 py-2 text-xs font-medium text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border border-black px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={detailContact !== null} onClose={() => setDetailContact(null)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl border border-black bg-white p-6 shadow-xl">
            {detailContact && (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-black bg-gray-100 text-sm font-semibold text-gray-700">
                    {detailContact.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detailContact.avatarUrl} alt={detailContact.name} className="h-full w-full object-cover" />
                    ) : (
                      initialsFor(detailContact.name)
                    )}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{detailContact.name}</h3>
                    <p className="text-xs text-gray-500">{detailContact.email}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p>{detailContact.email}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p>{detailContact.phone || 'Not captured'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Company</p>
                  <p>{detailContact.company || '—'}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDetailContact(null)}
                    className="rounded-full border border-black px-4 py-2 text-xs font-medium text-black hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <DefineLayout>
      <ClientsPageContent />
    </DefineLayout>
  );
}
