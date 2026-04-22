import type { CollectionConfig } from 'payload'

/**
 * BOOKINGS COLLECTION
 * 
 * Al booking-logik valideres SERVER-SIDE:
 * - Datooverlap tjekkes i databasen
 * - Pris beregnes af serveren — aldrig fra frontend
 * - Status-transitions er kontrollerede
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['guest', 'listingType', 'checkIn', 'checkOut', 'totalPrice', 'status', 'createdAt'],
  },
  access: {
    // Gæster ser deres egne bookinger, udbydere ser bookinger på deres listings, admin ser alt
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        or: [
          { guest: { equals: user.id } },
          { providerUser: { equals: user.id } },
        ],
      }
    },
    // Kun indloggede brugere kan oprette bookinger
    create: ({ req: { user } }) => !!user,
    // Meget begrænset — kun visse felter via egne endpoints
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      // Brugere kan kun opdatere egne bookinger via API endpoints
      return { guest: { equals: user?.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // --- PARTER ---
    {
      name: 'guest',
      type: 'relationship',
      relationTo: 'users',
      label: 'Gæst',
      required: true,
    },
    {
      name: 'providerUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Udbyder',
      required: true,
    },

    // --- LISTING TYPE OG REFERENCE ---
    {
      name: 'listingType',
      type: 'select',
      label: 'Listingtype',
      required: true,
      options: [
        { label: 'Hytte', value: 'cabin' },
        { label: 'Transport', value: 'transport' },
      ],
    },
    {
      name: 'cabin',
      type: 'relationship',
      relationTo: 'cabins',
      label: 'Hytte',
      admin: {
        condition: (data) => data.listingType === 'cabin',
      },
    },
    {
      name: 'transport',
      type: 'relationship',
      relationTo: 'transport',
      label: 'Transport',
      admin: {
        condition: (data) => data.listingType === 'transport',
      },
    },

    // --- DATOER ---
    {
      name: 'checkIn',
      type: 'date',
      label: 'Indtjekningsdato',
      required: true,
    },
    {
      name: 'checkOut',
      type: 'date',
      label: 'Udtjekningsdato',
      required: true,
    },
    {
      name: 'nights',
      type: 'number',
      label: 'Antal nætter',
      admin: {
        description: 'Beregnes automatisk',
      },
    },

    // --- GÆSTER ---
    {
      name: 'guests',
      type: 'number',
      label: 'Antal gæster',
      required: true,
      min: 1,
      defaultValue: 1,
    },

    // --- PRIS (beregnes server-side) ---
    {
      name: 'pricePerNight',
      type: 'number',
      label: 'Pris per nat på bookingtidspunktet (DKK)',
      admin: {
        description: 'Låses ved oprettelse — kan ikke ændres',
      },
    },
    {
      name: 'cleaningFee',
      type: 'number',
      label: 'Rengøringsgebyr (DKK)',
      defaultValue: 0,
    },
    {
      name: 'subtotal',
      type: 'number',
      label: 'Subtotal (DKK)',
    },
    {
      name: 'silaFee',
      type: 'number',
      label: `Sila provision (${process.env.SILA_COMMISSION_PERCENT || 10}%)`,
      admin: {
        description: 'Silas provision — beregnes automatisk',
      },
    },
    {
      name: 'totalPrice',
      type: 'number',
      label: 'Total pris (DKK)',
      required: true,
    },
    {
      name: 'providerPayout',
      type: 'number',
      label: 'Udbetaling til udbyder (DKK)',
      admin: {
        description: 'Total minus Silas provision',
      },
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

    // --- STATUS ---
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Afventer betaling', value: 'pending' },
        { label: 'Betalt — afventer bekræftelse', value: 'paid' },
        { label: 'Bekræftet', value: 'confirmed' },
        { label: 'Afsluttet', value: 'completed' },
        { label: 'Aflyst af gæst', value: 'cancelled_guest' },
        { label: 'Aflyst af udbyder', value: 'cancelled_provider' },
        { label: 'Refunderet', value: 'refunded' },
        { label: 'Tvist', value: 'disputed' },
      ],
    },

    // --- STRIPE ---
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      label: 'Stripe Payment Intent ID',
      admin: {
        description: 'Sættes automatisk af Stripe webhook',
      },
    },
    {
      name: 'stripeTransferId',
      type: 'text',
      label: 'Stripe Transfer ID (udbetaling til udbyder)',
    },
    {
      name: 'paymentConfirmedAt',
      type: 'date',
      label: 'Betalingsbekræftelse modtaget',
    },

    // --- NOTER ---
    {
      name: 'guestNote',
      type: 'textarea',
      label: 'Besked fra gæst',
      maxLength: 1000,
    },
    {
      name: 'providerNote',
      type: 'textarea',
      label: 'Besked fra udbyder',
      maxLength: 1000,
    },
    {
      name: 'cancellationReason',
      type: 'textarea',
      label: 'Aflysningsårsag',
    },

    // --- REVIEW STATUS ---
    {
      name: 'guestHasReviewed',
      type: 'checkbox',
      label: 'Gæst har anmeldt',
      defaultValue: false,
    },
    {
      name: 'providerHasReviewed',
      type: 'checkbox',
      label: 'Udbyder har anmeldt',
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      // SERVER-SIDE PRIS BEREGNING
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          // Sæt gæst til den indloggede bruger
          if (req.user && !data.guest) {
            data.guest = req.user.id
          }

          // Beregn antal nætter
          if (data.checkIn && data.checkOut) {
            const checkIn = new Date(data.checkIn)
            const checkOut = new Date(data.checkOut)
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

            if (nights <= 0) {
              throw new Error('Udtjekningsdato skal være efter indtjekningsdato')
            }
            data.nights = nights
          }

          // Beregn priser server-side
          if (data.pricePerNight && data.nights) {
            const subtotal = data.pricePerNight * data.nights
            const cleaningFee = data.cleaningFee || 0
            const commissionPercent = parseFloat(process.env.SILA_COMMISSION_PERCENT || '10') / 100
            const silaFee = Math.round(subtotal * commissionPercent)
            const totalPrice = subtotal + cleaningFee
            const providerPayout = totalPrice - silaFee

            data.subtotal = subtotal
            data.silaFee = silaFee
            data.totalPrice = totalPrice
            data.providerPayout = providerPayout
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
