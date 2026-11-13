# ApnaDastarkhwan 🍲

**Ghar ka Khaana, Sehat bhi!** — *We Make With Love — Homemade • Hygienic • Delicious*

Homemade dinner tiffin subscription platform for bachelors, students, families & working professionals in **Gulshan-e-Iqbal, Karachi**.

React (Vite) + Firebase v10 + Tailwind CSS + react-hot-toast.

## Brand Palette (from official menu flyer)

| Color | Hex | Usage |
|---|---|---|
| Primary Maroon | `#9E2A3A` / `#8B1E2F` | CTAs, prices, accents |
| Olive / Leaf Green | `#4F6D2A` / `#5C7A32` | Trust badges, success states |
| Warm Cream | `#FAF6F0` | Backgrounds |
| Charcoal | `#2D2A26` | Typography, footer |

Every colour is exposed as a **CSS variable** (`--c-red`, `--c-cream`, …) and mapped in
`tailwind.config.js`, so light/dark themes swap without duplicated utility classes.
Dark mode uses contrast-checked variants (e.g. `#B23A49` for solid buttons so white text
still clears 4.5:1).

## Typography

| Role | Face | Why |
|---|---|---|
| Display | **Fraunces** (variable, SOFT/WONK axes) | Warm, organic serif — restaurant / foodie mood |
| Body / UI | **Karla** | Clean humanist sans, highly readable at small sizes |
| Wordmark | **Lobster** | Brush script that matches the official logo wordmark |

The HTML wordmark uses the exact colours sampled from the logo artwork
(`#B03018` red, `#286028` green) so it is pixel-consistent with the image.

## Brand Assets

| File | What it is |
|---|---|
| `public/logo.png` | Full lockup — illustration + script wordmark (transparent) |
| `public/mark.png` | Illustration only, used in the navbar / favicon |
| `public/favicon.png` | 64×64 icon |
| `public/apple-touch-icon.png` | 180×180 home-screen icon |
| `public/menu-flyer.jpg` | The official monthly dinner menu flyer (downloadable from `/menu`) |

## Accessibility & UX

- Visible `:focus-visible` ring on every interactive control, plus a skip-to-content link.
- All form fields have real `<label for>` associations, inline errors, and a **focusable
  error summary** after a failed submit.
- Icons are a single Lucide family — **no emoji used as structural icons**.
- `prefers-reduced-motion` is honoured globally (animations and smooth scroll are disabled).
- Colour choices all meet **WCAG AA (4.5:1)** for body text in both themes.
- Tabs, accordions, dialogs and the mobile menu expose correct ARIA state.

## Setup

1. `npm install`
2. Create a Firebase project; enable **Auth (Email/Password)** and **Firestore**.
3. Copy `.env.example` → `.env`, paste your Firebase web config.
4. **Set up Cloudinary** for images — see below.
5. Deploy the Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   The composite indexes in `firestore.indexes.json` are required by the customer
   Dashboard query (`where userId == …` + `orderBy createdAt`).
6. Seed the database: `npm run seed`
   (needs `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` for an account whose
   Firestore `users/{uid}` doc has `role: "admin"`).
7. Make yourself admin: register in app → Firestore → `users/{uid}` → `role: "admin"`
8. `npm run dev`

### Media service — Cloudinary

Dish photos and NayaPay payment receipts are stored in **Cloudinary**. The free
plan needs **no billing card** and gives 25 monthly credits (1 credit = 1 GB of
storage, 1 GB of delivered bandwidth, or 1,000 transformations) — far more than a
menu of 24 photos and a few receipts will ever use.

**Setup (5 minutes):**

1. [Cloudinary console](https://console.cloudinary.com) → **Settings** → copy the
   **Cloud name** and **API key**
2. **Settings → Upload → Upload presets** → add an **unsigned** preset named
   `adn_menu` (this is what uploads the public dish photos)
3. In the project `.env`:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=<cloud-name>
   VITE_CLOUDINARY_UPLOAD_PRESET=adn_menu
   ```
4. Deploy the signing function (needed for **private** payment receipts) and set
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in
   its environment:
   - **Netlify** — `netlify/functions/cloudinary.js` (deploys automatically)
   - **Vercel** — `api/cloudinary.js` (deploys automatically)
5. Restart the dev server.

> `VITE_CLOUDINARY_FUNCTION_URL` is **not needed in production**. The app
> auto-detects the function from the hostname: `*.netlify.app` →
> `/.netlify/functions/cloudinary`, `*.vercel.app` (and any custom domain on
> Vercel) → `/api/cloudinary`. Set it explicitly only for local development
> against `netlify dev`:
> ```env
> VITE_CLOUDINARY_FUNCTION_URL=http://localhost:8888/.netlify/functions/cloudinary
> ```

### Deploying to Vercel

`vercel.json` is already set up (Vite build → `dist`, Node 20 function runtime,
and an SPA rewrite so deep links like `/admin/menu` don't 404 on reload).

Add these in **Vercel → Settings → Environment Variables** — the first three are
needed at build time, the rest only by the function:

| Variable | Scope | Value |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | All | from the Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | All | from the Firebase console |
| `VITE_FIREBASE_PROJECT_ID` | All | from the Firebase console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | All | from the Firebase console |
| `VITE_FIREBASE_APP_ID` | All | from the Firebase console |
| `VITE_CLOUDINARY_CLOUD_NAME` | All | from the Cloudinary console |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | All | your unsigned preset name |
| `FIREBASE_PROJECT_ID` | Function | same project id (role lookup) |
| `CLOUDINARY_CLOUD_NAME` | Function | same cloud name |
| `CLOUDINARY_API_KEY` | Function | from the Cloudinary console |
| `CLOUDINARY_API_SECRET` | Function | from the Cloudinary console — **secret** |

Then `vercel --prod`, and run:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**How it is secured:**

| | Dish photos | Payment receipts |
|---|---|---|
| Upload | unsigned preset → public CDN URL | **signed**, `type: authenticated` |
| Who may upload | admins only | any signed-in customer (their own receipt) |
| Who may read | anyone with the link | the uploading customer, or an admin |

The signing function verifies the caller's **Firebase ID token** (signature
checked against Google's JWKS) and reads their role from the Firestore
`users/{uid}` document — so **Firestore's own security rules remain the source
of truth**. The Cloudinary API secret never reaches the browser.

### Verify the setup

```bash
npm run check:firebase   # env vars, Cloudinary, signing function, Firestore, indexes
npm test                 # 31 tests for the signing + authorisation logic
```

`npm run check:firebase` prints the exact fix for anything missing.

> `npm run check:firebase` probes the signing function at
> `VITE_CLOUDINARY_FUNCTION_URL`, defaulting to `http://localhost:5173/api/cloudinary`.
> Locally that will 404 unless you run `netlify dev` (or point the variable at a
> running function) — in production on Vercel the app calls `/api/cloudinary`
> directly.

> The brand logo ships as `public/logo.png` (full lockup) and `public/mark.png`
> (illustration only, transparent background) — both are derived from the official
> artwork, so there is no manual asset step. If you replace them, keep the same
> filenames or update `src/components/BrandMark.jsx` and `FullLogo.jsx`.

## Business Model (per flyer)

- **Monthly Dinner Package:** Rs. 12,000 — 4-week cycle, 24 meals (Mon–Sat, Sunday off) — *Most Popular*
- **Weekly Dinner Trial:** Rs. 3,300 — 6 dinners, choose Week 1 / 2 / 3 / 4
- **Daily Single Tiffin:** Rs. 600 — today's scheduled dinner box
- **Group / Hostel Orders:** 3+ packs to the same address get a bulk discount (admin-managed toggle)
- **Payments:** COD or **NayaPay** (screenshot upload at checkout, verified by admin)
- **WhatsApp order & support:** +92 330 3038457 (floating button site-wide)
- **Delivery:** Gulshan-e-Iqbal, Block 16 (near Noor Masjid) & surrounding blocks, 8:00–9:30 PM

## Key Collections

- `plans` — dinner packages (daily/weekly/monthly, PKR pricing, totalMeals)
- `rotationalMenu` — docs `week1`…`week4`, each with `days: { Monday…Saturday: {title, description, imageUrl, available} }`
- `config/addons`, `config/groupOrder` — admin-managed add-ons & bulk discount
- `subscriptions` — orders with groupOrder, selectedWeek, pausedDates, payment proof
- `users` — profiles + `role: customer | admin`

## Folder Structure

```
scripts/seed.js          # Seeds plans, add-ons & weekly menu
scripts/check-firebase.js # Setup diagnostics (npm run check:firebase)
firestore.rules          # Role-based security rules
firestore.indexes.json   # Composite indexes (subscriptions queries)
storage.rules            # Legacy — only needed if you switch back to Firebase Storage
public/
  logo.png               # Full brand lockup (transparent)
  mark.png               # Illustration only (transparent)
  favicon.png            # 64x64 icon
  apple-touch-icon.png   # 180x180 icon
  menu-flyer.jpg         # Official monthly dinner menu flyer
design-system/           # UI/UX Pro Max design system reference
functions/               # Cloudinary signing service (shared logic + tests)
  lib/cloudinary.js      # JWT verification, upload & delivery signing
  lib/handler.js         # the request handler both adapters use
  test/                  # 31 tests for the auth and signing logic
api/cloudinary.js        # Vercel function adapter
netlify/functions/       # Netlify function adapter
vercel.json              # Vercel build config + SPA rewrite
netlify.toml             # Netlify build config + SPA redirect
src/
  firebase/firebase.js   # Firebase init (auth, db)
  context/
    AuthContext.jsx      # Auth + Firestore profile + role
    CartContext.jsx      # Selected plan + add-ons
  hooks/
    useTheme.js          # Light/dark theme with persistence
    useFirestore.js      # Collection/document subscriptions + error states
  utils/
    storage.js           # Cloudinary uploads (public images + private receipts)
    constants.js         # Pricing fmt, dates, cutoff logic, slots
  components/
    Navbar, Footer, Logo, BrandMark, FullLogo, ThemeToggle
    PlanCard, MenuCard, RotationalMenuTabs
    ProtectedRoute, AdminRoute
    SectionHeading, Reveal, Faq, Modal, FormErrorSummary
    Loader, ErrorState, ScrollToTop, WhatsAppFloat
  data/content.js        # FAQ entries, "What's included" strip
  pages/
    Home, MenuPage, PlansPage, Checkout
    Login, Register, Dashboard, NotFound
    admin/
      AdminLayout (sidebar), AdminOverview,
      AdminOrders, AdminMenu, AdminPlans, AdminDelivery
```

## Business Rules Implemented

- **Menu rotation follows the calendar month:** Week 1 = the 1st–7th, Week 2 = 8th–14th, Week 3 = 15th–21st, Week 4 = 22nd–28th (the 29th–31st wrap back into Week 1). Every customer eats the **same dish on the same calendar date**, whatever day they subscribed. Each calendar week is exactly one Monday-to-Saturday dinner cycle, so a month is 24 dinners.
- **Pause/Skip cutoff:** customers may pause any delivery date up to **10:00 PM the night before** (`canPauseDate` in `src/utils/constants.js`). Each paused day **extends the subscription end date by 1 day**.
- **Payment:** COD or Easypaisa/JazzCash/Bank with screenshot upload to `Storage/payments/{uid}/...`; admins verify receipts in Admin → Orders.
- **Role security:** `/admin` requires `role === "admin"` in the Firestore `users` doc, enforced both by route guard (`AdminRoute`) and `firestore.rules` (`isAdmin()`).
- **Kitchen prep count:** admin overview computes exact lunch/dinner boxes for today, excluding paused users/dates.
- **Rider sheet:** filterable by meal type & area, printable via browser print (`@media print` styles).
