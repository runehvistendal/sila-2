import type { CollectionConfig } from 'payload'

export const Cabins: CollectionConfig = {
  slug: 'cabins',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText' },
    { name: 'pricePerNight', type: 'number', required: true },
    { name: 'maxGuests', type: 'number', required: true },
    { name: 'location', type: 'text', required: true },
    { name: 'status', type: 'select', defaultValue: 'draft',
      options: [
        { label: 'Kladde', value: 'draft' },
        { label: 'Publiceret', value: 'published' },
      ],
    },
    { name: 'images', type: 'array', fields: [
      { name: 'image', type: 'upload', relationTo: 'media' },
    ]},
    { name: 'owner', type: 'relationship', relationTo: 'users' },
    { name: 'averageRating', type: 'number', defaultValue: 0 },
  ],
  timestamps: true,
}