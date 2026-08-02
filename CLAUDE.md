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
  - `layout.tsx` - Root layout (`lang="uk"`) with font configuration (Evolventa custom font + Playfair Display), OG metadata, and JSON-LD structured data
  - `agreement/` & `privacy/` - Legal pages
  - `success-payment/` - Post-payment landing page
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
  - `certificate-card-visual.tsx` - Shared visual component for certificate card display (`imagePriority` prop controls next/image preloading — only the initially active carousel card sets it)
  - `certificate-card-controls.tsx` - Shared controls (variant switcher, price, discount badge with optional label/endDate, buy button)
  - `section-carousel.tsx` - Main carousel component for certificate sections (drag, keyboard arrows, inert/aria-hidden inactive cards)

- **`components/checkout/`** - Checkout flow
  - `checkout-overlay.tsx` - Full-screen dialog (role="dialog", focus trap, Esc-to-close) with form (react-hook-form + zod validation)
    - Phone formatting via `lib/phone.ts` (+38 Ukrainian format, paste-safe)
    - Agreement checkboxes with links to legal pages
    - Order summary line + price with discount support (via `lib/pricing.ts`)
    - Inline error banner on payment failure (no alert())
    - Submits to payment API and redirects to the invoice URL

- **`components/layout/`** - Layout and decorative components
  - `floating-nav.tsx` - Floating navigation bar with IntersectionObserver scroll-spy
  - `splash-screen.tsx` - Initial loading screen (shown once per session via sessionStorage; timing in `lib/animation-config.ts`)
  - `scroll-blur.tsx` - Static top/bottom viewport blur
  - `cursor-spotlight.tsx` - Custom cursor spotlight effect
  - `ambient-background.tsx` - Animated background (random configs generated once on mount; disabled for prefers-reduced-motion)
  - `section-header.tsx` - Section headers with index numbers

- **`components/seo/`** - `structured-data.tsx` renders JSON-LD (LocalBusiness + Product/Offer list) in the layout head

- **`components/ui/`** - shadcn/ui components (Radix UI primitives)
  - Standard shadcn components: button, card, input, checkbox, tabs, etc.
  - `marquee.tsx` - Custom animated marquee component (static under prefers-reduced-motion)

### Data Layer
- **`data/certificates.ts`** - Static certificate data array
  - Massage courses - each has a `variants` array (e.g. "1 Сеанс" / "6 Сеансів" / "10 Сеансів") with per-variant price, sessions count, and optional discount
  - Special certificates (`type: "special"`) - one-off sessions (couples massage, hot stones, etc.) with flat `price`
  - Gift certificates - `denomination` doubles as the price (no separate `price` field)
  - Named gift certificates - gemstone-themed (Смарагдовий/Сапфіровий/Рубіновий), `denomination` doubles as the price
  - Master classes - flat `price`
  - Any certificate or course variant can have a `discount` object (`percentage`, optional `label`, optional `endDate`)

- **`types/certificate.ts`** - TypeScript discriminated union
  - `Certificate` union covering 5 types: `massage_course`, `gift_certificate`, `named_gift_certificate`, `master_class`, `special`
  - `MassageCourseCertificate` has `variants: CertificateVariant[]`
  - Narrow with `certificate.type === ...` — never cast to `any`

### Shared Logic (`lib/`)
- `pricing.ts` - **Single source of truth** for price resolution: `resolvePrice(certificate, variantId)` returns base/final price, discount, order description, item/variant titles. `applyDiscount()` for raw math. Used by cards, checkout, and structured data.
- `phone.ts` - Ukrainian phone helpers: `formatPhoneDisplay` (input mask), `formatPhoneForAPI` (+380...), `UA_PHONE_DISPLAY_REGEX` (validation)
- `animation-config.ts` - Splash/intro timing constants + `hasSeenSplash()` sessionStorage gate
- `analytics.ts` - `track(event, props)` facade (gtag/dataLayer, no-op otherwise). Funnel events: `certificate_selected`, `checkout_submitted`, `payment_redirect`, `payment_error`
- `api/payments.ts` - `createPaymentInvoice()` POST to the BodyFactory backend
- `certificate-config.ts` - Visual constants (card image, gemstone colors, typography sizes)
- `site-config.ts` - Business info, legal links, success page copy
- `theme-config.ts` - Theme mode + ambient background config

### State Management
State is managed locally with React hooks:
- Main page manages `selectedCertificate`, `selectedVariantId`, and `isCheckoutOpen`
- Certificate selection flows: User clicks certificate → `handleSelect(certificate, variantId?)` → Opens checkout overlay
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
3. **Checkout** - Dialog appears with certificate visual, form (name + phone), agreement checkboxes, order summary
4. **Submit** - Form validates → invoice created via payments API → redirect to payment URL → `/success-payment` on return

### Form Handling
- `react-hook-form` with `@hookform/resolvers/zod`
- Phone number formatting/validation lives in `lib/phone.ts` (regex-validated full format `+38 (0XX) XXX-XX-XX`)
- Payment errors surface as an inline banner in the dialog

### Testing
- Vitest (`npm run test`), config in `vitest.config.mts`
- Unit tests in `lib/__tests__/` cover pricing resolution and phone formatting — extend these when touching that logic

## Important Implementation Notes

- The app uses Next.js App Router with client components (all interactive components use "use client")
- TypeScript paths use `@/` prefix for imports from project root
- Checkout overlay uses `RemoveScroll` + a manual focus trap; keep `role="dialog"`/`aria-modal` intact
- Sections are separated by animated marquee text
- Named gift certificate colors live in `lib/certificate-config.ts` (Смарагдовий #4da28f, Сапфіровий #00587c, Рубіновий #e5403a)
- Discount badges appear on cards and in checkout when a discount exists (variant discount overrides certificate discount for courses)
- Only the initially visible carousel card should set `imagePriority` — do not add `priority` to every card image
