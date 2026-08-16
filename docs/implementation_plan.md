# PropertyOS — Property Booking Management SaaS Platform

> A multi-tenant SaaS platform where short-term rental hosts (Airbnb-style) can register, manage their properties, share a Calendly-style booking link with payment, and operate their entire business — all from one dashboard. The platform owner controls everything from a dedicated Superadmin panel.

---

## Decisions Locked In

| Question | Decision |
|---|---|
| Admin panel | **Separate `apps/admin`** — same stack as `apps/platform`, deployed independently |
| Booking page | **Inside `apps/platform`** at `/book/:tenantSlug/:propertySlug` — Calendly-style UX with inline payment |
| Payment gateway v1 | **Razorpay only**, built on an **adapter interface** (Stripe/PayU pluggable later) |
| Notifications v1 | **Email only** (Resend) — SMS/WhatsApp in Phase 3 |
| Custom domains | **Phase 2** — deferred |
| App naming | `apps/server`, `apps/platform`, `apps/admin` |
| Package names | `@apps/server`, `@apps/platform`, `@apps/admin` |

---

## Tech Stack

- **Monorepo:** Turborepo + Bun
- **Backend:** Hono — `apps/server` (`@apps/server`)
- **Host Dashboard:** TanStack Router + Vite + shadcn/ui — `apps/platform` (`@apps/platform`)
- **Superadmin Panel:** TanStack Router + Vite + shadcn/ui — `apps/admin` (`@apps/admin`) ← exact same scaffold as platform
- **Database:** PostgreSQL via Drizzle ORM — `packages/db`
- **Auth:** Better Auth — `packages/auth`
- **Linting:** Biome

> `apps/admin` is a **fresh copy** of the `apps/platform` scaffold — same dependencies, same structure. It has its own `package.json` with name `@apps/admin`, its own routes, its own auth context (superadmin-only). It shares `packages/ui`, `packages/db`, `packages/auth`, and `packages/env` with platform.

---

## Monorepo Structure

```
propertyos/
├── apps/
│   ├── server/                    # @apps/server — Hono API
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── auth.ts            # Better Auth handler
│   │       │   ├── properties.ts      # Property CRUD
│   │       │   ├── bookings.ts        # Booking management
│   │       │   ├── calendar.ts        # Availability engine
│   │       │   ├── staff.ts           # Staff management
│   │       │   ├── coupons.ts         # Coupon management
│   │       │   ├── payments.ts        # Gateway connect + transactions
│   │       │   ├── notifications.ts   # Notification dispatch
│   │       │   ├── public/
│   │       │   │   └── booking.ts     # Guest-facing booking API (no auth)
│   │       │   └── admin/             # Superadmin-only routes
│   │       │       ├── tenants.ts
│   │       │       ├── plans.ts
│   │       │       └── analytics.ts
│   │       ├── middleware/
│   │       │   ├── auth.ts            # Session verification
│   │       │   ├── tenant.ts          # Tenant isolation (injects tenantId)
│   │       │   └── role.ts            # Role-based access guard
│   │       └── lib/
│   │           ├── availability.ts    # Conflict detection algorithm
│   │           ├── pricing.ts         # Nightly rate + coupon calculator
│   │           ├── notify.ts          # Notification orchestrator
│   │           └── payments/          # Payment adapter system (see below)
│   │               ├── adapter.ts     # IPaymentAdapter interface
│   │               ├── razorpay.ts    # RazorpayAdapter
│   │               ├── stripe.ts      # StripeAdapter (stub for Phase 4)
│   │               └── factory.ts     # getAdapter(gateway) → IPaymentAdapter
│   │
│   ├── platform/                  # @apps/platform — Host Dashboard
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── _auth/             # /login, /register, /forgot-password
│   │       │   ├── dashboard/         # Protected: /dashboard shell
│   │       │   │   ├── index.tsx      # Overview / stats
│   │       │   │   ├── properties/    # Property list + CRUD
│   │       │   │   ├── bookings/      # All bookings + detail
│   │       │   │   ├── calendar/      # Calendar view
│   │       │   │   ├── staff/         # Staff management
│   │       │   │   ├── coupons/       # Coupon management
│   │       │   │   ├── payments/      # Connect gateway
│   │       │   │   ├── settings/      # Account settings
│   │       │   │   └── billing/       # Subscription + plan
│   │       │   └── book/              # PUBLIC: /book/:tenantSlug/:propertySlug
│   │       │       └── $tenantSlug/
│   │       │           └── $propertySlug/
│   │       │               ├── index.tsx   # Booking page (Calendly-style)
│   │       │               └── success.tsx # Post-payment confirmation page
│   │       ├── components/
│   │       │   ├── booking-page/      # All booking form sub-components
│   │       │   │   ├── PropertyHeader.tsx
│   │       │   │   ├── DateRangePicker.tsx
│   │       │   │   ├── GuestDetails.tsx
│   │       │   │   ├── PricingSummary.tsx
│   │       │   │   ├── CouponInput.tsx
│   │       │   │   └── PaymentButton.tsx
│   │       │   └── dashboard/         # Dashboard-specific components
│   │       └── lib/
│   │           └── api.ts             # Typed API client (hono/client or fetch wrapper)
│   │
│   └── admin/                     # @apps/admin — Superadmin Panel
│       └── src/
│           ├── routes/
│           │   ├── _auth/             # Superadmin-only login
│           │   └── dashboard/
│           │       ├── index.tsx      # Platform overview stats
│           │       ├── tenants/       # Tenant list + detail + suspend
│           │       ├── plans/         # Subscription plan CRUD
│           │       └── analytics/     # Platform-wide usage metrics
│           ├── components/
│           └── lib/
│               └── api.ts
│
├── packages/
│   ├── db/                        # @repo/db — Drizzle schema + migrations
│   │   └── src/
│   │       ├── schema/
│   │       │   ├── auth.ts            # Better Auth tables (users, sessions, accounts)
│   │       │   ├── tenants.ts         # tenants, tenant_subscriptions
│   │       │   ├── properties.ts      # properties
│   │       │   ├── bookings.ts        # bookings
│   │       │   ├── availability.ts    # availability_rules
│   │       │   ├── staff.ts           # staff_members
│   │       │   ├── coupons.ts         # coupons
│   │       │   ├── payments.ts        # payment_gateways, payment_transactions
│   │       │   ├── notifications.ts   # notifications_log
│   │       │   └── plans.ts           # subscription_plans
│   │       └── index.ts
│   ├── auth/                      # @repo/auth — Better Auth config
│   ├── config/                    # @repo/config — Shared Biome/TS configs
│   ├── env/                       # @repo/env — Typed environment variables
│   └── ui/                        # @repo/ui — shadcn/ui shared components
```

---

## Multi-Tenancy Architecture

**Model: Shared Database, Row-Level Tenant Isolation**

```
User logs in
  → session has { userId, tenantId, role }
  → tenantMiddleware injects c.var.tenantId into Hono context
  → every DB query is WHERE tenant_id = c.var.tenantId

Superadmin login (apps/admin)
  → session has { userId, role: 'superadmin', tenantId: null }
  → bypasses tenant middleware entirely
  → accesses /api/admin/* routes
```

**Tenant = one business account.** Owns multiple properties, staff, coupons, payment gateways.

**Booking page URL pattern:** `platform.propertyos.com/book/{tenantSlug}/{propertySlug}`

This URL is what hosts share. It is public, no auth required. `tenantSlug` and `propertySlug` together uniquely identify a property.

---

## Payment Gateway — Adapter Architecture

This is the core of the payment system. Every gateway implements the same interface, so swapping or adding gateways never touches business logic.

### `IPaymentAdapter` interface

```typescript
// packages or apps/server/src/lib/payments/adapter.ts

export interface CreateOrderParams {
  amount: number;          // in smallest currency unit (paise for INR)
  currency: string;        // 'INR', 'USD', etc.
  bookingRef: string;      // PropertyOS booking reference (used as receipt/notes)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}

export interface OrderResult {
  orderId: string;         // gateway's order/session ID
  amount: number;
  currency: string;
  gatewayKey: string;      // public key to initialise gateway SDK on frontend
  checkoutOptions: Record<string, unknown>; // gateway-specific options for frontend
}

export interface WebhookVerifyParams {
  rawBody: string;
  signature: string;
  secret: string;
}

export interface PaymentStatus {
  gatewayPaymentId: string;
  status: 'paid' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  gatewayOrderId: string;
}

export interface IPaymentAdapter {
  readonly gatewayName: 'razorpay' | 'stripe' | 'payu';

  /** Create a payment order/intent on the gateway */
  createOrder(params: CreateOrderParams, credentials: GatewayCredentials): Promise<OrderResult>;

  /** Verify and parse an incoming webhook payload */
  verifyWebhook(params: WebhookVerifyParams): boolean;

  /** Extract payment status from a verified webhook payload */
  parseWebhookPayload(payload: unknown): PaymentStatus;

  /** Initiate a refund */
  refund?(paymentId: string, amount: number, credentials: GatewayCredentials): Promise<void>;
}

export interface GatewayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}
```

### Factory

```typescript
// apps/server/src/lib/payments/factory.ts

export function getPaymentAdapter(gateway: 'razorpay' | 'stripe' | 'payu'): IPaymentAdapter {
  switch (gateway) {
    case 'razorpay': return new RazorpayAdapter();
    case 'stripe':   return new StripeAdapter();
    case 'payu':     return new PayUAdapter();
    default:         throw new Error(`Unknown gateway: ${gateway}`);
  }
}
```

### `RazorpayAdapter` (v1 — fully implemented)

- `createOrder` → calls `POST https://api.razorpay.com/v1/orders` with tenant's `key_id`/`key_secret`
- Returns `orderId` + `gatewayKey` (key_id, public) + `checkoutOptions` (Razorpay-specific JS config)
- `verifyWebhook` → HMAC-SHA256 of rawBody with `webhookSecret`, compare to `X-Razorpay-Signature` header
- `parseWebhookPayload` → extracts from `payment.captured` event

### Future Adapters (stubbed, not implemented in v1)

- `StripeAdapter` — `createOrder` → `PaymentIntent.create`, webhook → `payment_intent.succeeded`
- `PayUAdapter` — hash-based verification, custom flow

### Credentials Security

Gateway credentials are stored encrypted in the `payment_gateways` table:
- Encrypted with AES-256-GCM using a server-side `PAYMENT_CREDENTIALS_SECRET` env var
- Never returned to the frontend in plaintext
- Decrypted server-side only when making gateway API calls

---

## Booking Page — Calendly / Cal.com Style UX

**URL:** `platform.propertyos.com/book/{tenantSlug}/{propertySlug}`

This is the crown feature — a beautiful, shareable, single-page booking experience.

### Layout Design

```
┌─────────────────────────────────────────────────────────────────┐
│  [Property Logo]     Sunrise Villa, Goa           [Hero Image]  │
│                                                                  │
│  ★★★★★  4 guests max  · 2 nights min  · ₹8,500/night           │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│   SELECT DATES       │   BOOKING SUMMARY                        │
│                      │   ──────────────────────────────         │
│   [Calendar with     │   Check-in:   Jun 10, 2025               │
│    available dates   │   Check-out:  Jun 13, 2025               │
│    highlighted,      │   3 Nights × ₹8,500       = ₹25,500     │
│    booked dates      │   Discount (SUMMER10)      = -₹2,550     │
│    greyed out,       │   Taxes (18% GST)          = ₹4,131      │
│    a la Cal.com]     │   ─────────────────────────────────      │
│                      │   Total                    = ₹27,081     │
│                      │                                          │
│   GUESTS             │   [Coupon Code ________ ] [Apply]        │
│   [- ] 2 [ +]        │                                          │
│                      │   YOUR DETAILS                           │
│                      │   Name   ________________________        │
│                      │   Email  ________________________        │
│                      │   Phone  ________________________        │
│                      │   Notes  ________________________        │
│                      │                                          │
│                      │   [  PAY ₹27,081 with Razorpay  ]       │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Booking Page Flow — Step by Step

**Step 1 — Property Load**
- GET `/api/public/properties/{tenantSlug}/{propertySlug}`
- Returns: property details, photos, pricing, amenities, form settings
- Disabled dates computed from booked ranges + blocked dates

**Step 2 — Date Selection**
- Guest picks check-in and check-out dates
- D## Database Schema

### `tenants`
```
id              uuid PK
name            text           -- Business name ("Sunrise Retreats")
slug            text UNIQUE    -- "sunrise-retreats" — used in booking URL
owner_id        uuid FK → users
plan_id         uuid FK → subscription_plans
plan_expires_at timestamp
status          enum(active, suspended, trial, cancelled)
created_at      timestamp
updated_at      timestamp
```

### `users` (Better Auth managed + custom fields)
```
id              uuid PK
email           text UNIQUE
name            text
email_verified  boolean
role            enum(owner, staff, superadmin)  -- additional field in auth schema
tenant_id       uuid FK → tenants               -- null for superadmin (strict 1-to-1)
image           text
created_at      timestamp
updated_at      timestamp
```

### `properties`
```
id              uuid PK
tenant_id       uuid FK → tenants
name            text
slug            text           -- unique per tenant ("villa-1")
description     text
address         text
city            text
state           text
country         text
cover_image_url text
images          text[]
tax_rate        integer        -- stored in basis points, e.g. 1800 for 18.00%
tax_type        enum(inclusive, exclusive) DEFAULT 'exclusive'
currency        text           -- 'INR'
check_in_time   time
check_out_time  time
amenities       jsonb
form_settings   jsonb          -- { accentColor, logoUrl, welcomeText, showSpecialRequests, tnc }
is_active       boolean
created_at      timestamp
updated_at      timestamp
```

### `room_types`
```
id              uuid PK
tenant_id       uuid FK → tenants
property_id     uuid FK → properties
name            text           -- e.g. "Deluxe Double" or "Entire Villa"
description     text
photos          text[]
quantity        int            -- physical count of rooms of this type
base_guests     int DEFAULT 2  -- included guests in base rate
max_guests      int            -- hard cap on occupancy
extra_guest_price integer      -- paise, extra guest per night
base_price      integer        -- paise, nightly rate
weekend_price   integer        -- paise, Fri/Sat override (null = same as base)
min_nights      int DEFAULT 1
max_nights      int
bed_config      jsonb          -- e.g. { king: 1, single: 1 }
amenities       jsonb
size_sqft       int
is_active       boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### `booking_links`
```
id              uuid PK
tenant_id       uuid FK → tenants
property_id     uuid FK → properties
room_type_id    uuid FK → room_types (nullable) -- null = public link for whole property
link_type       enum(public, private)
token           text UNIQUE    -- Random secure token (used for private/one-time URLs)
custom_price    integer        -- Optional custom price override in paise (null = use room type rate)
check_in_date   date           -- Optional locked dates for private link
check_out_date  date
units           integer        -- Number of units locked/booked by this link (default 1)
hold_inventory  boolean DEFAULT false -- If true, reserves inventory while active
max_uses        int            -- Optional limit (e.g. 1 for one-time links, null = unlimited)
used_count      int DEFAULT 0
expires_at      timestamp      -- Optional link expiration date/time
is_active       boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### `bookings`
```
id              uuid PK
tenant_id       uuid FK → tenants
room_type_id    uuid FK → room_types
booking_link_id uuid FK → booking_links (nullable)
booking_ref     text UNIQUE    -- "POS-2025-00142"
source          enum(direct, manual, agent, airbnb, booking_com)
units           integer DEFAULT 1

-- Guest
guest_name      text
guest_email     text
guest_phone     text
guest_count     int
special_requests text

-- Stay
check_in_date   date
check_out_date  date
nights          int            -- stored (checkout - checkin days)

-- Pricing (snapshot at booking time in paise)
base_amount     integer
discount_amount integer
tax_amount      integer
total_amount    integer
currency        text

-- Coupon
coupon_id       uuid FK → coupons (nullable)
coupon_code     text

-- Status
status          enum(pending, confirmed, checked_in, checked_out, cancelled, no_show)
payment_status  enum(unpaid, partial, paid, refunded)

-- Internal
created_by      uuid FK → users (null = online booking)
notes           text

created_at      timestamp
updated_at      timestamp
```

### `checkout_holds`
```
id              uuid PK
tenant_id       uuid FK → tenants
booking_id      uuid FK → bookings
room_type_id    uuid FK → room_types
units           integer DEFAULT 1
start_date      date
end_date        date
expires_at      timestamp      -- 10 minutes expiry window
created_at      timestamp
```

### `availability_rules`
```
id              uuid PK
tenant_id       uuid FK → tenants
room_type_id    uuid FK → room_types
rule_type       enum(blocked, custom_price, min_stay_override)
start_date      date
end_date        date
price_override  integer        -- paise, rate override
min_nights      int
blocked_quantity integer       -- number of units blocked (null = all units)
reason          text           -- "Owner stay", "Renovation"
created_by      uuid FK → users
created_at      timestamp
```

### `staff_members`
```
id              uuid PK
tenant_id       uuid FK → tenants
user_id         uuid FK → users
permissions     jsonb          -- Granular permissions: { can_edit_properties: bool, can_edit_bookings: bool, can_view_financials: bool, etc. }
property_ids    uuid[]         -- null = all properties
invited_by      uuid FK → users
invite_token    text           -- for email invite link, cleared on accept
invite_accepted boolean
created_at      timestamp
```

### `coupons`
```
id              uuid PK
tenant_id       uuid FK → tenants
property_ids    uuid[]         -- null = all properties
room_type_ids   uuid[]         -- null = all room types
code            text           -- unique per tenant
description     text
discount_type   enum(flat, percentage)
discount_value  integer        -- flat discount in paise, or percentage in basis points (e.g. 1000 for 10.00%)
min_booking_amount integer      -- paise
max_uses        int
used_count      int DEFAULT 0
valid_from      date
valid_until     date
is_active       boolean
created_at      timestamp
```

### `payment_gateways`
```
id              uuid PK
tenant_id       uuid FK → tenants
property_id     uuid FK → properties  -- null = applies to all properties of tenant
gateway         enum(razorpay, stripe, payu)
is_active       boolean
-- AES-256-GCM encrypted at rest, decrypted only server-side
config          jsonb          -- { key_id_enc, key_secret_enc, webhook_secret_enc, iv, tag }
created_at      timestamp
updated_at      timestamp
```

### `payment_transactions`
```
id              uuid PK
tenant_id       uuid FK → tenants
booking_id      uuid FK → bookings
gateway         enum(razorpay, stripe, payu)
gateway_order_id   text        -- Razorpay order_id / Stripe PaymentIntent id
gateway_payment_id text        -- Razorpay payment_id (post-capture)
amount          integer        -- paise
currency        text
status          enum(created, attempted, paid, failed, refunded)
gateway_response jsonb         -- raw webhook payload (for audit)
created_at      timestamp
updated_at      timestamp
```

### `notifications_log`
```
id              uuid PK
tenant_id       uuid FK → tenants
booking_id      uuid FK → bookings
recipient_type  enum(guest, staff, owner)
recipient_email text
channel         enum(email, sms, whatsapp)
type            enum(booking_confirmed, booking_cancelled, payment_received, check_in_reminder, check_out_reminder, payment_reminder, new_booking_alert)
status          enum(pending, sent, failed)
sent_at         timestamp
error_message   text
created_at      timestamp
```

### `subscription_plans`
```
id              uuid PK
name            text
description     text
price_monthly   integer        -- paise
price_yearly    integer        -- paise
currency        text
max_properties  int            -- null = unlimited
max_staff       int
max_bookings_per_month int
features        jsonb          -- { custom_domain, white_label, priority_support, ... }
is_active       boolean
sort_order      int
created_at      timestamp
```

### `tenant_subscriptions`
```
id              uuid PK
tenant_id       uuid FK → tenants
plan_id         uuid FK → subscription_plans
billing_cycle   enum(monthly, yearly)
status          enum(trial, active, past_due, cancelled)
trial_ends_at   timestamp
current_period_start timestamp
current_period_end   timestamp
external_subscription_id text  -- future: Stripe/Paddle sub ID
created_at      timestamp
updated_at      timestamp
```

---

## API Design

### Base: `https://api.propertyos.com`

```
/api/auth/**                         → Better Auth (login, register, sessions, verify)

/api/v1/                             → Authenticated, tenant-scoped
  properties/                        GET list, POST create
  properties/:id                     GET, PUT, DELETE
  properties/:id/room-types          GET list, POST create room type
  room-types/:id                     GET, PUT, DELETE
  room-types/:id/availability        GET rules, POST add rule, DELETE rule
  booking-links/                     GET list, POST create
  booking-links/:id                  GET, PUT, DELETE

  bookings/                          GET list (filters: property, roomType, status, date, search)
  bookings/                          POST create manual booking
  bookings/:id                       GET, PUT status, DELETE (cancel)
  bookings/export                    GET CSV/Excel download

  calendar/                          GET bookings, blocks, and holds for range (query: propertyId or roomTypeId)

  staff/                             GET list, POST invite
  staff/:id                          PUT role/access, DELETE remove

  coupons/                           GET list, POST create
  coupons/:id                        PUT, DELETE

  payments/gateways/                 GET list, POST connect
  payments/gateways/:id              PUT update, DELETE disconnect
  payments/transactions/             GET list
  payments/transactions/:id          GET detail

  notifications/                     GET log

  subscription/                      GET current plan + usage stats
  subscription/plans/                GET all available plans
  subscription/upgrade               POST (future: initiate billing)

/api/public/                         → No auth, guest-facing
  booking-links/:token               GET booking link + property & room type details
  properties/:tenantSlug/:slug       GET property info + available room types for booking page
  room-types/:id/availability        GET unavailable date ranges for date picker
  bookings/                          POST create guest booking + initiate payment order (optionally references booking_link_id)
  bookings/:id/verify-payment        POST verify gateway signature → confirm booking
  coupons/validate                   POST { code, propertyId, roomTypeId, amount } → discount result

/api/webhooks/
  :tenantId/razorpay                 POST Razorpay webhook (sig verified by adapter)
  :tenantId/stripe                   POST Stripe webhook (future)

/api/admin/                          → Superadmin only (role check: superadmin)
  tenants/                           GET list + stats
  tenants/:id                        GET detail
  tenants/:id/suspend                POST / DELETE
  tenants/:id/plan                   PUT assign plan
  plans/                             GET, POST create
  plans/:id                          PUT, DELETE
  analytics/                         GET platform-wide stats (MRR, tenants, bookings)
```

---

## Booking Conflict Detection Algorithm

```typescript
// Atomic check — run inside a DB transaction to prevent double-bookings

async function checkAvailability(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  requestedUnits: number = 1,
  excludeBookingId?: string  // for edits/modifications
): Promise<{ available: boolean; conflictReason?: string }> {

  // 1. Fetch Room Type and total physical quantity
  const roomType = await db.query.roomTypes.findFirst({
    where: eq(roomTypes.id, roomTypeId)
  });

  if (!roomType) {
    return { available: false, conflictReason: 'room_type_not_found' };
  }

  const totalQuantity = roomType.quantity;

  // 2. Generate array of night dates (Jun 10 to Jun 13 consumes nights: 10, 11, 12)
  const nights: string[] = [];
  let current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    nights.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // 3. Query active bookings overlapping the check-in/out range
  const activeBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.roomTypeId, roomTypeId),
      inArray(bookings.status, ['pending', 'confirmed', 'checked_in']),
      excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined,
      lt(bookings.checkInDate, checkOut),
      gt(bookings.checkOutDate, checkIn)
    )
  });

  // 4. Query active blocked rules (maintenance, owner stay) overlapping the range
  const activeBlocks = await db.query.availabilityRules.findMany({
    where: and(
      eq(availabilityRules.roomTypeId, roomTypeId),
      eq(availabilityRules.ruleType, 'blocked'),
      lt(availabilityRules.startDate, checkOut),
      gt(availabilityRules.endDate, checkIn)
    )
  });

  // 5. Query active, unexpired checkout holds overlapping the range
  const activeHolds = await db.query.checkoutHolds.findMany({
    where: and(
      eq(checkoutHolds.roomTypeId, roomTypeId),
      gt(checkoutHolds.expiresAt, new Date()),
      lt(checkoutHolds.startDate, checkOut),
      gt(checkoutHolds.endDate, checkIn)
    )
  });

  // 6. Query active booking links with hold_inventory enabled overlapping the range
  const activeLinkHolds = await db.query.bookingLinks.findMany({
    where: and(
      eq(bookingLinks.roomTypeId, roomTypeId),
      eq(bookingLinks.holdInventory, true),
      eq(bookingLinks.isActive, true),
      gt(bookingLinks.expiresAt, new Date()),
      lt(bookingLinks.checkInDate, checkOut),
      gt(bookingLinks.checkOutDate, checkIn)
    )
  });

  // 7. Verify availability night-by-night
  for (const nightStr of nights) {
    const nightDate = new Date(nightStr);

    // Sum occupied units from bookings
    const bookingsCount = activeBookings
      .filter(b => b.checkInDate <= nightDate && b.checkOutDate > nightDate)
      .reduce((sum, b) => sum + (b.units || 1), 0);

    // Sum blocked units from availability rules
    const blocksCount = activeBlocks
      .filter(r => r.startDate <= nightDate && r.endDate > nightDate)
      .reduce((sum, r) => sum + (r.blockedQuantity !== null ? r.blockedQuantity : totalQuantity), 0);

    // Sum locked units from checkout holds
    const holdsCount = activeHolds
      .filter(h => h.startDate <= nightDate && h.endDate > nightDate)
      .reduce((sum, h) => sum + h.units, 0);

    // Sum locked units from active booking link holds
    const linkHoldsCount = activeLinkHolds
      .filter(l => l.checkInDate <= nightDate && l.checkOutDate > nightDate)
      .reduce((sum, l) => sum + (l.units || 1), 0);

    const totalOccupied = bookingsCount + blocksCount + holdsCount + linkHoldsCount;
    const remaining = totalQuantity - totalOccupied;

    if (remaining < requestedUnits) {
      return { available: false, conflictReason: 'insufficient_inventory' };
    }
  }

  return { available: true };
}

```

---

## Phased Delivery Roadmap

### Phase 1 — Core Platform [~8 weeks]

**Goal:** Hosts can register, add properties, receive manual + online bookings, view calendar, share booking link.

- [ ] Rename `apps/web` → `apps/platform`, update `package.json` name to `@apps/platform`
- [ ] Scaffold `apps/admin` as fresh copy of `apps/platform`
- [ ] Tenant onboarding: register → email verify → tenant created → trial activated
- [ ] Onboarding wizard (add property, skip payment/staff)
- [ ] Property CRUD with slug generation
- [ ] Manual booking creation form
- [ ] Unified bookings dashboard (list, search, filter)
- [ ] Booking detail view + status management
- [ ] Calendar view (month + week, color-coded)
- [ ] Date blocking from calendar
- [ ] Conflict detection engine
- [ ] **Public booking page** — Calendly-style UX (NO payment yet — create pending booking + pay later flow)
- [ ] Shareable link + copy/share UI on dashboard
- [ ] Email notifications: booking confirmation (Resend), new booking alert to staff
- [ ] Superadmin: tenant list, tenant detail, suspend, basic plan management
- [ ] Subscription plans table + enforcement middleware
- [ ] `apps/admin`: login + all superadmin routes

### Phase 2 — Payments [~4 weeks]

**Goal:** End-to-end payment collection via guest's own Razorpay.

- [ ] Payment adapter interface (`IPaymentAdapter`)
- [ ] `RazorpayAdapter` implementation
- [ ] Gateway credentials UI (connect Razorpay in dashboard settings)
- [ ] Credential encryption at rest
- [ ] `createOrder` → Razorpay order created server-side with tenant's credentials
- [ ] Razorpay checkout widget on booking page (inline modal)
- [ ] `/api/public/bookings/:id/verify-payment` — HMAC verification + booking confirmation
- [ ] Webhook handler for Razorpay (`payment.captured` event)
- [ ] Payment transactions list in dashboard
- [ ] Manual payment recording for offline payments
- [ ] Payment confirmation email to guest
- [ ] Custom domains — **Phase 2** (subdomain routing on platform for `/book/*`)

### Phase 3 — Coupons, Staff, Export, Notifications [~3 weeks]

**Goal:** Team operations + discount capabilities.

- [ ] Coupon CRUD (dashboard)
- [ ] Coupon validation on booking page (real-time)
- [ ] Staff invite flow (email → magic link → accept → role assigned)
- [ ] Role-based access enforcement in API
- [ ] Property-level staff access restriction
- [ ] Notification log in dashboard
- [ ] SMS notifications (MSG91 or Twilio India)
- [ ] All notification triggers (check-in reminder, payment reminder, etc.)
- [ ] Booking export (CSV/Excel)
- [ ] Booking form customization per property (color, logo, welcome text, T&C)
- [ ] QR code generation for booking link
- [ ] Embed iframe snippet generator

### Phase 4 — Stripe, SaaS Billing, Superadmin Analytics [~4 weeks]

**Goal:** Full SaaS maturity — platform generates its own revenue.

- [ ] `StripeAdapter` implementation
- [ ] Stripe gateway connect in dashboard
- [ ] SaaS subscription billing (PropertyOS charges tenants) via Stripe
- [ ] Subscription webhook → plan enforcement
- [ ] Upgrade/downgrade plan UI
- [ ] Superadmin analytics dashboard (MRR, churn, top tenants, platform growth)
- [ ] Tenant impersonation for support

### Phase 5 — Growth [Future]

- Custom domains per property (`book.myresort.com`)
- WhatsApp notifications via Meta Business API or 360dialog
- iCal export + sync (Airbnb, Booking.com channel sync)
- Multi-language booking form
- Guest CRM (repeat guest tracking)
- Review collection post-checkout
- PayU gateway adapter

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Admin app | Separate `apps/admin` | Security isolation, independent deployment, clean separation |
| Booking page location | `apps/platform` at `/book/:tenantSlug/:propertySlug` | Simplest v1; custom domain routing added in Phase 2 |
| Booking UX | Calendly-style single-page | Converts better than multi-step wizard; no navigation confusion |
| Payment architecture | `IPaymentAdapter` interface + `factory.ts` | Razorpay now, Stripe/PayU without touching business logic |
| Multi-tenancy | Shared DB + `tenant_id` rows | Simple ops, lower infra cost, sufficient isolation |
| Auth | Better Auth + custom user/session/account schema | Full control, custom session mapping for custom permissions |
| Gateway credentials | AES-256-GCM encrypted JSONB | Single secret to rotate, no per-tenant Vault complexity |
| Payment flow | Server creates order → client opens widget → server verifies | Security: secret never leaves server; Razorpay best practice |
| File storage | Cloudflare R2 | Cheap egress, S3-compatible, no bandwidth costs |
| Email | Resend | Best DX, reliable, free tier generous |
| **Private Links** | Obfuscated token `book/p/{token}` | Simple sharing, hides internal database structural IDs |
| **Private Link Dates** | Locked or Flexible toggle by host | Allows custom holds or open-date promo links |
| **Link Hold Expiry** | Customizable hold release time (e.g. 24h) | Frees up held dates if guest fails to book |
| **Payment Options** | Full, Deposit, or Pay at Property | Accommodates different hospitality deposit models |
| **Anti-Fraud** | IP limits, Turnstile, Phone OTP | Multi-layered defense to block bot card-testing attacks |
| **OTP Service** | Mock in dev, custom config in Phase 3 | Speeds up development, allows platform vs host SMS gateways |
| **Refund Method** | Manual trigger, host inputs custom amount | Flexible refunds, respects local host policies |
| **SaaS Trial** | 14 days, no credit card required | Lowers friction to sign up and test the platform |
| **Suspended Tenant** | Read-only dashboard for host | Keeps host operational for current bookings but restricts growth |
| **Pricing Engine** | Day-by-day lookup with overrides | Accurate calculations matching standard OTA platforms |
| **Tax Settings** | Inclusive vs Exclusive toggle | Complies with varying regional tax structures |
| **Staff Roles** | Customizable roles + granular permissions | Enterprise-grade access control from day one |
| **Double Booking** | 10-minute transaction lock during checkout | Prevents race condition bookings between payment and webhook |
| **Onboarding** | Prominent checklist widget | Drives conversion and guides hosts to setup completion |
| **Conflict Bypass** | Host/manager override with warnings | Gives hosts flexibility to override locks manually |

---

## Deployment Architecture

```
Cloudflare DNS + CDN
  │
  ├── platform.propertyos.com → apps/platform  (Cloudflare Pages / Vercel)
  ├── admin.propertyos.com    → apps/admin     (Cloudflare Pages / Vercel)
  └── api.propertyos.com      → apps/server    (Fly.io / Railway — Bun runtime)

PostgreSQL      → Neon (serverless, scales to zero) or Railway Postgres
File Storage    → Cloudflare R2
Email           → Resend
Webhooks        → api.propertyos.com/api/webhooks/* (public, HMAC verified)

Phase 2+:
  book.{tenantSlug}.propertyos.com → Cloudflare Tunnel / subdomain wildcard → platform app
```

---

## Verification Plan

### Automated Tests
- Unit: `checkAvailability()` — overlap cases, edge cases (same day, adjacent nights)
- Unit: `IPaymentAdapter` — mock RazorpayAdapter, verify HMAC logic
- Unit: Pricing engine — nightly × nights + coupon + tax
- Integration: Full booking flow (public API, pending → payment → confirmed)
- Integration: Tenant isolation — tenant A cannot read/write tenant B data
- Integration: Webhook handler — valid + invalid signatures

### Manual QA
- Register as host → onboarding → add property → copy booking link
- Open booking link in incognito → pick dates → fill details → pay (test mode)
- Verify booking appears in dashboard + calendar correctly
- Block dates → reopen booking link → verify dates greyed out
- Superadmin: login at `admin.propertyos.com` → view tenants → suspend one
- Suspended tenant → try to access dashboard → verify blocked
