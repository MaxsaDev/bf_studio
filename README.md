# Body Factory — certificate shop

Next.js 16 storefront for [Body Factory](https://bodyfactory.studio), a massage studio in Lviv: gift certificates, massage-course and special-session certificates, master classes. Single-page premium UI (Framer Motion, Tailwind CSS v4), checkout dialog, payment via WayForPay through the studio's payments service (bf-back-v2).

## Development

```bash
npm install
cp .env.example .env.local   # then fill in PAYMENT_SERVICE_API_KEY
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build / serve |
| `npm run lint` | ESLint (next/core-web-vitals + TypeScript) |
| `npm test` | Vitest unit tests (`lib/__tests__`) |

To exercise checkout against a locally running bf-back-v2 (`NOVA_POSHTA_MOCK=1 PORT=3011 bun run src/index.ts` in that repo), start this app with `PAYMENT_SERVICE_URL=http://localhost:3011/api/v1` (the `bf-studio-prod-localservice` entry in `.claude/launch.json` does exactly that).

## Environment

Server-side only; set the same values in Vercel.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PAYMENT_SERVICE_API_KEY` | yes | key from the bf-back-v2 `API_KEYS` list |
| `PAYMENT_SERVICE_URL` | no | service API base, defaults to production (`…/api/v1`) |

Nova Poshta and WayForPay credentials live in bf-back-v2 (`NOVA_POSHTA_*`, `WAY_FOR_PAY_STUDIO_*`), not here.

## Payment flow

Three stages: **Товар → Кошик → Оплата**.

1. Visitor picks a certificate (and a variant for courses). If the product offers add-ons (`data/addons.ts`, limits per product in `data/certificates.ts`) they choose them for that card; add-ons show up as stickers on the card preview. Switch the upsell off with `siteConfig.features.addons.enabled`.
2. The card goes into the cart (localStorage, `lib/cart.ts`). Several cards, each with its own add-ons and quantity; a floating cart pill reopens it.
3. On the payment screen the buyer chooses pickup at the studio or Nova Poshta delivery to a recipient (name, phone, city, branch or parcel locker; `/api/np/*` proxy the service's lookups).
4. Browser POSTs `{ items: [{ certificateId, variantId, addons, qty }], name, phone, delivery }` to `/api/create-invoice`.
5. The route validates every item, **resolves the total from the catalog** (client-supplied amounts are never accepted), rate-limits per IP and sends the priced order to bf-back-v2 `POST /api/v1/certificates/orders`, which stores it and creates the WayForPay invoice on the studio merchant. The response carries the order's `clientToken`.
6. Browser is redirected to the WayForPay invoice URL. The service's webhook marks the order paid and creates the Nova Poshta waybill (ТТН) - the number goes into the buyer SMS, the admin SMS and Telegram. WayForPay returns the buyer to `/success-payment`, which clears the stored cart and posts the client token to `/api/shipments` to show the ТТН (creating it if the webhook attempt failed).

Prices, discounts and copy live in `data/certificates.ts`, `data/addons.ts`, `lib/site-config.ts` and `lib/certificate-config.ts`. See [CLAUDE.md](CLAUDE.md) for the architecture map.
