# 🚀 SILA.GL BACKEND — DEPLOYMENT GUIDE

Følg disse trin i rækkefølge. Sæt et ✅ ved hvert trin du har gjort.

---

## TRIN 1: Forberedelse på din computer

### Installer Node.js (hvis du ikke har det)
1. Gå til https://nodejs.org
2. Download "LTS" versionen (den grønne knap)
3. Kør installeren
4. Åbn terminal og tjek: `node --version` — du skal se v20+

### Installer pakkerne
```bash
cd sila-2/backend
npm install
```

---

## TRIN 2: Opret database på Railway

1. Gå til https://railway.app og opret konto (gratis)
2. Klik "New Project" → "Provision PostgreSQL"
3. Klik på din nye database → "Connect" → kopier "DATABASE_URL"
4. Gem den til din .env fil

---

## TRIN 3: Opret .env fil

```bash
# I mappen sila-2/backend:
cp .env.example .env
```

Åbn `.env` og udfyld:
- `DATABASE_URL` — fra Railway (trin 2)
- `PAYLOAD_SECRET` — kør: `openssl rand -base64 32` i terminal
- `STRIPE_SECRET_KEY` — fra dashboard.stripe.com
- `STRIPE_PUBLISHABLE_KEY` — fra dashboard.stripe.com
- `FRONTEND_URL` — din Vercel URL (eller http://localhost:5173 under udvikling)

---

## TRIN 4: Kør backend lokalt (test det virker)

```bash
cd sila-2/backend
npm run dev
```

Du skal se:
```
SILA.GL BACKEND KØRER
Port: 3000
Admin: http://localhost:3000/admin
```

Åbn http://localhost:3000/admin i din browser.
Opret en admin-bruger første gang du åbner den.

---

## TRIN 5: Deploy til Railway

1. I Railway: "New Service" → "GitHub Repo" → vælg sila-2
2. Sæt "Root Directory" til `/backend`
3. Tilføj alle dine .env variabler under "Variables"
4. Railway deployer automatisk

Din backend URL bliver noget som: `https://sila-backend.railway.app`

---

## TRIN 6: Kobl frontend til ny backend

I din `sila-2` frontend mappe, opret `.env`:
```
VITE_API_URL=https://sila-backend.railway.app
```

Udskift `src/api/base44Client.js` med `src/api/client.js` fra denne mappe.

---

## TRIN 7: Stripe webhook

1. Gå til dashboard.stripe.com → Webhooks
2. Tilføj endpoint: `https://sila-backend.railway.app/api/webhooks/stripe`
3. Vælg events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`
4. Kopier webhook secret til din .env: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## FEJL OG LØSNINGER

**"Cannot find module"**
→ Kør `npm install` igen

**"Database connection failed"**
→ Tjek at DATABASE_URL er korrekt i .env

**"Invalid Stripe key"**
→ Brug test-nøgler under udvikling (starter med sk_test_)

**Admin-panel virker ikke**
→ Tjek at PAYLOAD_SECRET er sat og minimum 32 tegn

---

## HVAD SKER DER AUTOMATISK?

Når backend kører, vil disse ting ske automatisk:
- ✅ Database-tabeller oprettes (ingen manuel SQL)
- ✅ Admin-panel er tilgængeligt på /admin
- ✅ REST API er tilgængeligt på /api
- ✅ Stripe webhooks modtages og bookinger opdateres
- ✅ TrustScore genberegnes ved nye reviews
- ✅ Ratings opdateres på listings

---

*Sidst opdateret: April 2026*
*Kontakt: Via GitHub Issues på runehvistendal/sila-2*
