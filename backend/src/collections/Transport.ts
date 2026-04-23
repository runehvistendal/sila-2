import type { CollectionConfig } from 'payload'

export const Transport: CollectionConfig = {
  slug: 'transport',
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
    { name: 'type', type: 'select', options: [
      { label: 'Båd', value: 'boat' },
      { label: 'Helikopter', value: 'helicopter' },
      { label: 'Snescooter', value: 'snowmobile' },
      { label: 'Hundevogn', value: 'dogsled' },
      { label: 'Andet', value: 'other' },
    ]},
    { name: 'price', type: 'number', required: true },
    { name: 'fromLocation', type: 'text', required: true },
    { name: 'toLocation', type: 'text', required: true },
    { name: 'maxPassengers', type: 'number', defaultValue: 4 },
    { name: 'owner', type: 'relationship', relationTo: 'users' },
    { name: 'status', type: 'select', defaultValue: 'draft', options: [
      { label: 'Kladde', value: 'draft' },
      { label: 'Publiceret', value: 'published' },
    ]},
  ],
  timestamps: true,
}