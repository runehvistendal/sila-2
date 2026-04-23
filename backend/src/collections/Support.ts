import type { CollectionConfig } from 'payload'

export const Support: CollectionConfig = {
  slug: 'support',
  admin: {
    useAsTitle: 'subject',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'category', type: 'select', required: true, options: [
      { label: 'Booking problem', value: 'booking' },
      { label: 'Betaling', value: 'payment' },
      { label: 'Teknisk fejl', value: 'technical' },
      { label: 'Klage over bruger', value: 'user_complaint' },
      { label: 'Kontosletning', value: 'account_deletion' },
      { label: 'Andet', value: 'other' },
    ]},
    { name: 'status', type: 'select', defaultValue: 'open', options: [
      { label: 'Åben', value: 'open' },
      { label: 'Under behandling', value: 'in_progress' },
      { label: 'Løst', value: 'resolved' },
      { label: 'Lukket', value: 'closed' },
    ]},
    { name: 'adminResponse', type: 'textarea' },
  ],
  timestamps: true,
}