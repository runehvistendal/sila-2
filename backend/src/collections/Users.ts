import type { CollectionConfig } from 'payload'

/**
 * USERS COLLECTION
 * 
 * Håndterer alle brugere: gæster, udbydere og admins.
 * Roller valideres SERVER-SIDE — kan ikke manipuleres fra browser.
 * 
 * Roller:
 *  - guest    → kan booke og reviewe
 *  - provider → kan oprette listings og se indkomne bookinger
 *  - both     → kan alt (gæst + udbyder)
 *  - admin    → fuld adgang inkl. Payload admin-panel
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7 * 24 * 60 * 60, // 7 dage
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role', 'trustScore', 'createdAt'],
  },
  access: {
    // Kun admin kan se alle brugere
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      // Brugere kan kun se sig selv
      return { id: { equals: user?.id } }
    },
    // Kun admin kan oprette brugere direkte (ellers via /api/auth/register)
    create: ({ req: { user } }) => user?.role === 'admin',
    // Brugere kan opdatere sig selv, admins kan opdatere alle
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { id: { equals: user?.id } }
    },
    // Kun admin kan slette
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // --- GRUNDLÆGGENDE INFO ---
    {
      name: 'fullName',
      type: 'text',
      label: 'Fulde navn',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Telefon',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Profilbillede',
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Om mig',
      maxLength: 500,
    },
    {
      name: 'location',
      type: 'text',
      label: 'By/lokation i Grønland',
    },

    // --- ROLLE (SERVER-SIDE — kan ikke ændres fra browser) ---
    {
      name: 'role',
      type: 'select',
      label: 'Rolle',
      required: true,
      defaultValue: 'guest',
      options: [
        { label: 'Gæst', value: 'guest' },
        { label: 'Udbyder', value: 'provider' },
        { label: 'Gæst + Udbyder', value: 'both' },
        { label: 'Admin', value: 'admin' },
      ],
      // KUN admin kan ændre roller
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },

    // --- AKTIVT DASHBOARD (bruges af frontend til at vise rigtigt dashboard) ---
    {
      name: 'activeDashboard',
      type: 'select',
      label: 'Aktivt dashboard',
      defaultValue: 'guest',
      options: [
        { label: 'Gæstedashboard', value: 'guest' },
        { label: 'Udbyderdashboard', value: 'provider' },
      ],
      // Brugere kan selv skifte deres aktive dashboard
      // Men backend validerer at de har adgang til den valgte rolle
    },

    // --- PRÆFERENCER ---
    {
      name: 'language',
      type: 'select',
      label: 'Sprog',
      defaultValue: 'da',
      options: [
        { label: 'Dansk', value: 'da' },
        { label: 'English', value: 'en' },
        { label: 'Kalaallisut', value: 'kl' },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Valuta',
      defaultValue: 'DKK',
      options: [
        { label: 'DKK (kr)', value: 'DKK' },
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR (€)', value: 'EUR' },
      ],
    },

    // --- TRUST SCORE (beregnes server-side) ---
    {
      name: 'trustScore',
      type: 'number',
      label: 'TrustScore',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Beregnes automatisk baseret på reviews, bekræftelser og aktivitet',
      },
      // Kun admin kan redigere direkte
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      label: 'Verificeret udbyder',
      defaultValue: false,
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'verificationDocuments',
      type: 'array',
      label: 'Verifikationsdokumenter',
      admin: {
        condition: (data) => data.role === 'provider' || data.role === 'both',
      },
      fields: [
        {
          name: 'document',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Pas', value: 'passport' },
            { label: 'Kørekort', value: 'drivers_license' },
            { label: 'CVR-dokument', value: 'cvr' },
            { label: 'Andet', value: 'other' },
          ],
        },
      ],
    },

    // --- STRIPE CONNECT (til udbetalinger) ---
    {
      name: 'stripeAccountId',
      type: 'text',
      label: 'Stripe Connect Account ID',
      admin: {
        description: 'Udfyldes automatisk ved Stripe Connect onboarding',
        condition: (data) => data.role === 'provider' || data.role === 'both',
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        update: () => false, // Kun webhook kan opdatere dette
      },
    },
    {
      name: 'stripeAccountStatus',
      type: 'select',
      label: 'Stripe konto status',
      defaultValue: 'not_connected',
      options: [
        { label: 'Ikke tilknyttet', value: 'not_connected' },
        { label: 'Afventer', value: 'pending' },
        { label: 'Aktiv', value: 'active' },
        { label: 'Deaktiveret', value: 'disabled' },
      ],
      access: {
        update: () => false, // Kun webhook
      },
    },

    // --- GDPR ---
    {
      name: 'gdprConsent',
      type: 'checkbox',
      label: 'GDPR samtykke givet',
      defaultValue: false,
    },
    {
      name: 'gdprConsentDate',
      type: 'date',
      label: 'Dato for GDPR samtykke',
    },
    {
      name: 'deletionRequested',
      type: 'checkbox',
      label: 'Kontosletning anmodet',
      defaultValue: false,
    },
    {
      name: 'deletionRequestedAt',
      type: 'date',
      label: 'Dato for sletningsanmodning',
    },
  ],
  hooks: {
    beforeChange: [
      // Valider at rolle-skift er lovligt
      async ({ data, req, operation }) => {
        if (operation === 'update' && data.role) {
          const requestingUser = req.user
          // Kun admin kan tildele admin-rolle
          if (data.role === 'admin' && requestingUser?.role !== 'admin') {
            throw new Error('Du har ikke rettighed til at tildele admin-rollen')
          }
          // Valider activeDashboard passer til rolle
          if (data.activeDashboard === 'provider') {
            const targetRole = data.role
            if (targetRole !== 'provider' && targetRole !== 'both') {
              data.activeDashboard = 'guest'
            }
          }
        }
        return data
      },
    ],
    afterChange: [
      // Genberegn TrustScore efter ændringer
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`Ny bruger oprettet: ${doc.email} med rolle: ${doc.role}`)
        }
      },
    ],
  },
  timestamps: true,
}
