import type { CollectionConfig } from 'payload'

/**
 * TRANSPORT COLLECTION
 * Transportruter og -services på Sila.gl
 * Priser kommer fra databasen — aldrig hardkodet i frontend
 */
export const Transport: CollectionConfig = {
  slug: 'transport',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'type', 'fromLocation', 'toLocation', 'price', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'provider' || user?.role === 'both' || user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { owner: { equals: user?.id } }
    },
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { owner: { equals: user?.id } }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Titel/Rutenavn',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Beskrivelse',
      localized: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      label: 'Ejer (udbyder)',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'draft',
      options: [
        { label: 'Kladde', value: 'draft' },
        { label: 'Publiceret', value: 'published' },
        { label: 'Deaktiveret', value: 'inactive' },
      ],
    },

    // --- TRANSPORT TYPE ---
    {
      name: 'type',
      type: 'select',
      label: 'Transporttype',
      required: true,
      options: [
        { label: 'Båd', value: 'boat' },
        { label: 'Helikopter', value: 'helicopter' },
        { label: 'Snescooter', value: 'snowmobile' },
        { label: 'Hundevogn', value: 'dogsled' },
        { label: 'Fly', value: 'plane' },
        { label: 'ATV/Terrænkøretøj', value: 'atv' },
        { label: 'Til fods/Guide', value: 'hiking' },
        { label: 'Andet', value: 'other' },
      ],
    },

    // --- RUTE ---
    {
      name: 'fromLocation',
      type: 'text',
      label: 'Fra lokation',
      required: true,
    },
    {
      name: 'toLocation',
      type: 'text',
      label: 'Til lokation',
      required: true,
    },
    {
      name: 'isRoundTrip',
      type: 'checkbox',
      label: 'Tur-retur mulighed',
      defaultValue: true,
    },
    {
      name: 'durationHours',
      type: 'number',
      label: 'Varighed (timer)',
      min: 0,
    },

    // --- PRIS (fra database — aldrig hardkodet) ---
    {
      name: 'price',
      type: 'number',
      label: 'Pris (DKK)',
      required: true,
      min: 0,
      admin: {
        description: 'Pris per person eller per tur — se pristype',
      },
    },
    {
      name: 'priceType',
      type: 'select',
      label: 'Pristype',
      defaultValue: 'per_trip',
      options: [
        { label: 'Per tur (fast pris)', value: 'per_trip' },
        { label: 'Per person', value: 'per_person' },
        { label: 'Per time', value: 'per_hour' },
        { label: 'Per dag', value: 'per_day' },
      ],
    },
    {
      name: 'maxPassengers',
      type: 'number',
      label: 'Maks. passagerer',
      defaultValue: 4,
      min: 1,
    },

    // --- BILLEDER ---
    {
      name: 'images',
      type: 'array',
      label: 'Billeder',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // --- TILGÆNGELIGHED ---
    {
      name: 'availableDays',
      type: 'select',
      label: 'Tilgængelige dage',
      hasMany: true,
      options: [
        { label: 'Mandag', value: 'monday' },
        { label: 'Tirsdag', value: 'tuesday' },
        { label: 'Onsdag', value: 'wednesday' },
        { label: 'Torsdag', value: 'thursday' },
        { label: 'Fredag', value: 'friday' },
        { label: 'Lørdag', value: 'saturday' },
        { label: 'Søndag', value: 'sunday' },
      ],
    },
    {
      name: 'seasonStart',
      type: 'date',
      label: 'Sæsonstart',
    },
    {
      name: 'seasonEnd',
      type: 'date',
      label: 'Sæsonslut',
    },

    // --- STATS ---
    {
      name: 'averageRating',
      type: 'number',
      label: 'Gennemsnitlig vurdering',
      defaultValue: 0,
      access: { update: () => false },
    },
    {
      name: 'totalReviews',
      type: 'number',
      label: 'Antal anmeldelser',
      defaultValue: 0,
      access: { update: () => false },
    },
  ],
  timestamps: true,
}
