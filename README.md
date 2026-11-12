# ApnaDastakhwan 🍲

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

## Business Model (per flyer)

- **Monthly Dinner Package:** Rs. 12,000 — 4-week cycle, 24 meals (Mon–Sat, Sunday off) — *Most Popular*
- **Weekly Dinner Trial:** Rs. 3,300 — 6 dinners, choose Week 1 / 2 / 3 / 4
- **Daily Single Tiffin:** Rs. 600 — today's scheduled dinner box
- **Group / Hostel Orders:** 3+ packs to the same address get a bulk discount (admin-managed toggle)
- **Payments:** COD or **NayaPay** (screenshot upload at checkout, verified by admin)
- **WhatsApp order & support:** +92 330 3038457 (floating button site-wide)
- **Delivery:** Gulshan-e-Iqbal, Block 16 (near Noor Masjid) & surrounding blocks, 8:00–9:30 PM

## Setup

1. **Place the logo** at `public/logo.png`.
2. `npm install`
3. Create Firebase project; enable **Auth (Email/Password)**, **Firestore**, **Storage**.
4. Copy `.env.example` → `.env`, paste your Firebase web config.
5. Deploy `firestore.rules` and `storage.rules` from this repo.
6. Seed the database: `npm run seed`
7. Make yourself admin: register in app → Firestore → `users/{uid}` → `role: "admin"`
8. `npm run dev`

## Key Collections

- `plans` — dinner packages (daily/weekly/monthly, PKR pricing, totalMeals)
- `rotationalMenu` — docs `week1`…`week4`, each with `days: { Monday…Saturday: {title, description, imageUrl, available} }`
- `config/addons`, `config/groupOrder` — admin-managed add-ons & bulk discount
- `subscriptions` — orders with groupOrder, selectedWeek, pausedDates, payment proof
- `users` — profiles + `role: customer | admin`

## Folder Structure

```
scripts/seed.js          # Seeds plans, add-ons & weekly menu
firestore.rules          # Role-based security rules
storage.rules            # Receipt/menu image rules
public/logo.png          # Brand logo
src/
  firebase/firebase.js   # Firebase init (auth, db, storage)
  context/
    AuthContext.jsx      # Auth + Firestore profile + role
    CartContext.jsx      # Selected plan + add-ons
  components/
    Navbar, Footer, Logo, Loader
    PlanCard, MenuCard
    ProtectedRoute, AdminRoute
  pages/
    Home, MenuPage, PlansPage, Checkout
    Login, Register, Dashboard, NotFound
    admin/
      AdminLayout (sidebar), AdminOverview,
      AdminOrders, AdminMenu, AdminPlans, AdminDelivery
  utils/constants.js     # Pricing fmt, dates, cutoff logic, slots
```

## Business Rules Implemented

- **Pause/Skip cutoff:** customers may pause any delivery date up to **10:00 PM the night before** (`canPauseDate` in `src/utils/constants.js`). Each paused day **extends the subscription end date by 1 day**.
- **Payment:** COD or Easypaisa/JazzCash/Bank with screenshot upload to `Storage/payments/{uid}/...`; admins verify receipts in Admin → Orders.
- **Role security:** `/admin` requires `role === "admin"` in the Firestore `users` doc, enforced both by route guard (`AdminRoute`) and `firestore.rules` (`isAdmin()`).
- **Kitchen prep count:** admin overview computes exact lunch/dinner boxes for today, excluding paused users/dates.
- **Rider sheet:** filterable by meal type & area, printable via browser print (`@media print` styles).
