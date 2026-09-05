# Multilingual Food Product Search

Search packaged foods via Open Food Facts, browse results in English / Dutch / German / French, and unlock detailed nutrition through a Stripe test-mode monthly subscription.

- **Frontend** (`frontend/`): Next.js 16 App Router, React 19, Tailwind CSS 4, next-intl — port **3000**
- **Backend** (`backend/`): Express 5, Prisma, MySQL — port **4000**
- **Database**: MySQL 8 via Docker Compose — port **3306**

No npm workspaces. Run each package from its own directory.

## Setup

### 1. Environment files

Copy the example env files and fill in your Stripe test-mode values:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

`backend/.env` needs a real `STRIPE_SECRET_KEY` (`sk_test_...`), `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` (see [Stripe locally](#stripe-locally) below). Never commit `.env` files.

### 2. Start MySQL

From the repo root:

```powershell
docker compose up -d
```

### 3. Backend

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

The API listens on `http://localhost:4000`.

### 4. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` (redirects to `/en`).

### 5. Tests

Run the Vitest suites in each package:

```powershell
cd backend; npm test
cd ../frontend; npm test
```

Tests mock Prisma and external HTTP — no live MySQL, Open Food Facts, or Stripe required.

## Stripe locally

1. In the [Stripe Dashboard](https://dashboard.stripe.com/test/products), create a **test-mode Product** with a **monthly recurring Price**.
2. Copy the Price ID (`price_...`) into `STRIPE_PRICE_ID` in `backend/.env`.
3. Put your test secret key (`sk_test_...`) in `STRIPE_SECRET_KEY`.
4. Forward webhooks to the backend:

   ```powershell
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

   Paste the printed signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the backend.

5. Use test card **4242 4242 4242 4242** (any future expiry, any CVC) in Checkout.

6. Optional — trigger a webhook without completing Checkout:

   ```powershell
   stripe trigger checkout.session.completed
   ```

Subscription state is written only by the webhook handler. The success page polls `/api/me`; allow a few seconds after payment.

## Architecture decisions

| Decision | Rationale |
|---|---|
| **Split packages** | `frontend/` and `backend/` are independent Node projects with no root workspace. The browser calls Express directly via `NEXT_PUBLIC_API_URL`. |
| **Implicit demo user** | No auth. Every API request that needs a user loads the single row seeded from `DEMO_USER_EMAIL` (`demo@example.com`). |
| **next-intl + cookie / path locale** | UI routes are always prefixed (`/en`, `/nl`, `/de`, `/fr`). The language selector updates the path and sets the next-intl locale cookie. No `Accept-Language` auto-detect. |
| **Vitest** | Backend: Vitest + Supertest with mocked Prisma/OFF/Stripe. Frontend: Vitest + React Testing Library. No Playwright E2E. |
| **`presentProduct`** | Pure function that omits the `nutrition` key entirely when the user is not subscribed (`subscriptionStatus !== "active"`). Not Express middleware. |
| **No publishable key** | Checkout is a full redirect to the URL returned by `POST /api/checkout`. The frontend never loads Stripe.js. |
| **Status on `User`** | `subscriptionStatus` enum (`none` \| `active` \| `canceled` \| `past_due`) lives on the `User` model — no separate `Subscription` table. |
| **CGI `search.pl` for search** | Open Food Facts API v2 `/api/v2/search` does not support full-text `search_terms`. Search HTTP goes to `https://world.openfoodfacts.org/cgi/search.pl`. Product detail uses `https://world.openfoodfacts.org/api/v2/product/{barcode}`. Express still exposes `GET /api/search?q=&lang=`. |

## Internationalization

**UI strings** (buttons, labels, errors, nutrition headings, subscribe copy) live in `frontend/messages/{en,nl,de,fr}.json` and are rendered by next-intl.

**Product names and brands** come from Open Food Facts, not the JSON files. The backend applies this fallback chain for the requested `lang`:

1. `product_name_{lang}`
2. `product_name`
3. `generic_name_{lang}`
4. `generic_name`
5. `null` → UI shows a translated "Unknown product"

Brand uses the first comma-separated value from `brands`, or `null` → "Unknown brand".

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/search?q=&lang=&page=` | Localized search; records history; `page` defaults to 1 (max 1000, 24 per page) |
| GET | `/api/products/:barcode?lang=` | Product detail; nutriments only if subscribed |
| GET | `/api/me` | Demo user `subscriptionStatus` |
| GET | `/api/search-history` | Last 10 searches |
| POST | `/api/checkout` | Returns Stripe Checkout `{ url }` |
| POST | `/api/subscription/cancel` | Cancels the demo user’s Stripe subscription |
| POST | `/api/webhooks/stripe` | Stripe webhook (raw body, signature verified) |

## Known limitations

- No real authentication, accounts, or multiple users.
- In-app unsubscribe cancels immediately via the Stripe API (no billing-portal redirect).
- Nutrition facts are **per 100g only** — no serving-level nutriment table (per 100g only; serving size string may still display).
- No Playwright E2E, rate limiting, or OFF response cache for product detail.
- Search responses are cached in memory for 60 seconds per query, language, and page.
- Automated tests do not hit live Open Food Facts or Stripe.
- The demo user is global: any browser on the same backend sees the same subscription state.
- Webhook delivery is asynchronous; the success page polls `/api/me` up to 5 times (best-effort, not realtime).
