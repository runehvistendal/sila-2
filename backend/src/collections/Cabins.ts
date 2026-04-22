import type { CollectionConfig } from 'payload'

/**
 * CABINS COLLECTION
 * Hytter og oplevelser på Sila.gl
 * Kun verificerede udbydere kan oprette listings.
 */
export const Cabins: CollectionConfig = {
  slug: 'cabins',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'location', 'pricePerNight', 'status', 'createdAt'],
  },
  access: {
    // Alle kan læse publicerede cabins
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { status: { equals: 'published' } }
    },
    // Kun udbydere kan oprette
    create: ({ req: { user } }) => {
      return user?.role === 'provider' || user?.role === 'both' || user?.role === 'admin'
    },
    // Kun ejeren eller admin kan redigere
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { owner: { equals: user?.id } }
    },
    // Kun ejeren eller admin kan slette
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { owner: { equals: user?.id } }
    },
  },
  fields: [
    // --- GRUNDLÆGGENDE ---
    {
      name: 'title',
      type: 'text',
      label: 'Titel',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Beskrivelse',
      required: true,
      localized: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      label: 'Ejer (udbyder)',
      required: true,
      // Sættes automatisk til den indloggede bruger
      hooks: {
        beforeChange: [
          ({ req, data }) => {
            if (req.user && !data.owner) {
              return req.user.id
            }
            return data
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Kladde', value: 'draft' },
        { label: 'Publiceret', value: 'published' },
        { label: 'Deaktiveret', value: 'inactive' },
        { label: 'Under gennemgang', value: 'under_review' },
      ],
    },

    // --- LOKATION ---
    {
      name: 'location',
      type: 'group',
      label: 'Lokation',
      fields: [
        {
          name: 'city',
          type: 'text',
          label: 'By',
          required: true,
        },
        {
          name: 'address',
          type: 'text',
          label: 'Adresse (valgfri)',
        },
        {
          name: 'lat',
          type: 'number',
          label: 'Breddegrad',
        },
        {
          name: 'lng',
          type: 'number',
          label: 'Længdegrad',
        },
        {
          name: 'region',
          type: 'select',
          label: 'Region',
          options: [
            { label: 'Nuuk', value: 'nuuk' },
            { label: 'Ilulissat', value: 'ilulissat' },
            { label: 'Sisimiut', value: 'sisimiut' },
            { label: 'Disko Bay', value: 'disko_bay' },
            { label: 'Kangerlussuaq', value: 'kangerlussuaq' },
            { label: 'Tasiilaq', value: 'tasiilaq' },
            { label: 'Upernavik', value: 'upernavik' },
            { label: 'Qaqortoq', value: 'qaqortoq' },
            { label: 'Narsaq', value: 'narsaq' },
            { label: 'Nanortalik', value: 'nanortalik' },
            { label: 'Anden lokation', value: 'other' },
          ],
        },
      ],
    },

    // --- PRISER ---
    {
      name: 'pricePerNight',
      type: 'number',
      label: 'Pris per nat (DKK)',
      required: true,
      min: 0,
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Valuta',
      defaultValue: 'DKK',
      options: [
        { label: 'DKK', value: 'DKK' },
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
      ],
    },
    {
      name: 'cleaningFee',
      type: 'number',
      label: 'Rengøringsgebyr (DKK)',
      defaultValue: 0,
    },

    // --- KAPACITET ---
    {
      name: 'maxGuests',
      type: 'number',
      label: 'Maks. gæster',
      required: true,
      min: 1,
      defaultValue: 2,
    },
    {
      name: 'bedrooms',
      type: 'number',
      label: 'Soveværelser',
      defaultValue: 1,
      min: 0,
    },
    {
      name: 'beds',
      type: 'number',
      label: 'Senge',
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'bathrooms',
      type: 'number',
      label: 'Badeværelser',
      defaultValue: 1,
      min: 0,
    },

    // --- FACILITETER ---
    {
      name: 'amenities',
      type: 'select',
      label: 'Faciliteter',
      hasMany: true,
      options: [
        { label: 'WiFi', value: 'wifi' },
        { label: 'Køkken', value: 'kitchen' },
        { label: 'Parkering', value: 'parking' },
        { label: 'Opvarmning', value: 'heating' },
        { label: 'Brændeovn', value: 'fireplace' },
        { label: 'Udendørs område', value: 'outdoor_area' },
        { label: 'Sauna', value: 'sauna' },
        { label: 'Bådudlejning', value: 'boat_rental' },
        { label: 'Fiskegrej', value: 'fishing_gear' },
        { label: 'Snescooter', value: 'snowmobile' },
        { label: 'Kayak', value: 'kayak' },
        { label: 'Transport til/fra', value: 'transport_included' },
        { label: 'Morgenmad inkluderet', value: 'breakfast_included' },
        { label: 'Hund tilladt', value: 'pets_allowed' },
        { label: 'Tilgængeligt for handicappede', value: 'accessible' },
      ],
    },

    // --- BILLEDER ---
    {
      name: 'images',
      type: 'array',
      label: 'Billeder',
      minRows: 1,
      maxRows: 20,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Billedtekst',
        },
      ],
    },

    // --- TILGÆNGELIGHED ---
    {
      name: 'unavailableDates',
      type: 'array',
      label: 'Utilgængelige datoer',
      admin: {
        description: 'Datoer der er blokeret — opdateres automatisk ved bookinger',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'reason',
          type: 'select',
          options: [
            { label: 'Booket', value: 'booked' },
            { label: 'Blokeret af ejer', value: 'blocked' },
          ],
          defaultValue: 'booked',
        },
      ],
    },
    {
      name: 'minimumStay',
      type: 'number',
      label: 'Minimum antal nætter',
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'maximumStay',
      type: 'number',
      label: 'Maksimum antal nætter',
      defaultValue: 30,
    },

    // --- TRANSPORT ---
    {
      name: 'hasTransportOption',
      type: 'checkbox',
      label: 'Transport tilbydes',
      defaultValue: false,
    },
    {
      name: 'transportDescription',
      type: 'textarea',
      label: 'Transportbeskrivelse',
      admin: {
        condition: (data) => data.hasTransportOption,
      },
    },

    // --- TYPE ---
    {
      name: 'type',
      type: 'select',
      label: 'Type',
      required: true,
      defaultValue: 'cabin',
      options: [
        { label: 'Hytte', value: 'cabin' },
        { label: 'Hus', value: 'house' },
        { label: 'Lejlighed', value: 'apartment' },
        { label: 'Telt/Camp', value: 'tent' },
        { label: 'Båd', value: 'boat' },
        { label: 'Unik overnatning', value: 'unique' },
      ],
    },

    // --- STATS (beregnes automatisk) ---
    {
      name: 'averageRating',
      type: 'number',
      label: 'Gennemsnitlig vurdering',
      defaultValue: 0,
      access: {
        update: () => false, // Kun systemet opdaterer dette
      },
    },
    {
      name: 'totalReviews',
      type: 'number',
      label: 'Antal anmeldelser',
      defaultValue: 0,
      access: {
        update: () => false,
      },
    },
    {
      name: 'totalBookings',
      type: 'number',
      label: 'Samlet antal bookinger',
      defaultValue: 0,
      access: {
        update: () => false,
      },
    },
  ],
  timestamps: true,
}
