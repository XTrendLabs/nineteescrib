# PropertyOS — Module Map & Build Order

> Every module in [PRODUCT.md](PRODUCT.md) is v1. Nothing here is scoped out, deferred, or "later."
>
> **This document answers one question: what has to exist before what?** That's a fact about the dependency graph, not a scoping decision. Code gets written in *some* order regardless of what a doc says — this one names the order so it isn't picked ad-hoc at 2am.

---

## The graph

```
                          ┌─────────────────┐
                          │  L0 FOUNDATION  │
                          │  db · env · ui  │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  L1 TENANCY     │
                          │  auth · tenant  │
                          │  isolation      │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  L2 INVENTORY   │
                          │  properties     │
                          │  ROOM TYPES     │
                          └────────┬────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
         ┌────────▼────────┐              ┌─────────▼────────┐
         │ L3 AVAILABILITY │◄─────────────┤   L3 PRICING     │
         │  ★ CRITICAL     │              │  day-by-day      │
         │  counting engine│              │  resolution      │
         └────────┬────────┘              └─────────┬────────┘
                  │                                 │
                  └────────────────┬────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
     │  L4 CALENDAR    │  │ L4 BOOKING LINK │  │ L4 BOOKINGS     │
     │  host-facing    │  │  + guest page   │  │  manual/ops     │
     └─────────────────┘  └────────┬────────┘  └────────┬────────┘
                                   │                    │
                          ┌────────▼────────┐           │
                          │  L5 PAYMENTS    │           │
                          │  adapter·holds  │           │
                          │  webhooks       │           │
                          └────────┬────────┘           │
                                   │                    │
                          ┌────────▼────────────────────▼────────┐
                          │      L6 NOTIFICATIONS                │
                          │      email · SMS · WhatsApp          │
                          └────────┬─────────────────────────────┘
                                   │
       ┌───────────────┬───────────┼───────────┬───────────────┐
       │               │           │           │               │
┌──────▼─────┐ ┌───────▼────┐ ┌────▼─────┐ ┌───▼──────┐ ┌──────▼─────┐
│ L7 COUPONS │ │ L7 STAFF   │ │ L7 GUEST │ │ L7 CHAN  │ │ L7 REPORT  │
│            │ │ perms      │ │ CRM      │ │ SYNC     │ │ export     │
└────────────┘ └────────────┘ └──────────┘ └──────────┘ └──────┬─────┘
                                                               │
                                                        ┌──────▼─────┐
                                                        │ L8 PAYOUTS │
                                                        └────────────┘

       ┌──────────────────────────────────────────────────┐
       │  PARALLEL TRACK — depends only on L1             │
       │  SUPERADMIN · PLANS · SAAS BILLING · ANALYTICS   │
       └──────────────────────────────────────────────────┘
```

---

## Layers

### L0 — Foundation
**`packages/db` · `packages/env` · `packages/config` · `packages/ui`**

Drizzle setup, migrations, typed env, Biome config, shadcn components themed to [DESIGN.md](DESIGN.md).

**Blocks everything.** Nothing exists without a schema.

**Design the whole schema here, in one pass.** This is the entire payoff of "no phases": room types, channel connections, owner payouts, and audit tables all get modeled now — even though their features land later. A schema designed around villas and retrofitted for hotels is a rewrite; a schema designed for both once is a migration that never happens.

---

### L1 — Tenancy & Auth
**Better Auth · tenant creation · isolation middleware · roles**

Signup → user + tenant + slug. Session carries `{ userId, tenantId, role }`. Middleware injects `tenantId`; every query is scoped by it.

**Blocks everything with a `tenant_id`** — which is everything.

**Build isolation here or never.** Retrofitting tenant scoping across 40 endpoints means finding the one that got missed, in production, when a host sees another host's bookings. The scoping belongs in the data layer, not in each caller's discipline.

---

### L2 — Properties & Room Types
**Property CRUD · slugs · **room types with `quantity`** · media · policy · tax**

**Requires:** L1
**Blocks:** availability, pricing, and therefore everything guest-facing

**The load-bearing layer.** Room types must exist here, at the bottom, with `quantity` real. Every layer above counts against it. Creating a property auto-creates one room type (`quantity = 1`) so the simple case never sees the concept — but the *model* is uniform from the first migration.

Get this wrong and L3 is unwritable without a rewrite of L2 and everything above it.

---

### L3 — Availability Engine ★
**Per-night counting · rules · checkout holds · conflict detection · serialized transactions**

**Requires:** L2 (needs `quantity` to count against)
**Blocks:** calendar, booking page, bookings, payments, channel sync

**★ The critical path.** Every guest-facing surface is downstream. Every hour here pays back across the whole product; every shortcut here is paid for in oversold rooms.

Non-negotiables, all specified in [PRODUCT.md §5](PRODUCT.md):
- Returns **counts per night**, never a boolean
- **Nights, not days** — Jun 10→13 occupies 10, 11, 12. Not the 13th.
- Holds are counted as unavailable and expire (10 min)
- Check + hold in **one serialized transaction** — a check that another writer can slip past is not a check
- Host override is a first-class path, not a bug

**Test this layer hardest.** Overlap edges, same-day turnover, adjacent stays, concurrent last-unit checkout, expired-hold sweep. The bugs here are the ones that cost a host a guest.

---

### L3 — Pricing Engine
**Day-by-day resolution · overrides · weekend · extra-guest · tax · snapshots**

**Requires:** L2 (rates live on room types)
**Blocks:** booking page, bookings
**Parallel with availability** — no dependency between them, same layer.

Resolution order and the discount-before-tax sequence are the spec ([PRODUCT.md §4](PRODUCT.md)). Integer minor units from the first line of code — money as float is a rounding bug you find six months later in a tax report.

---

### L4 — Calendar (host)
**Requires:** L3 availability, L3 pricing
Month, multi-room-type, multi-property, agenda. Inline block/override/move.

### L4 — Booking Link + Guest Page
**Requires:** L3 availability, L3 pricing
Link types (public/private/embed), tokens, share surface, and the Cal.com-grade booking page. **The showcase surface** — the one screen a guest ever judges. Renders room-type selection, or hides it at `quantity = 1` properties.

### L4 — Bookings & Ops
**Requires:** L3 availability, L3 pricing
Lifecycle, manual booking, agent booking, modify, cancel, check-in/out, audit timeline.

Manual booking runs the **same** availability and pricing engines as the guest page. A second code path that skips the check is exactly how you oversell.

---

### L5 — Payments
**Adapter interface · Razorpay · Stripe · PayU · encrypted credentials · orders · webhooks · refunds · anti-fraud**

**Requires:** L4 bookings (something to pay for), L3 availability (holds)

Adapter first, Razorpay second — build the seam before the first implementation, or the first implementation *becomes* the interface and the second one fights it.

Idempotency on both the callback and the webhook path is not optional; gateways retry, tabs close. Webhook is authoritative.

---

### L6 — Notifications
**Dispatcher · email · SMS · WhatsApp · templates · log · retry**

**Requires:** L4 bookings, L5 payments (the events worth sending)

**⚠️ Start the Meta WhatsApp Business application at L0.** Verification and template approval are external, take weeks, and are not something you can compress by working harder. The *code* belongs at L6; the *paperwork* starts on day one. This is the only item in the graph whose real dependency is a calendar, not a codebase.

---

### L7 — Expansion (parallel, all independent)

| Module | Requires | Note |
|---|---|---|
| **Coupons** | L3 pricing, L4 booking page | Validate at quote **and** re-validate at confirm |
| **Staff & permissions** | L1 | Server-side enforcement; hidden UI is not access control |
| **Guest CRM** | L4 bookings | Repeat guests are the zero-commission thesis made concrete |
| **Channel sync** | L3 availability, L2 room types | Maps to **room type**, not property. Conflict handling is the hard part |
| **Reporting & export** | L4 bookings, L5 payments | Direct-vs-OTA revenue is the number that proves the pitch |

These don't block each other. Build in whatever order the customer in front of you needs.

---

### L8 — Owner Payouts
**Requires:** L7 reporting, L4 bookings
Owner records, commission models, period statements. Meera-specific — but modeled at L0, because retrofitting a revenue split into a booking model that assumes the tenant keeps everything is a rewrite.

---

### Parallel Track — Superadmin & Billing
**Requires:** L1 only

`apps/admin`, tenant management, suspension (read-only, never a wall), impersonation (always logged), plans, plan enforcement middleware, SaaS billing, platform analytics.

**Genuinely parallel** — a second developer can build this from L1 onward without touching the booking path. Plan *enforcement* needs the create paths it guards (L2/L4), so wire the middleware when those land.

---

## The vertical slice

Before going wide, prove one thread end-to-end:

> **Sign up → create property (auto room type, `quantity = 1`) → set a rate → copy link → open incognito → pick dates → enter details → pay in Razorpay test mode → booking confirmed in calendar → confirmation email received.**

Touches L0 through L6 with one module per layer. Everything after is widening a proven thread rather than integrating a dozen unproven ones at once.

Ship this before Rohan's room types, before channel sync, before payouts. **It is the whole product in miniature**, and until it works, none of the rest has anywhere to land.

---

## Cross-cutting — build in, not on

These are properties of every layer. Retrofitting any of them is a rewrite, which is exactly why they belong in L0/L1 rather than a later hardening pass.

| Concern | Where | Why not later |
|---|---|---|
| **Tenant isolation** | L1, data layer | The one missed endpoint is found in production by a host reading someone else's bookings |
| **Money as integers** | L0 | Float money is a rounding discrepancy surfacing in a tax report months on |
| **Idempotency** | L5, every payment/webhook path | Gateways retry by design. Non-idempotent means double-charge and duplicate confirmations |
| **Audit trail** | L0 schema, written at each mutation | Cannot reconstruct history you never recorded. Disputes need it |
| **UTC + property timezone** | L0 | A check-in date is a local calendar date. Treating it as an instant shifts arrivals across midnight |
| **Fail closed** | L3, L5 | Doubt on availability or payment → refuse. A refused booking is cheap; an oversold room at 11pm is not |

---

## Reading the graph

- **Depth is dependency, not priority.** L7 modules aren't lesser — they're unbuildable before what they stand on.
- **Same layer = parallel.** Availability and pricing are both L3 and don't touch each other.
- **Nothing is cut.** Every box ships. The graph says *when it can start*, never *whether it happens*.
- **One arrow matters most:** L2 room types → L3 availability. It's why room types are at the bottom and not bolted on for the first hotel.

---

*Thesis: [IDEA.md](IDEA.md) · Features: [PRODUCT.md](PRODUCT.md) · Journeys: [USER_FLOWS.md](USER_FLOWS.md) · Delivery: [ROADMAP.md](ROADMAP.md) · Technical spec: [implementation_plan.md](implementation_plan.md)*
