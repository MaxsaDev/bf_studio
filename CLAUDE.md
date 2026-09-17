# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application for Body Factory - a certificate sales platform for massage courses, gift certificates, special sessions, and master classes. The app features a premium, cinematic UI with smooth animations using Framer Motion.

## Commands

### Development
```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build production application
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run unit tests (vitest)
```

## Architecture

### App Structure (Next.js App Router)
- **`app/`** - Next.js app router pages
  - `page.tsx` - Main landing page with all certificate sections (wrapped in `MotionConfig reducedMotion="user"`)
  - `layout.tsx` - Root layout (`lang="uk"`) with font configuration (Evolventa local font from `app/fonts/Evolventa` + Playfair Display), OG/Twitter metadata with a `%s | Body Factory` title template, and JSON-LD structured data
  - `api/create-invoice/route.ts` - Server-side order proxy. Validates `{ items: [{ certificateId, variantId, addons, qty }], name, phone, delivery }` with zod, **re-resolves every price from `data/certificates.ts` + `data/addons.ts`** (a client-supplied amount is never accepted), rate-limits per IP (`lib/rate-limit.ts`), appends the delivery choice to the description and sends ONE order for the whole cart (priced item snapshot + buyer + delivery) to bf-back-v2 `POST /api/v1/certificates/orders`, which stores it and creates the WayForPay invoice. Answers `{ url, orderReference, clientToken }`
  - `api/np/cities/route.ts`, `api/np/warehouses/route.ts` - Rate-limited, cacheable proxies to the payments service's `/delivery/cities` and `/delivery/warehouses` lookups (shared mapping in `api/np/lookup.ts`). No Nova Poshta key exists in this app
  - `api/shipments/route.ts` - Relays `{ orderReference, clientToken }` to bf-back-v2 `POST /api/v1/certificates/orders/{ref}/shipment`, which creates the Nova Poshta waybill (ТТН) for a PAID order or returns the one its webhook already made. 202 "pending" while the service has not seen the payment (the browser keeps the entry and retries), 409 "failed" for pickup / electronic orders (nothing to ship), 401/404 for a bad token / unknown order (entry dropped), 502/503 to retry later. `maxDuration = 30`
  - `agreement/` & `privacy/` - Legal pages (server components, export `metadata`)
  - `success-payment/` - Post-payment landing page: server `page.tsx` exports `metadata` (noindex), UI lives in `success-payment-content.tsx`
  - `error.tsx` - Error boundary
  - `sitemap.ts` / `robots.ts` - SEO routes
  - `globals.css` - Tailwind CSS v4 setup with custom warm stone theme using OKLCH color space

### Component Organization
Components follow a domain-driven structure:

- **`components/certificates/`** - Certificate-specific components
  - `certificate-card.tsx` - Router component that delegates to specific card types
  - `massage-course-card.tsx` - For massage course certificates with variant switcher (sessions/course)
  - `gift-certificate-card.tsx` - For generic gift certificates
  - `named-gift-certificate-card.tsx` - For premium "gemstone" named certificates (Emerald, Sapphire, Ruby)
  - `master-class-card.tsx` - For master class certificates
  - `special-certificate-card.tsx` - For special session certificates
  - `certificate-card-visual.tsx` - Shared visual component for certificate card display (`imagePriority` prop controls next/image preloading — only the initially active carousel card sets it). `stickers` prop renders add-on stickers three per column left/right of the title; pass an array (even empty) to reserve the columns and narrow the title, leave undefined on carousel cards
  - `certificate-card-controls.tsx` - Shared controls (variant switcher, price, discount badge with optional label/endDate, buy button)
  - `section-carousel.tsx` - Main carousel component for certificate sections (drag, keyboard arrows, inert/aria-hidden inactive cards)

- **`components/checkout/`** - Checkout flow, three stages **"Товар - Кошик - Оплата"**
  - `checkout-overlay.tsx` - Full-screen dialog (role="dialog", focus trap, Esc-to-close, X button). Props: `initialScreen`, `pendingProduct` (card just picked), `cart` (`CartController` from `lib/use-cart.ts`). Screens: **product** = add-ons for one card (`addons-step.tsx`, "Додати в кошик"; also edits an existing line with "Зберегти") → **cart** (`cart-step.tsx`) → **payment** (buyer form, react-hook-form + zod, `order-summary.tsx`, "Оплатити"). Products without add-ons (master classes) skip the product screen and land in the cart. The floating card shows the card being configured (with its stickers); on the cart and payment screens it appears only while the cart holds a single card configuration, otherwise it is hidden
    - Field labels say **"Ім'я покупця" / "Телефон покупця"** and the subtitle states the buyer, not the recipient, fills the form — keep that wording
    - Phone formatting via `lib/phone.ts` (+38 Ukrainian format, paste-safe)
    - Agreement checkboxes with links to legal pages
    - Inline error banner on payment failure (no alert())
    - Esc / backdrop / close are ignored while a submit is in flight (a stray invoice would otherwise be created and the redirect would still fire)
  - `addons-step.tsx` - Add-on rows: toggle when the limit is 1, "Додати" + stepper when up to 6; "Разом за BFCard" + primary/secondary buttons passed in by the overlay
  - `cart-step.tsx` - Cart lines (title, variant, per-card add-on chips with icons, qty stepper 1..10, remove, "Змінити додатки"), total, buttons "Оформити замовлення" / "Продовжити покупки" / "Очистити кошик"; empty state
  - `cart-button.tsx` - Floating top-right pill (count badge + total) shown when the cart has cards and the dialog is closed; opens the cart screen
  - `checkout-progress.tsx` - "Товар · Кошик · Оплата" indicator and the `CheckoutScreen` type
  - `checkout-form-schema.ts` - zod schema + defaults for the payment form (buyer, delivery, agreement); Nova Poshta fields validated only when that method is selected (pickup and electronic carry no extra fields); `toDeliveryDetails()` maps form values to the API shape
  - `delivery-fields.tsx` - "Отримання BFCard" block: method radio (pickup = default / Nova Poshta / "Електронний"; stacked while the dialog is narrow, one row from 33rem via container queries so labels never wrap), the selected method's note, recipient name + phone ("Той самий, що й покупець" copies the buyer), city combobox (`/api/np/cities`), branch/locker combobox with type chips (`/api/np/warehouses`). Escape inside an open list closes the list, not the dialog
  - `pending-shipment-processor.tsx` - `usePendingShipment()` posts the stored order reference + client token to `/api/shipments`, retrying a few times on the same visit while the payment is still unconfirmed; `PendingShipmentProcessor` runs silently on the landing page, `ShipmentStatus` shows the ТТН on the success page
  - `checkout-styles.ts` - Shared field/label/link class strings
  - `order-summary.tsx` - The purchase list on the payment screen: one block per cart line (qty, discount, that card's add-ons), total "До сплати". Meta parts ("13300 ₴ за шт") are `whitespace-nowrap`, lines wrap only at " · " (same in `cart-step.tsx` and the add-on rows)
  - `step-button.tsx` - Shared round ± button

- **`components/layout/`** - Layout and decorative components
  - `floating-nav.tsx` - Floating navigation bar with IntersectionObserver scroll-spy
  - `splash-screen.tsx` - Initial loading screen (shown once per session via sessionStorage; timing in `lib/animation-config.ts`)
  - `scroll-blur.tsx` - Static top/bottom viewport blur
  - `cursor-spotlight.tsx` - Custom cursor spotlight effect
  - `ambient-background.tsx` - Animated background (random configs generated once on mount; disabled for prefers-reduced-motion)
  - `section-header.tsx` - Section headers with index numbers

- **`components/seo/`** - `structured-data.tsx` renders JSON-LD (LocalBusiness + Product/Offer list) in the layout head

- **`components/ui/`** - shadcn/ui components (Radix UI primitives)
  - Only what the app uses: button, input, checkbox, label, form — add others via the shadcn CLI when needed (and their Radix package with them)
  - `marquee.tsx` - Custom animated marquee component (static under prefers-reduced-motion)

### Data Layer
- **`data/addons.ts`** - The six add-ons ("додатки": foot/hand/head massage, aroma oils, candles, extra time) with title, fiscal name, price and sticker icon (`public/addons/*.svg`), plus the sheet presets `ADDONS_SINGLE` (1 of each) and `ADDONS_COURSE` (0-6 of each). Source of truth is the owner's "bf-card-additions" sheet
- **`data/certificates.ts`** - Static certificate data array. Each product (or course variant) carries `addons`: max quantity per add-on id — omit to offer none (master classes)
  - Massage courses - each has a `variants` array (e.g. "1 Сеанс" / "6 Сеансів" / "10 Сеансів") with per-variant price, sessions count, and optional discount
  - Special certificates (`type: "special"`) - one-off sessions (couples massage, hot stones, etc.) with flat `price`
  - Gift certificates - `denomination` doubles as the price (no separate `price` field)
  - Named gift certificates - gemstone-themed (Смарагдовий/Сапфіровий/Рубіновий), `denomination` doubles as the price
  - Master classes - flat `price`
  - Any certificate or course variant can have a `discount` object (`percentage`, optional `label`, optional `endDate`)

- **`types/addon.ts`** - `Addon`, `AddonId`, `AddonLimits` (max qty per id), `AddonSelection` (`{ id, qty }` sent by the browser)
- **`types/delivery.ts`** - `DeliveryDetails` = `{ method: "pickup" }` | `{ method: "nova_poshta", recipient, city, warehouse }` | `{ method: "electronic" }`
- **`types/certificate.ts`** - TypeScript discriminated union
  - `Certificate` union covering 5 types: `massage_course`, `gift_certificate`, `named_gift_certificate`, `master_class`, `special`
  - `MassageCourseCertificate` has `variants: CertificateVariant[]`
  - Narrow with `certificate.type === ...` — never cast to `any`

### Shared Logic (`lib/`)
- `pricing.ts` - **Single source of truth** for the main item price: `resolvePrice(certificate, variantId)` returns base/final price, discount, order description, item/variant titles. `applyDiscount()` for raw math. Used by cards, checkout, and structured data.
- `addons.ts` - Add-on resolution: `getAvailableAddons(certificate, variantId)` (what to offer, respects the site-config switch), `validateAddonSelection()` (strict, used by the payment route), `resolveAddonLines()` (lenient, used by the UI), `describeAddons()`. Add-ons are never discounted
- `order.ts` - `resolveOrder(certificate, variantId, addonLines)` = ONE card: main price + add-ons → `total` and its `orderDescription` ("… . Додатки: Масаж стоп 2 шт, Ефірні олії")
- `cart.ts` - Pure cart logic shared by browser and route: `addToCart` (identical configuration → qty), `setCartLineQty`, `updateCartLineAddons` (merges twins), `resolveCart(lines)` → per-line totals (`qty × (card + its add-ons)`), grand total and `description` (`describeCart`: single card = plain order description, several = "2 шт …; …" capped at 250 chars), `sanitizeCartLines` for storage. Caps: 10 lines, qty 1..10
- `cart-storage.ts` - localStorage (`bf-cart-v1`) load/save/clear, every read sanitised against the catalog; cleared on `/success-payment`
- `cart-store.ts` / `use-cart.ts` - Module store consumed through `useSyncExternalStore` (empty server snapshot, lazy localStorage read, cross-tab `storage` sync) → `CartController` (`lines`, `count`, `add`, `remove`, `setQty`, `updateAddons`, `clear`); tracks `cart_*` analytics
- `delivery.ts` - `deliverySchema` (pickup | nova_poshta with recipient, city ref/name, warehouse ref/description/category | electronic), `DELIVERY_METHODS` (display order), `deliveryOptionConfig(method)` (site-config entry), `enabledDeliveryMethods()`, `deliveryLabel()`, `describeDelivery()` + `withDeliveryDescription()` (compact admin text appended to the payment description: "Самовивіз зі студії" / "Електронна BFCard" / "Нова пошта: …"), `shortWarehouseLabel()`
- `payment-service.ts` - Server-only client for bf-back-v2: `serviceApiBase()` (`PAYMENT_SERVICE_URL`, default production `/api/v1`), `serviceApiKey()`, `callService(path, { method, query, body, timeoutMs })` → `{ status, ok, body, retryAfter }` (never throws on transport/HTTP errors; status 0 = no answer). The service owns WayForPay, the order records and Nova Poshta; this app holds only the API key
- `pending-shipment.ts` / `api/shipments.ts` - Browser side of the automatic waybill: localStorage `bf-pending-shipment` (`{ orderReference, clientToken, summary }`) / `bf-shipment-result`, `createShipment()` client
- `phone.ts` - Ukrainian phone helpers: `formatPhoneDisplay` (input mask), `formatPhoneForAPI` (+380...), `UA_PHONE_DISPLAY_REGEX` (form validation), `UA_PHONE_API_REGEX` (server-side validation of the +380 form)
- `animation-config.ts` - Splash/intro timing constants + `hasSeenSplash()` sessionStorage gate
- `analytics.ts` - `track(event, props)` facade (gtag/dataLayer, no-op otherwise). Funnel events: `certificate_selected`, `addon_changed`, `cart_add`, `cart_remove`, `cart_qty`, `cart_addons_updated`, `cart_clear`, `checkout_started`, `checkout_submitted` (carry `items`, `cards`, `amount`, `delivery_method`), `payment_redirect`, `payment_error`, `shipment_created`
- `api/payments.ts` - `createPaymentInvoice()` POSTs `{ items, name, phone, delivery }` to our own `/api/create-invoice` route and returns `{ url, orderReference, clientToken? }`. The browser never calls bf-back-v2 directly and never sends an amount
- `rate-limit.ts` - In-memory fixed-window limiter (`createRateLimiter`, `getClientIp`) used by the invoice route. Per warm instance on serverless — see the file header; a Vercel WAF rule is the hard guarantee
- `certificate-config.ts` - Visual constants (card image, gemstone colors, typography sizes)
- `site-config.ts` - Business info, legal links, success page copy, feature flags. `features.addons.enabled` switches the whole add-on upsell off (no step, no stickers, route rejects add-ons). `delivery.pickup` / `delivery.novaPoshta` / `delivery.electronic` (enabled, label, note) drive the delivery block; parcel size, payer, declared value and the sender branch are bf-back-v2 env
- `theme-config.ts` - Theme mode + ambient background config

### State Management
State is managed locally with React hooks:
- Main page owns the cart (`useCart()`, persisted in localStorage) plus `pendingProduct`, `checkoutScreen`, `isCheckoutOpen`
- Certificate selection flows: User clicks "Придбати" → `handleSelect(certificate, variantId?)` → product offers add-ons ? open overlay on the **product** screen : `cart.add(...)` and open on the **cart** screen. The floating `CartButton` reopens the cart
- Checkout overlay is dynamically imported (SSR disabled) to reduce initial bundle size

### Styling
- **Tailwind CSS v4** with custom configuration
- OKLCH color space for warm stone theme
- Custom fonts:
  - Evolventa (local font) - primary sans-serif (`--font-evolventa`)
  - Playfair Display (Google font) - serif for headers (`--font-playfair`)
- Dark mode support via custom variant `@custom-variant dark (&:is(.dark *))`
- Path alias: `@/*` maps to project root

### Animation
- **Framer Motion** for page transitions and micro-interactions
- `MotionConfig reducedMotion="user"` wraps the main page — respect it; also check `useReducedMotion()` for infinite/decorative animations
- Staggered header animations timed against the splash via `lib/animation-config.ts` (returning visitors skip the splash and get a short intro delay)
- Layout animations (`layoutId`) for shared certificate card transitions into checkout

### Key User Flows
1. **Browse Certificates** - User scrolls through 5 sections (courses, special, named, gift, master classes)
2. **Select Certificate** - Click certificate card → For massage courses, pick a variant (single session / course)
3. **Товар** - If the product offers add-ons: pick them (toggle or 0-6 stepper); they appear as stickers on the card preview → "Додати в кошик". Otherwise the card lands in the cart directly
4. **Кошик** - Every configured card with its own add-ons, qty stepper, "Змінити додатки", remove. "Оформити замовлення" / "Продовжити покупки" (dialog closes, cart pill stays top-right) / "Очистити кошик"
5. **Оплата** - Buyer details (name + phone, explicitly the buyer's), **"Отримання BFCard"** (pickup at the studio; Nova Poshta: recipient name + phone, city, branch/locker; or "Електронний": no extra fields, staff call the buyer and send the card), agreement checkboxes, purchase list per card, total → "Оплатити"
6. **Submit** - Form validates → POST `/api/create-invoice` with `{ items: [{ certificateId, variantId, addons, qty }], name, phone, delivery }` → route validates every item against the catalog, resolves the total + description server-side (delivery appended for the admin) and calls bf-back-v2 `POST /api/v1/certificates/orders` once for the whole cart with the priced item snapshot; the service stores the order and creates the WayForPay invoice (studio merchant). For Nova Poshta the response's `clientToken` is stored in localStorage → redirect to the WayForPay invoice URL
7. **After payment** - bf-back-v2's WayForPay webhook marks the order paid and creates the Nova Poshta waybill itself (ТТН goes into the buyer SMS, admin SMS and Telegram). `/success-payment` (and any later landing-page visit) posts the client token to `/api/shipments`, which asks the service for that waybill (or has it created if the webhook failed) → ТТН shown to the buyer. Nothing depends on the buyer coming back

### Form Handling
- `react-hook-form` with `@hookform/resolvers/zod`
- Phone number formatting/validation lives in `lib/phone.ts` (regex-validated full format `+38 (0XX) XXX-XX-XX`)
- Payment errors surface as an inline banner in the dialog

### Testing
- Vitest (`npm run test`), config in `vitest.config.mts`
- Unit tests in `lib/__tests__/` cover pricing resolution (incl. timezone-safe `formatDiscountEndDate`), phone formatting, the rate limiter and add-ons (`addons.test.ts` mirrors the sheet row by row; `addons-disabled.test.ts` mocks the site-config switch) — extend these when touching that logic
- `lib/__tests__/cart.test.ts` covers merging, quantity caps, add-on edits, resolution/description and storage sanitising
- `lib/__tests__/delivery.test.ts`, `payment-service.test.ts`, `shipments-route.test.ts`, `np-routes.test.ts` cover the delivery flow; the service is always a stubbed `fetch`. Nova Poshta itself is tested in bf-back-v2
- `lib/__tests__/create-invoice-route.test.ts` covers the payment proxy: validation of `items[]`, server-side price resolution (client `amount` ignored), multi-line totals, per-card add-ons, upstream error mapping, rate limiting. `fetch` is stubbed and `.env.local` is not loaded, so no real invoice is ever created by tests

## Important Implementation Notes

- The app uses Next.js App Router with client components (all interactive components use "use client")
- **The payment route is the only place that decides an amount.** Cards and checkout call `resolveOrder`/`resolveCart` for display; the server recomputes everything from `items[]`. Never add an `amount` field to the client request
- The whole cart is ONE WayForPay invoice. bf-back-v2 takes a single `orderDescription` string, so cards and add-ons are listed in words (capped at 250 chars, see `describeCart`). Itemised fiscal lines (`fiscalTitle` per add-on, one product per card) need a `products[]` field on the backend first
- Payments backend is bf-back-v2 (Hono, checked out at `../bf-back-v2`, shared with the club app - never break its club flow). Shop endpoints: `POST /api/v1/certificates/orders`, `POST /api/v1/certificates/orders/{ref}/shipment`, `GET /api/v1/certificates/orders/{ref}?clientToken=`, `GET /api/v1/delivery/cities|warehouses`. The `userId` we send becomes the WayForPay `orderReference` prefix (`cert_<id>_<variant|main>_<ts>` / `cart_<lines>_<count>_<ts>`); the service's `certificate_orders` row is keyed by that reference and its webhook creates the waybill
- Env: `PAYMENT_SERVICE_API_KEY` (required), `PAYMENT_SERVICE_URL` (optional API base) - see `.env.example`. Nova Poshta and WayForPay keys live in bf-back-v2 only. Everything is server-only; nothing payment- or delivery-related is `NEXT_PUBLIC_`
- **Personal data from the buyer is name + phone only** (plus the Nova Poshta recipient block when they choose delivery). No "name on the card" or other personalisation fields: the studio's staff collect those by phone. Do not add such fields back
- **Never put the Nova Poshta cabinet login/password anywhere in the repo or env.** The API uses a key generated in the cabinet; the app never logs in
- TypeScript paths use `@/` prefix for imports from project root
- Checkout overlay uses `RemoveScroll` + a manual focus trap; keep `role="dialog"`/`aria-modal` intact
- Sections are separated by animated marquee text
- Named gift certificate colors live in `lib/certificate-config.ts` (Смарагдовий #4da28f, Сапфіровий #00587c, Рубіновий #e5403a)
- Discount badges appear on cards and in checkout when a discount exists (variant discount overrides certificate discount for courses)
- Only the initially visible carousel card should set `imagePriority` — do not add `priority` to every card image
