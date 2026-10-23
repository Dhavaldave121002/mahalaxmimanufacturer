# mahalaxmimanufacturer
# Mahalaxmi Enterprises — B2B Wholesale Marketplace & B2C E-Commerce Platform

> **Direct Mill Rates & Wholesale Essentials**

Mahalaxmi Enterprises is an India-focused B2B wholesale marketplace and B2C direct mill commerce platform for textiles, double bedsheets, 600 GSM bath towels, heavy canvas bags, and commercial kitchen & household goods.

> **Production readiness:** The catalog and site build are available, but customer sign-in, checkout/order placement, and returns are intentionally disabled in production until server-side customer authentication, authoritative pricing/inventory, payment verification, and order-ownership checks are implemented. Do not use this deployment to accept live orders.

Production product listings require a live MySQL connection. If the database cannot be reached, the product API returns `503` instead of serving stale fixture data. Bundle suggestions add products at their regular quantity-tier prices; no bundle discount is applied.

---

## Key Features

1. **Brand Identity & Curated Design System**
   - Deep Navy (`#14213D`), Royal Indigo (`#4F46E5`), Light Indigo (`#EEF2FF`), Warm Ivory (`#F8F7F4`), Muted Champagne (`#C6AA80`), Success Green (`#059669`).
   - High-contrast typography (*Plus Jakarta Sans* & *Inter*), micro-animations, and responsive layouts across desktop, tablet, and mobile.

2. **Core Product Catalog Divisions**
   - **Textile:** 300 TC Combed Cotton Bedsheets, 280 GSM Room Darkening Linen Curtains, 400 TC Hotel Percale Duvet Covers, and Raw Greige Fabric Bales.
   - **Cotton Products:** 600 GSM Zero-Twist Bath Towels, 380 GSM Duck Canvas Tote Bags, Waffle Baby Swaddles, and Industrial Comber Noil Bales.
   - **Home and Kitchen:** Chef-Pro Herringbone Bar Towels (12-pack), 260 GSM Heavy Cotton Drill Aprons, and Banquet Stain-Resistant Satin Damask Table Linen.
   - **Household:** Commercial 350 GSM Microfiber Cleaning Cloths (24-pack in 4 colors), Telescopic Dusters, and 80L Heavy Canvas Storage Organizers.

3. **B2B Wholesale Engine & RFQ Management (`/wholesale`)**
   - Multi-tier automatic volume discounts (10+, 50+, 200+ units).
   - **Live Bulk Savings Simulator** on homepage with dynamic price/savings projection.
   - **Bulk SKU Order Pad:** Matrix entry grid for quick multi-product orders.
   - **Commercial RFQ:** Submit custom requests for 500+ units with target pricing.
   - **Quotation Conversion:** One-click conversion of approved quotes into B2B orders with 30-day payment credit.

4. **Conversion-Focused Cart & Checkout (`/cart`, `/checkout`)**
   - Indian PIN Code delivery checker with instant delivery speed calculation.
   - Commercial discount coupon engine (`MILLDIRECT10`, `BULK500`, `MAHALAXMI20`).
   - Automated GST calculation (CGST + SGST or IGST based on buyer state).
   - Dual checkout personas (Individual Consumer vs Registered Business with GSTIN details for invoicing).
   - Payment methods: UPI QR, Bank Transfer / NEFT Escrow, Cash on Delivery (COD), and 30-Day B2B Trade Credit.

5. **Order Tracking & Rule 46 GST Invoicing (`/orders`)**
   - 5-stage shipment timeline with waybill consignment tracking.
   - Official Rule 46 CGST Tax Invoice generator with printable and PDF-ready layout.
   - 1-click reorder functionality.

6. **Operations & Admin Dashboard (`/admin`)**
   - Real-time gross revenue, order volume, and B2B vs B2C split.
   - Full product CRUD, wholesale tier editor, and instant stock adjustments (+50 / -10).
   - Order fulfillment control and consignment dispatch assignment.
   - RFQ review desk for merchandisers.
   - Catalog CSV import and export tools.

---

## Tech Stack

- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS v3.4, Lucide React, React Router DOM.
- **State Management:** Reactive Context Engine with persistent local storage.
- **Design System:** Custom Tailwind color tokens and glassmorphism utilities.

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Dhavaldave121002/mahalaxmimanufacturer.git
cd mahalaxmimanufacturer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

For Flutter Android-emulator testing, start the API server on the emulator-accessible host:
```bash
npm run dev:mobile
```
The debug app connects to the host through `10.0.2.2:5173`. Production order placement and live online payments remain disabled until server-side payment verification is implemented.

### 4. Build for production
```bash
npm run build
```

---

## Deployment to Vercel

```bash
npx vercel
```
Or connect your GitHub repository directly to Vercel with default Vite build settings:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Database and admin setup

1. Create a MySQL database that is reachable from Vercel and run `database/schema.sql` against it.
2. Add the database connection to Vercel Project Settings → Environment Variables using either `DATABASE_URL` or `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`. Set `MYSQL_SSL=true` when required by the provider. Never commit real credentials.
3. Set `.env` to the intended database and run `npm run db:seed-default-coupons` to add any missing factory coupons. The operation is additive and does not overwrite existing coupon settings or usage counts.
4. To create a first administrator locally, run `npm run admin:create` in an interactive terminal. The script displays the selected database, requires the exact confirmation `CREATE ADMIN`, asks for the password without echoing it, stores only a scrypt hash, and refuses to modify existing users. Never share the password or commit `.env`. For a hosted database, run the same command in a trusted environment configured for that database, or provision the user through a secure database administrator workflow.
5. To set every product's stock to 10,000 once, first run `npm run db:set-product-stock` to preview the affected database and then `npm run db:set-product-stock -- --apply` to update it. The apply command backs up existing stock values to a timestamped table and verifies the result.
6. To add material-based care guidance only to products without existing care instructions, run `npm run db:seed-product-care` to preview, then `npm run db:seed-product-care -- --apply`. The apply command backs up current care fields and verifies every product; customers are advised to follow the item's care label if it differs.
7. Redeploy after setting environment variables. Verify `/api/app-config?action=db-status` reports `connected: true` and `/api/products` returns `source: "MYSQL_DATABASE"` before relying on catalog data or the dashboard. Then sign in at `/admin` with the administrator email and password you provisioned.

Local MySQL connectivity was verified in the development environment. The Vercel database connection and its contents have not been verified. Production checkout, customer authentication, and return/exchange processing remain disabled until the missing server-side checks and payment integration are completed; configuring MySQL alone does not enable those flows.

---

## License

All rights reserved © Mahalaxmi Enterprises.
Direct Mill Rates & Wholesale Essentials.
