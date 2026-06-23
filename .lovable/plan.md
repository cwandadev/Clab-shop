# tieflab — Expansion Plan

I'll execute this in phases so each piece lands solid. Before phase 2 I need a few API keys from you.

---

## Phase 1 — Rebrand & foundation (no keys needed, I'll start now)

1. **Brand**
   - Rename to **tieflab** (tagline: "from Clab — hardware innovation lab")
   - Add your logo as `src/assets/tieflab-logo.png`, use it in header + footer + favicon
   - Default currency → **RWF (FRW)**, auto-pick by browser locale (RW → RWF, US → USD, etc.)
   - Minimalist footer: logo, About Clab, Contact, language switcher, social links
2. **Auth**
   - Remove the admin-signup-code page
   - Add **Google OAuth** (managed) + **phone (SMS OTP)** sign-in alongside email/password
   - `/admin` becomes a hidden URL — no link in nav; first admin promoted by you via the dashboard once I give you instructions
3. **Languages**
   - Drop-in Google Translate widget supporting: English, Kinyarwanda, French, Russian, Swahili, Japanese, Chinese, Korean, Spanish, Arabic
   - Auto-detect from `navigator.language`

## Phase 2 — Product model expansion (DB migration)

Tables changing:

- `categories` (admin-managed) + `product_categories` junction (a product can be in many categories)
- `voltage_ranges` (admin-managed) + `product_voltages` junction
- `product_images` table (multiple images per product, ordered)
- `products.product_type` enum: `physical` | `digital_circuit`
- `products.digital_file_url` (for downloadable circuit files)

Admin UI gains: category manager, voltage manager, image uploader (multi-file).

## Phase 3 — Storefront upgrades

- **Advanced search**: name + description + category + voltage + price range, with debounced live results
- **Suggested products** on detail page: same-category, then same-voltage, ranked by price proximity (simple but solid)
- Separate **Digital Products / Circuits** browse section
- Add the creative product categories you mentioned (acrylic ceiling lights, wall lamps, etc.) as seed data

## Phase 4 — Admin dashboard

- **Financial dashboard**: revenue (today / week / month / all-time), avg order value, top products, revenue by currency, refunds, status breakdown — all line/bar charts (recharts)
- **Inventory dashboard**: low-stock alerts (<10), out-of-stock list, stock value, units sold per product
- **Orders view** already exists — keeps current functionality
- **Categories / Voltages / Products** managers

## Phase 5 — Payments & analytics (needs your keys)

Stripe handles cards natively. For Rwanda's MoMo + Bank transfer + Cash I'll handle them as **offline payment methods**: customer picks one at checkout, order is created in `pending_payment`, you confirm in the admin once funds clear (Stripe doesn't directly process Rwandan MoMo — true MoMo integration would need Flutterwave or MTN's API as a separate phase). Let me know if you'd rather pursue Flutterwave later.

- Add **Google Analytics 4** (gtag.js, page + event tracking)
- Add **Google AdSense** (auto-ads script in `<head>`)
- Confirm Stripe key works (already requested earlier)

---

## Vercel hosting

Lovable already publishes your app for free at `*.lovable.app`. To deploy to Vercel: I'll add a `vercel.json` config and you connect your GitHub repo to Vercel — I'll write the step-by-step. The app builds the same way on both.

---

## What I need from you before Phase 5

Please share / approve adding these secrets:

1. **STRIPE_SECRET_KEY** (live or test, `sk_test_...` or `sk_live_...`)
2. **VITE_STRIPE_PUBLISHABLE_KEY** (`pk_test_...` / `pk_live_...`)
3. **VITE_GA_MEASUREMENT_ID** (e.g. `G-XXXXXXX`)
4. **VITE_ADSENSE_CLIENT_ID** (e.g. `ca-pub-XXXXXXXXXXXXXX`)

Reply **"go"** to start Phase 1 + 2 now (rebrand, logo, languages, schema, admin updates), and I'll request the keys when we hit Phase 5. Or tell me to re-order phases.

## Tech notes (for the curious)

- Logo embed via `lovable-assets` so it lives on CDN (no big binary in repo)
- Multi-image uploads use Lovable Cloud Storage (`product-images` bucket, public read)
- Phone auth uses Lovable Cloud's built-in Twilio SMS provider (works out of the box in test mode; you'd add Twilio creds for live SMS later)
- Google Translate uses the free public widget (no API key)
- GA + AdSense are pure client-side script injections, no backend code
