import type { CollectionConfig } from 'payload'

/**
 * REVIEWS COLLECTION
 * 
 * Understøtter:
 * - Gæst anmelder listing (hytte/transport)
 * - Gæst anmelder udbyder
 * - Udbyder anmelder gæst
 * 
 * Regler:
 * - Kun brugere med afsluttet booking kan anmelde
 * - Én anmeldelse per booking per part
 * - TrustScore opdateres automatisk
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['reviewer', 'reviewType', 'rating', 'status', 'createdAt'],
  },
  access: {
    // Alle kan læse godkendte reviews
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { status: { equals: 'approved' } }
    },
    // Kun indloggede brugere kan oprette
    create: ({ req: { user } }) => !!user,
    // Kun admin kan redigere reviews
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // --- PARTER ---
    {
      name: 'reviewer',
      type: 'relationship',
      relationTo: 'users',
      label: 'Anmelder',
      required: true,
    },
    {
      name: 'reviewedUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Anmeldt bruger',
      admin: {
        description: 'Udfyldes ved bruger-til-bruger anmeldelse',
      },
    },

    // --- HVAD ANMELDES? ---
    {
      name: 'reviewType',
      type: 'select',
      label: 'Anmeldelsestype',
      required: true,
      options: [
        { label: 'Gæst → Hytte', value: 'guest_to_cabin' },
        { label: 'Gæst → Transport', value: 'guest_to_transport' },
        { label: 'Gæst → Udbyder', value: 'guest_to_provider' },
        { label: 'Udbyder → Gæst', value: 'provider_to_guest' },
      ],
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      label: 'Tilknyttet booking',
      required: true,
      admin: {
        description: 'Booking der anmeldes for',
      },
    },
    {
      name: 'cabin',
      type: 'relationship',
      relationTo: 'cabins',
      label: 'Hytte',
      admin: {
        condition: (data) => data.reviewType === 'guest_to_cabin',
      },
    },
    {
      name: 'transport',
      type: 'relationship',
      relationTo: 'transport',
      label: 'Transport',
      admin: {
        condition: (data) => data.reviewType === 'guest_to_transport',
      },
    },

    // --- VURDERING ---
    {
      name: 'rating',
      type: 'number',
      label: 'Vurdering (1-5)',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'categories',
      type: 'group',
      label: 'Kategorivurderinger',
      admin: {
        condition: (data) =>
          data.reviewType === 'guest_to_cabin' ||
          data.reviewType === 'guest_to_transport',
      },
      fields: [
        { name: 'cleanliness', type: 'number', label: 'Renlighed (1-5)', min: 1, max: 5 },
        { name: 'communication', type: 'number', label: 'Kommunikation (1-5)', min: 1, max: 5 },
        { name: 'accuracy', type: 'number', label: 'Nøjagtighed (1-5)', min: 1, max: 5 },
        { name: 'location', type: 'number', label: 'Beliggenhed (1-5)', min: 1, max: 5 },
        { name: 'value', type: 'number', label: 'Værdi for pengene (1-5)', min: 1, max: 5 },
      ],
    },

    // --- INDHOLD ---
    {
      name: 'title',
      type: 'text',
      label: 'Overskrift',
      maxLength: 100,
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Anmeldelsestekst',
      required: true,
      maxLength: 2000,
    },

    // --- MODERERING ---
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'approved',
      options: [
        { label: 'Afventer moderering', value: 'pending' },
        { label: 'Godkendt', value: 'approved' },
        { label: 'Afvist', value: 'rejected' },
        { label: 'Flagget', value: 'flagged' },
      ],
    },
    {
      name: 'providerResponse',
      type: 'textarea',
      label: 'Svar fra udbyder',
      maxLength: 1000,
    },
  ],
  hooks: {
    afterChange: [
      // Opdater gennemsnitlig rating på listing og TrustScore
      async ({ doc, req }) => {
        try {
          const payload = req.payload

          // Opdater listing rating
          if (doc.cabin && doc.reviewType === 'guest_to_cabin') {
            const allReviews = await payload.find({
              collection: 'reviews',
              where: {
                cabin: { equals: doc.cabin },
                status: { equals: 'approved' },
              },
              limit: 1000,
            })
            const avg =
              allReviews.docs.reduce((sum: number, r: any) => sum + r.rating, 0) /
              allReviews.totalDocs
            await payload.update({
              collection: 'cabins',
              id: doc.cabin,
              data: {
                averageRating: Math.round(avg * 10) / 10,
                totalReviews: allReviews.totalDocs,
              },
            })
          }

          // Opdater TrustScore for anmeldt bruger
          if (doc.reviewedUser) {
            const userReviews = await payload.find({
              collection: 'reviews',
              where: {
                reviewedUser: { equals: doc.reviewedUser },
                status: { equals: 'approved' },
              },
              limit: 1000,
            })
            const avgRating =
              userReviews.docs.reduce((sum: number, r: any) => sum + r.rating, 0) /
              Math.max(userReviews.totalDocs, 1)

            // TrustScore: basis 50 + op til 50 baseret på rating
            const trustScore = Math.min(100, Math.round(50 + (avgRating - 3) * 12.5))

            await payload.update({
              collection: 'users',
              id: doc.reviewedUser,
              data: { trustScore },
            })
          }
        } catch (err) {
          console.error('Fejl ved opdatering af rating/TrustScore:', err)
        }
      },
    ],
  },
  timestamps: true,
}
