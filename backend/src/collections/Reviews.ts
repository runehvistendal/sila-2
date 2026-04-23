import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'reviewer', type: 'relationship', relationTo: 'users', required: true },
    { name: 'reviewType', type: 'select', required: true, options: [
      { label: 'Gæst → Hytte', value: 'guest_to_cabin' },
      { label: 'Gæst → Transport', value: 'guest_to_transport' },
      { label: 'Gæst → Udbyder', value: 'guest_to_provider' },
      { label: 'Udbyder → Gæst', value: 'provider_to_guest' },
    ]},
    { name: 'booking', type: 'relationship', relationTo: 'bookings', required: true },
    { name: 'cabin', type: 'relationship', relationTo: 'cabins' },
    { name: 'transport', type: 'relationship', relationTo: 'transport' },
    { name: 'reviewedUser', type: 'relationship', relationTo: 'users' },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'body', type: 'textarea', required: true },
    { name: 'status', type: 'select', defaultValue: 'approved', options: [
      { label: 'Afventer', value: 'pending' },
      { label: 'Godkendt', value: 'approved' },
      { label: 'Afvist', value: 'rejected' },
    ]},
  ],
  timestamps: true,
}