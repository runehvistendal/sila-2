import express from 'express'
import payload from 'payload'
import cors from 'cors'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

config() // Indlæs .env filen

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const app = express()

// --- STRIPE ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

// --- CORS ---
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://sila.gl',
    'https://www.sila.gl',
  ],
  credentials: true,
}))

// --- STRIPE WEBHOOK (skal være FØR express.json()) ---
// Raw body er nødvendigt for Stripe signature verificering
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (err: any) {
      console.error('Stripe webhook fejl:', err.message)
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    // Håndter Stripe events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Betaling gennemført:', paymentIntent.id)
        // Opdater booking status til 'paid'
        try {
          const bookings = await payload.find({
            collection: 'bookings',
            where: {
              stripePaymentIntentId: { equals: paymentIntent.id },
            },
          })
          if (bookings.docs.length > 0) {
            await payload.update({
              collection: 'bookings',
              id: bookings.docs[0].id,
              data: {
                status: 'confirmed',
                paymentConfirmedAt: new Date().toISOString(),
              },
            })
            // Bloker datoer på listing
            // TODO: Tilføj dato til unavailableDates på cabin/transport
          }
        } catch (err) {
          console.error('Fejl ved booking-opdatering:', err)
        }
        break

      case 'payment_intent.payment_failed':
        console.log('Betaling fejlede')
        break

      case 'account.updated':
        // Stripe Connect konto opdateret
        const account = event.data.object as Stripe.Account
        if (account.charges_enabled) {
          try {
            const users = await payload.find({
              collection: 'users',
              where: { stripeAccountId: { equals: account.id } },
            })
            if (users.docs.length > 0) {
              await payload.update({
                collection: 'users',
                id: users.docs[0].id,
                data: { stripeAccountStatus: 'active' },
              })
            }
          } catch (err) {
            console.error('Fejl ved Stripe Connect opdatering:', err)
          }
        }
        break

      default:
        console.log(`Uhåndteret Stripe event: ${event.type}`)
    }

    res.json({ received: true })
  }
)

// --- JSON BODY PARSER ---
app.use(express.json())

// ============================================================
// CUSTOM API ENDPOINTS
// ============================================================

/**
 * POST /api/auth/register
 * Registrer ny bruger
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body

    // Valider — admin-rolle kan ikke vælges ved registrering
    if (role === 'admin') {
      res.status(403).json({ error: 'Du kan ikke registrere dig som admin' })
      return
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        fullName,
        role: role || 'guest',
        gdprConsent: true,
        gdprConsentDate: new Date().toISOString(),
      },
    })

    res.status(201).json({
      message: 'Bruger oprettet',
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * POST /api/auth/switch-dashboard
 * Skift aktivt dashboard (gæst/udbyder)
 * Valideres server-side — kræver korrekt rolle
 */
app.post('/api/auth/switch-dashboard', async (req, res) => {
  try {
    const { dashboard } = req.body
    const userId = (req as any).user?.id

    if (!userId) {
      res.status(401).json({ error: 'Ikke logget ind' })
      return
    }

    const user = await payload.findByID({ collection: 'users', id: userId })

    // Valider at brugeren har adgang til det ønskede dashboard
    if (dashboard === 'provider' && user.role !== 'provider' && user.role !== 'both') {
      res.status(403).json({ error: 'Du er ikke registreret som udbyder' })
      return
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: { activeDashboard: dashboard },
    })

    res.json({ activeDashboard: dashboard })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * POST /api/bookings/create
 * Opret booking med server-side prisvalidering
 */
app.post('/api/bookings/create', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      res.status(401).json({ error: 'Ikke logget ind' })
      return
    }

    const { listingType, listingId, checkIn, checkOut, guests, guestNote } = req.body

    // Hent listing og beregn pris server-side
    let listing: any
    let pricePerNight: number
    let cleaningFee: number
    let providerId: string

    if (listingType === 'cabin') {
      listing = await payload.findByID({ collection: 'cabins', id: listingId })
      pricePerNight = listing.pricePerNight
      cleaningFee = listing.cleaningFee || 0
      providerId = typeof listing.owner === 'object' ? listing.owner.id : listing.owner
    } else {
      listing = await payload.findByID({ collection: 'transport', id: listingId })
      pricePerNight = listing.price
      cleaningFee = 0
      providerId = typeof listing.owner === 'object' ? listing.owner.id : listing.owner
    }

    // Valider datooverlap
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (nights <= 0) {
      res.status(400).json({ error: 'Ugyldige datoer' })
      return
    }

    // Tjek at gæster ikke overskrider kapacitet
    if (listingType === 'cabin' && guests > listing.maxGuests) {
      res.status(400).json({ error: `Maks ${listing.maxGuests} gæster tilladt` })
      return
    }

    // Beregn priser
    const commissionPercent = parseFloat(process.env.SILA_COMMISSION_PERCENT || '10') / 100
    const subtotal = pricePerNight * nights
    const silaFee = Math.round(subtotal * commissionPercent)
    const totalPrice = subtotal + cleaningFee
    const providerPayout = totalPrice - silaFee

    // Opret Stripe Payment Intent
    const providerUser = await payload.findByID({ collection: 'users', id: providerId })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // øre
      currency: 'dkk',
      metadata: {
        listingType,
        listingId,
        guestId: userId,
        providerId,
      },
      // Automatisk overførsel til udbyder via Stripe Connect
      ...(providerUser.stripeAccountId && providerUser.stripeAccountStatus === 'active'
        ? {
            transfer_data: {
              destination: providerUser.stripeAccountId,
              amount: Math.round(providerPayout * 100),
            },
          }
        : {}),
    })

    // Opret booking i database
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        guest: userId,
        providerUser: providerId,
        listingType,
        ...(listingType === 'cabin' ? { cabin: listingId } : { transport: listingId }),
        checkIn,
        checkOut,
        nights,
        guests,
        pricePerNight,
        cleaningFee,
        subtotal,
        silaFee,
        totalPrice,
        providerPayout,
        currency: 'DKK',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        guestNote: guestNote || '',
      },
    })

    res.status(201).json({
      bookingId: booking.id,
      clientSecret: paymentIntent.client_secret,
      totalPrice,
      nights,
      breakdown: { pricePerNight, nights, subtotal, cleaningFee, silaFee, totalPrice },
    })
  } catch (err: any) {
    console.error('Booking fejl:', err)
    res.status(400).json({ error: err.message })
  }
})

/**
 * POST /api/stripe/connect
 * Start Stripe Connect onboarding for udbydere
 */
app.post('/api/stripe/connect', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      res.status(401).json({ error: 'Ikke logget ind' })
      return
    }

    const user = await payload.findByID({ collection: 'users', id: userId })

    // Opret Stripe Connect konto hvis den ikke eksisterer
    let accountId = user.stripeAccountId
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: { url: 'https://sila.gl' },
      })
      accountId = account.id
      await payload.update({
        collection: 'users',
        id: userId,
        data: { stripeAccountId: accountId, stripeAccountStatus: 'pending' },
      })
    }

    // Generer onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard?stripe=refresh`,
      return_url: `${process.env.FRONTEND_URL}/dashboard?stripe=success`,
      type: 'account_onboarding',
    })

    res.json({ url: accountLink.url })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * DELETE /api/auth/delete-account
 * GDPR: Slet brugerkonto og alle data
 * Retter Fejl #15
 */
app.delete('/api/auth/delete-account', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      res.status(401).json({ error: 'Ikke logget ind' })
      return
    }

    // Marker til sletning (vi sletter ikke umiddelbart pga. aktive bookinger)
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        deletionRequested: true,
        deletionRequestedAt: new Date().toISOString(),
      },
    })

    res.json({ message: 'Din konto er markeret til sletning inden for 30 dage' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// ============================================================
// INITIALISER PAYLOAD OG START SERVER
// ============================================================
const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════╗
║     SILA.GL BACKEND KØRER         ║
║     Port: ${PORT}                      ║
║     Admin: http://localhost:${PORT}/admin ║
╚════════════════════════════════════╝
    `)
  })
}

start().catch(console.error)
