import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './src/collections/Users'
import { Cabins } from './src/collections/Cabins'
import { Bookings } from './src/collections/Bookings'
import { Transport } from './src/collections/Transport'
import { Reviews } from './src/collections/Reviews'
import { Media } from './src/collections/Media'
import { Support } from './src/collections/Support'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // --- ADMIN PANEL ---
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Sila.gl Admin',
      favicon: '/favicon.ico',
    },
    // Customisér admin-panel til Sila
    components: {},
  },

  // --- COLLECTIONS ---
  collections: [
    Users,
    Cabins,
    Transport,
    Bookings,
    Reviews,
    Media,
    Support,
  ],

  // --- EDITOR ---
  editor: lexicalEditor(),

  // --- HEMMELIGHED (fra .env) ---
  secret: process.env.PAYLOAD_SECRET || 'SKIFT-DENNE-FØR-DEPLOYMENT',

  // --- TYPESCRIPT ---
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // --- DATABASE (PostgreSQL) ---
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),

  // --- BILLEDER ---
  sharp,

  // --- CORS (tillad din frontend) ---
  cors: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'https://sila.gl',
    'https://www.sila.gl',
  ],

  // --- CSRF BESKYTTELSE ---
  csrf: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://sila.gl',
  ],

  // --- RATE LIMITING ---
  rateLimit: {
    max: 500,
    window: 15 * 60 * 1000, // 15 minutter
    trustProxy: true,
  },

  // --- LOKALISERING (da/en/kl) ---
  localization: {
    locales: [
      { label: 'Dansk', code: 'da' },
      { label: 'English', code: 'en' },
      { label: 'Kalaallisut', code: 'kl' },
    ],
    defaultLocale: 'da',
    fallback: true,
  },

  // --- UPLOAD MAPPE ---
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB maks
    },
  },

  // --- GRAPHQL (deaktiveret — vi bruger REST) ---
  graphQL: {
    disable: true,
  },
})
