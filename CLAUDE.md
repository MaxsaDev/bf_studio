# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application for Body Factory - a certificate sales platform for massage courses, gift certificates, and master classes. The app features a premium, cinematic UI with smooth animations using Framer Motion.

## Commands

### Development
```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build production application
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

### App Structure (Next.js App Router)
- **`app/`** - Next.js app router pages
  - `page.tsx` - Main landing page with all certificate sections
  - `layout.tsx` - Root layout with font configuration (Evolventa custom font + Playfair Display)
  - `agreement/` & `privacy/` - Legal pages
  - `globals.css` - Tailwind CSS v4 setup with custom warm stone theme using OKLCH color space

### Component Organization
Components follow a domain-driven structure:

- **`components/certificates/`** - Certificate-specific components
  - `certificate-card.tsx` - Router component that delegates to specific card types
  - `massage-course-card.tsx` - For massage course certificates with full course/session toggle
  - `gift-certificate-card.tsx` - For generic gift certificates
  - `named-gift-certificate-card.tsx` - For premium "gemstone" named certificates (Emerald, Sapphire, Ruby)
  - `master-class-card.tsx` - For master class certificates
  - `certificate-card-visual.tsx` - Shared visual component for certificate card display
  - `certificate-card-controls.tsx` - Shared controls for certificate cards
  - `certificates-carousel.tsx` - Legacy carousel (not actively used)
  - `section-carousel.tsx` - Main carousel component for certificate sections

- **`components/checkout/`** - Checkout flow
  - `checkout-overlay.tsx` - Full-screen overlay with form (react-hook-form + zod validation)
    - Handles phone formatting (+38 Ukrainian format)
    - Agreement checkboxes with links to legal pages
    - Success state animation
    - Price calculation with discount support

- **`components/layout/`** - Layout and decorative components
  - `floating-nav.tsx` - Floating navigation bar
  - `splash-screen.tsx` - Initial loading screen
  - `scroll-blur.tsx` - Scroll-based blur effects
  - `cursor-spotlight.tsx` - Custom cursor spotlight effect
  - `ambient-background.tsx` - Animated background effects
  - `section-header.tsx` - Section headers with index numbers

- **`components/ui/`** - shadcn/ui components (Radix UI primitives)
  - Standard shadcn components: button, card, input, checkbox, tabs, etc.
  - `marquee.tsx` - Custom animated marquee component

### Data Layer
- **`data/certificates.ts`** - Static certificate data array
  - Massage courses (id 1-7) with pricing for full course and per session
  - Gift certificates (id 8-12) with denominations 500-5000 UAH
  - Named gift certificates (id 13-15) - Emerald, Sapphire, Ruby themed
  - Master classes (id 16-20)
  - Some items have `discount` objects with percentage and optional label

- **`types/certificate.ts`** - TypeScript types
  - `Certificate` union type covering all 4 certificate types
  - `MassageCourseCertificate` - has `pricing` with fullCourse/perSession/sessions
  - `GiftCertificate` - simple denomination/price
  - `NamedGiftCertificate` - same as gift but different visual treatment
  - `MasterClassCertificate` - has title/price
  - All types can have optional `Discount` object

### State Management
State is managed locally with React hooks:
- Main page manages `selectedCertificate`, `selectedMode` ("fullCourse" | "session"), and `isCheckoutOpen`
- Certificate selection flows: User clicks certificate → `handleSelect()` → Opens checkout overlay
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
- Staggered animations on header text
- Layout animations for certificate cards
- Success state animations in checkout
- Marquee animations between sections

### Key User Flows
1. **Browse Certificates** - User scrolls through 4 sections (courses, named, gift, master classes)
2. **Select Certificate** - Click certificate card → For massage courses, choose "Full Course" or "Single Session"
3. **Checkout** - Overlay appears with certificate visual, form (name + phone), agreement checkboxes
4. **Submit** - Form validates, shows loading state, then success message

### Certificate Grouping Logic
Certificates are filtered by type in `app/page.tsx`:
- Massage courses: `type === "massage_course"`
- Named certificates: `type === "named_gift_certificate"`
- Gift certificates: `type === "gift_certificate"`
- Master classes: `type === "master_class"`

Each section uses `SectionCarousel` to display its certificates.

### Form Handling
- `react-hook-form` with `@hookform/resolvers/zod`
- Phone number formatting: Custom formatter converts input to `+38 (0XX) XXX-XX-XX` format
- Validation schema in checkout overlay validates name (min 2 chars), phone (min 17 chars), and agreement checkbox

### Special Visual Features
- Named gift certificates use color coding:
  - "Смарагдовий" (Emerald) → #4da28f
  - "Сапфіровий" (Sapphire) → #00587c
  - "Рубіновий" (Ruby) → #e5403a
- Discount badges appear on cards and in checkout when `certificate.discount` exists
- Certificate visuals use `layoutId` for shared element transitions

## Important Implementation Notes

- The app uses Next.js App Router with client components (all interactive components use "use client")
- TypeScript paths use `@/` prefix for imports from project root
- Checkout overlay uses `RemoveScroll` to prevent background scrolling
- The main page has large cinematic header with staggered text animations
- Sections are separated by animated marquee text
- Footer includes links to agreement and privacy pages
