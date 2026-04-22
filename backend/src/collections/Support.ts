import type { CollectionConfig } from 'payload'

/**
 * SUPPORT COLLECTION
 * Retter Fejl #13: AdminSupport viste kun escalated tickets.
 * Nu vises ALLE tickets med filtreringsmuligheder.
 */
export const Support: CollectionConfig = {
  slug: 'support',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['user', 'subject', 'category', 'status', 'priority', 'createdAt'],
  },
  access: {
    // Brugere ser kun egne tickets, admin ser alle
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Bruger',
      required: true,
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Emne',
      required: true,
      maxLength: 200,
    },
    {
      name: 'category',
      type: 'select',
      label: 'Kategori',
      required: true,
      options: [
        { label: 'Booking problem', value: 'booking' },
        { label: 'Betaling', value: 'payment' },
        { label: 'Teknisk fejl', value: 'technical' },
        { label: 'Klage over bruger', value: 'user_complaint' },
        { label: 'Kontosletning', value: 'account_deletion' },
        { label: 'Andet', value: 'other' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Besked',
      required: true,
      maxLength: 5000,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'open',
      options: [
        { label: 'Åben', value: 'open' },
        { label: 'Under behandling', value: 'in_progress' },
        { label: 'Afventer svar fra bruger', value: 'waiting_user' },
        { label: 'Løst', value: 'resolved' },
        { label: 'Lukket', value: 'closed' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      label: 'Prioritet',
      defaultValue: 'normal',
      options: [
        { label: 'Lav', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'Høj', value: 'high' },
        { label: 'Kritisk', value: 'critical' },
      ],
    },
    {
      name: 'escalated',
      type: 'checkbox',
      label: 'Eskaleret',
      defaultValue: false,
    },
    {
      name: 'relatedBooking',
      type: 'relationship',
      relationTo: 'bookings',
      label: 'Tilknyttet booking',
    },
    {
      name: 'adminResponse',
      type: 'textarea',
      label: 'Svar fra admin',
      maxLength: 5000,
    },
    {
      name: 'resolvedAt',
      type: 'date',
      label: 'Løst dato',
    },
  ],
  timestamps: true,
}
