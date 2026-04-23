import type { CollectionConfig } from 'payload'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'guest', type: 'relationship', relationTo: 'users', required: true },
    { name: 'listingType', type: 'select', required: true, options: [
      { label: 'Hytte', value: 'cabin' },
      { label: 'Transport', value: 'transport' },
    ]},
    { name: 'cabin', type: 'relationship', relationTo: 'cabins' },
    { name: 'transport', type: 'relationship', relationTo: 'transport' },
    { name: 'checkIn', type: 'date', required: true },
    { name: 'checkOut', type: 'date', required: true },
    { name: 'guests', type: 'number', required: true, defaultValue: 1 },
    { name: 'totalPrice', type: 'number', required: true },
    { name: 'status', type: 'select', defaultValue: 'pending', options: [
      { label: 'Afventer', value: 'pending' },
      { label: 'Bekræftet', value: 'confirmed' },
      { label: 'Afsluttet', value: 'completed' },
      { label: 'Aflyst', value: 'cancelled' },
    ]},
    { name: 'stripePaymentIntentId', type: 'text' },
    { name: 'guestNote', type: 'textarea' },
  ],
  timestamps: true,
}