# PropertyOS — Delivery Roadmap

This document outlines the phased development and delivery timeline for the platform, ensuring we build and validate high-risk, load-bearing architecture first (such as the Room Type model and atomic availability engine) before layering on SaaS billing, channel syncs, and administrative extensions.

---

## The Strategic Wedge

PropertyOS is built on a specific sequence of customer adoption. We deliver value in stages, starting with a simple booking link and scaling up to complete hospitality infrastructure:

```
[ Phase 1: Zero-Commission Link ] ──> [ Phase 2: Direct Payments ] ──> [ Phase 3: Team Ops & Discounts ] ──> [ Phase 4: Platform SaaS Billing ] ──> [ Phase 5: Channel Sync & CRM ]
```

---

## Phase 1 — Core Platform & Booking Link (Weeks 1-8)
**Goal:** Solo hosts and hotels can sign up, create properties, define room types/rates, block dates on a calendar, and take direct, manual, or unpaid online bookings.

### Technical Deliverables
- **L0 Foundation:**
  - Setup Drizzle schemas, migrations, PostgreSQL local docker, and typed environment variables.
  - Setup `@repo/ui` with theme tokens (Inter/Cal Sans) following [DESIGN.md](DESIGN.md).
- **L1 Tenancy:**
  - Setup Better Auth inside `packages/auth` (strict 1-to-1 user-tenant bounds).
  - Write tenant isolation middleware in Hono API.
- **L2 Inventory:**
  - Build Property and Room Type CRUD (slug generation, photos, base rates, extra guest pricing, stay rules).
- **L3 Availability & Pricing:**
  - Implement day-by-day pricing engine (overrides, weekend rates, extra guest calculations).
  - Implement nightly counting availability engine (subtracting active bookings and blocks from room type quantity).
- **L4 Host Calendar & Dashboards:**
  - Month and multi-room-type grid calendar views.
  - CRUD for manual blocks (maintenance, owner stays) with `blocked_quantity`.
  - Manual booking entry form (using the same availability/pricing checks).
- **L4 Guest Booking Page:**
  - Calendly-style booking widget (date selection, guest stepper, client-side pricing summary).
  - Hides room-type selection if property has only one room type (villas).
  - Creates a `pending` booking (payment options: pay at property).
- **L6 Basic Notifications:**
  - resend email integration for guest confirmations and host arrival digests.

---

## Phase 2 — Inline Payments & Holds (Weeks 9-12)
**Goal:** Enable secure online payments using the host's own Razorpay account, backed by a robust concurrency hold mechanism.

### Technical Deliverables
- **Payment Adapter Core:**
  - Define `IPaymentAdapter` interface and factory in Hono.
  - Securely encrypt gateway credentials at rest (AES-256-GCM) per tenant/property.
- **Razorpay Adapter:**
  - Implement `RazorpayAdapter` (`createOrder` order payload generation, signature/webhook validation, refunds).
- **Checkout Holds:**
  - Create `checkout_holds` table.
  - Update Hono booking controller to atomically reserve units (inserting hold) inside a database transaction before initiating Razorpay checkout.
  - Cleanup scheduler to purge expired holds (10-minute cron/sweeper).
- **Inline Checkout Integration:**
  - React booking widget mounts the Razorpay SDK overlay inline (no redirects).
  - Implement `/verify-payment` endpoint and Hono webhook handler to handle page exits/payment updates.
- **Payment Operations:**
  - Dashboard transaction list and manual payment recording (for cash/direct UPI bank transfers).

---

## Phase 3 — Operations, Coupons & Team (Weeks 13-15)
**Goal:** Expand operational capabilities for team management, targeted guest acquisition, and multi-channel communications.

### Technical Deliverables
- **Coupons Engine:**
  - CRUD for Coupons (flat vs percentage, min booking amount, scoping to specific room types).
  - Server-side double-validation (at checkout start and at confirmation).
- **Granular Permissions & Staff:**
  - Invite staff via tokenized links.
  - Enforce server-side permissions (properties scoping, hiding financials from front desk, block override access).
- **Advanced Notifications:**
  - Meta WhatsApp Business API integration (templated booking alerts, pre-arrival details).
  - SMS gateway integration (MSG91 or Twilio) for OTP verification and checkout reminders.
  - Dashboard notifications log.

---

## Phase 4 — Platform SaaS Billing & Monetization (Weeks 16-19)
**Goal:** Implement subscription tiers and plan enforcement middleware, enabling PropertyOS to monetize hosts.

### Technical Deliverables
- **Platform Plans & Limits:**
  - Define subscription tiers (Starter, Pro, Enterprise) with numeric limits (max properties, max room types, max staff, bookings/month).
  - Plan enforcement middleware on Hono write controllers (fails gracefully, warning rather than dropping active guest bookings).
- **Stripe Subscription Billing:**
  - Integrate Stripe checkout for platforms to charge hosts.
  - Implement Stripe webhook handler to manage dunning, plan upgrades, and downgrades.
- **Superadmin Panel (`apps/admin`):**
  - Impersonate tenant dashboards securely (all support actions are audited and logged).
  - Suspend tenants (fails open for arriving guests; dashboard becomes read-only and no new bookings are accepted).
  - Platform metrics dashboard (MRR, active tenants, direct-vs-OTA revenue conversion).

---

## Phase 5 — Channel Sync, Payouts & CRM (Weeks 20+)
**Goal:** Establish PropertyOS as the ultimate system of record via native channel syncs, CRM integrations, and advanced property manager payouts.

### Technical Deliverables
- **Channel Sync (The Moat):**
  - 2-way iCal sync for Airbnb and Booking.com (polls on intervals, maps blocks against mapped room type inventory).
  - Real-time API channel manager integrations (pushing availability and pricing changes directly).
  - Ingestion conflict handling interface (flags double-bookings, notifies host, lets host choose resolution).
- **Owner Payouts (Meera's Flow):**
  - Monthly statement generator calculating revenue splits, management cuts, and custom deductible property expenses.
- **Guest CRM:**
  - Key guest profiles by email/phone.
  - Lifetime value calculations, repeat guest flags, and targeted private promo link generation.
