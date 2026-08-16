# PropertyOS — Product Specification

> The complete feature surface. Every module is specified here — nothing is deferred to a "later" bucket. Build order is a dependency question, answered in [MODULES.md](MODULES.md), not a scope question.

**Read [IDEA.md](IDEA.md) first** for the thesis and the customers. This document assumes it.

---

## The core model

Four nouns. Everything else hangs off them.

```
Tenant ──┬── Property ──── Room Type ──── Booking
         │      (place)     (bookable      (a guest, a room type,
         │                   thing)         a date range, N units)
         ├── Staff
         ├── Coupons
         └── Payment Gateways
```

**Tenant** — one business account. Priya's two villas, Rohan's hotel, Meera's twelve units. Owns everything below it. Every query is scoped to a tenant; this is the isolation boundary.

**Property** — a physical place with an address. Holds location, photos, brand, policies, check-in times. **A property is not bookable.**

**Room Type** — the bookable thing, with a `quantity`. Rate, occupancy limits, and minimum stay live here. Priya's villa is one room type with `quantity = 1`. Rohan's hotel has three room types with quantities 8, 6, 4.

**Booking** — a guest, a room type, a date range, and a number of units.

> **The rule that governs the whole product:** availability is always a **count**, never a boolean. "How many units of this room type are unsold on each night in this range?" Priya's villa answers 0 or 1. Rohan's Deluxe answers 0 through 6. Same question, same code, same engine. There is no separate villa path — the simple case is the general case with `quantity = 1`.

---

## 1. Tenancy & Onboarding

**Who:** every new host, once.

A signup creates a **user** and a **tenant** together. The tenant gets a `slug` (`sunrise-retreats`) which becomes part of every booking URL. Slug is claimed at signup, immutable afterward without support intervention — it's in links people have already shared.

**14-day trial, no card.** The friction of a card field at signup costs more hosts than the fraud it prevents. Trial converts on value, not on a forgotten cancellation.

**Onboarding is a checklist, not a wizard.** A wizard traps someone who wants to look around first. A persistent checklist widget on the dashboard drives the same completion without the cage:

1. Add your property
2. Add a room type and a rate ← *the minimum to have a working link*
3. Copy your booking link
4. Connect a payment gateway
5. Invite staff (skippable)
6. Connect a channel (skippable)

Steps 1–3 are the activation event. A host who copies a link is activated; everything else is expansion. The checklist stays visible until dismissed, showing progress.

**Roles at the tenant level:** `owner` (one, the signup user, can't be removed), `staff` (many, permissioned — see §11).

---

## 2. Properties

**Who:** owner, or staff with `can_edit_properties`.

A property holds everything about the *place*, none of what's *sellable*:

- Identity: name, slug (unique per tenant), description
- Location: address, city, state, country, map coordinates
- Media: cover image, gallery (ordered)
- Policy: check-in/check-out times, house rules, cancellation policy, tax rate + inclusive/exclusive
- Brand: accent color, logo, welcome text, T&C — this is what skins the booking page
- Status: active/inactive

**Slug** is generated from the name, editable at creation, locked once the link is shared. `sunrise-retreats/villa-1`.

**Taxes live at the property**, not the room type — a single property is under one tax jurisdiction. `tax_type` toggles inclusive (rate includes tax, back it out for display) vs exclusive (add on top). India needs both: GST on room tariff is exclusive, but many hosts advertise all-in numbers.

---

## 3. Room Types

**Who:** owner, or staff with `can_edit_properties`. **The most important object in the system.**

Every property has ≥1 room type. Creating a property auto-creates one ("Entire Villa", `quantity = 1`) so Priya never meets the concept — she edits a rate and gets a link. Rohan adds two more and gets inventory.

- Identity: name ("Deluxe Double"), description, photos
- **`quantity`** — how many physical units exist. **The number availability counts against.**
- Occupancy: `base_guests` (included in base rate), `max_guests` (hard cap), `extra_guest_price` (per extra guest, per night)
- Pricing: `base_price` (per night), `weekend_price` (Fri/Sat override, nullable)
- Stay rules: `min_nights`, `max_nights`
- Bed config, amenities, size — display only
- Status: active/inactive

**Changing `quantity` down below what's already booked on some night** is refused with the conflicting dates listed. We never silently create an oversell.

---

## 4. Pricing Engine

**Who:** invisible. Runs on every quote, every booking, every calendar cell.

**Day-by-day resolution, never an average.** For each night in the range, resolve the rate by precedence:

```
1. Date-range override on the room type   (availability_rules: custom_price)
2. Weekend price, if Fri/Sat and set
3. Room type base_price
```

Then per night: `rate + max(0, guests − base_guests) × extra_guest_price`. Sum the nights → **base amount**.

Then, in this order — **the order is the spec, because each step changes the next step's input**:

```
base amount
  − coupon discount        (flat, or % of base)
  = discounted base
  + tax                    (property tax_rate, if exclusive)
  = total
```

Tax computes on the **discounted** base, never the pre-discount base. Getting this backwards overcharges tax on money nobody paid.

**Every booking snapshots its pricing** — `base_amount`, `discount_amount`, `tax_amount`, `total_amount`, `currency`. A rate change next week must never mutate what a guest already agreed to. The booking is the receipt.

**Money is integer minor units** (paise) everywhere — in the DB, in the API, in the gateway call. Floats touch money at exactly one place: the display layer. This is not a preference; float arithmetic on money produces ₹0.01 discrepancies that take days to trace.

---

## 5. Availability Engine

**Who:** invisible. **The critical path — everything guest-facing sits downstream.**

**The question:** for room type R and nights N₁…Nₙ, how many units are sellable on each night?

**Per night:**

```
sellable(R, night) =
    R.quantity
  − confirmed/pending/checked_in bookings holding R that night   (sum of units)
  − units blocked by an availability rule that night
  − units blocked by an external channel (Airbnb/Booking.com) that night
  − units held by a live checkout hold that night
```

A range is bookable for `k` units iff `sellable(R, night) ≥ k` **for every night** in it. One zero night kills the range.

**Nights, not days.** A stay of Jun 10 → Jun 13 occupies nights of the 10th, 11th, 12th. It does **not** occupy the 13th. Checkout day is free for a same-day check-in. Off-by-one here produces phantom unavailability that hosts notice immediately and never forgive.

**Availability rules** apply to a room type over a date range:
- `blocked` — remove units from sale (owner stay, renovation, maintenance). Blocks `units` (default: all).
- `custom_price` — rate override
- `min_stay_override` — different minimum for a period (peak season)

**Concurrency — the double-booking race.** Two guests checking out the last Deluxe simultaneously must not both succeed. Payment takes 30+ seconds, so the check must survive that window:

1. On checkout start, write a **hold** on `(room_type, date_range, units)` with a 10-minute expiry
2. The hold is counted as unavailable by the engine above
3. Hold creation and the availability check happen in **one serialized transaction** — the check is meaningless if another writer can slip between check and write
4. Payment success → hold converts to booking. Failure/abandonment/expiry → hold released, inventory returns

Expired holds are swept continuously and treated as dead on read, so a stalled sweeper can never hold inventory hostage.

**Hosts can override.** A manager booking over a block or a full night gets a loud warning and a reason prompt, then proceeds. Real operations require it (a guest is standing at the desk). Guests can never override.

---

## 6. Calendar

**Who:** owner and staff, daily. The screen that stays open all day.

- **Month view** — per room type, each cell showing `sellable/quantity` and rate. Color-coded: available / partial / full / blocked.
- **Multi-room-type view** — room types as rows, dates as columns. Rohan's whole hotel at a glance.
- **Multi-property view** — Meera's twelve properties, occupancy per day.
- **List/agenda** — arrivals and departures for a day. The front-desk view.

**Actions inline:** drag a range to block, click a cell to set a rate override, click a booking for detail, drag to move a booking (re-runs availability, warns on conflict).

**Bookings show their source** — direct, Airbnb, Booking.com, manual, agent — because "where did this come from" is the first question when something looks wrong.

---

## 7. Booking Links

**Who:** owner and staff. **The product's signature object.**

Three kinds, one engine:

**Public link** — `/book/{tenantSlug}/{propertySlug}`. Auto-created with the property. Never expires. Shows all active room types at published rates. This is the one on Instagram.

**Private link** — `/book/p/{token}`. Random opaque token. For a specific guest or deal:
- **Custom price override** — the negotiated rate, no public discount code
- **Locked or flexible dates** — locked pins an exact range (a held quote); flexible lets them pick
- **Room type restriction** — expose only what's on offer
- **Max uses** — 1 for a one-time quote, N for a corporate allotment
- **Expiry** — a real deadline creates real urgency
- **Held inventory** (optional) — hold the dates while the guest decides, auto-releasing at a host-set window (default 24h) so a stalled deal doesn't cost a weekend

**Embed** — the same page in an iframe, for the host's own site.

**Token, never a database id, in a URL.** IDs in URLs leak structure and invite enumeration.

**Sharing surface** on every link: copy button, QR (print/reception/WhatsApp), WhatsApp share (`wa.me` prefilled), embed snippet, and a hit/conversion count.

---

## 8. The Guest Booking Page

**Who:** the guest. Public, no auth. **The single most important screen in the product** — it's what makes the promise real, and it's the one surface a guest ever judges.

Design follows [DESIGN.md](DESIGN.md) exactly: Cal Sans display / Inter body, `{colors.primary}` #111111 CTA, white canvas with `{colors.surface-card}` panels, `{rounded.lg}` cards, `{component.text-input}` fields. It should read as the Cal.com booking widget adapted to date ranges and room inventory. Host branding (accent, logo, welcome text) skins it without breaking the system.

**Layout** — two columns, mirroring `{component.hero-band}`'s 7/5 split. Left: selection. Right: a sticky summary that updates live. Single column on mobile, summary collapsing to a sticky bottom bar with total + CTA.

**The flow:**

**1. Property loads** — name, hero, gallery, amenities, policy, host branding.

**2. Dates.** A Cal.com-grade range picker. Unavailable nights are struck through — computed server-side from the availability engine across *all* room types (a night is dead only if every room type is full). Minimum stay enforced in the picker itself, not as an error after the fact.

**3. Guests.** Stepper. Drives extra-guest pricing and filters room types by `max_guests`.

**4. Room type.** *Skipped entirely when the property has one* — Priya's guests go dates → details → pay and never see the concept. When there are several, they render as cards: photo, occupancy, what's included, **live price for the selected range**, and remaining count when it's low ("Only 2 left") — honest scarcity, shown only when true.

**5. Coupon.** Validated server-side against the actual amount. Discount appears in the summary immediately.

**6. Guest details.** Name, email, phone. Special requests when the property enables it. T&C checkbox when set.

**7. Pay.** Per property, the host offers: **pay in full**, **deposit** (% or fixed, balance at property), or **pay at property** (no gateway, booking still confirmed and calendared).

Server creates a `pending` booking + a checkout hold + a gateway order, and returns what the client needs to open the gateway's own widget **inline — never a redirect**. A redirect to a gateway domain is where mobile conversion goes to die.

**8. Success.** Booking reference, summary, "add to calendar" (.ics), contact host. Confirmation email — and WhatsApp, when connected — fires immediately.

**Abandonment** — if they never pay, the hold expires and the inventory returns. The `pending` booking stays visible to the host as a lead worth chasing.

---

## 9. Payments

**Who:** owner (setup), guest (execution). **PropertyOS never touches the money.**

Funds settle **directly into the host's own gateway account.** We are not in the funds flow, we take no cut, we hold no float. This keeps us out of a licensing and trust problem we have no reason to own — and it's the literal proof of the zero-commission promise.

**Gateway adapter.** Every gateway implements one interface: create order, verify webhook, parse status, refund. Business logic never learns which gateway it's on. **Razorpay** is fully built (India, UPI, the default). **Stripe** for international hosts. **PayU** for hosts who already have it. Adding a gateway is a new adapter, not a change to booking code.

**Credentials** are AES-256-GCM encrypted at rest, decrypted server-side only at the moment of a gateway call, never returned to any frontend — not even masked back to the host who typed them. Configurable per tenant, or per property (Meera's owners may each have their own account).

**The flow, and why it's shaped this way:**

```
server creates order (secret stays server-side)
  → client opens gateway widget with the public key
  → guest pays
  → client callback → server verifies signature → booking confirmed
  → webhook arrives → server verifies signature → source of truth
```

Both the callback and the webhook confirm. **The webhook is authoritative** — callbacks are lost to closed tabs and dead batteries constantly. Both paths are **idempotent**: whichever lands second is a no-op. Without that, a guest gets two confirmation emails and a host sees a phantom double payment.

**Never trust a client-reported payment.** The signature is verified server-side, always. A payment status that arrived from a browser without a verified signature is a claim, not a fact.

**Recording money that didn't come through us:** manual payment entry (cash at property, direct UPI, bank transfer) with method, reference, and amount. Partial payments are first-class — deposits mean `payment_status` genuinely is `partial`.

**Refunds** are host-triggered, with a custom amount (full, partial, or nothing per the host's own policy — we don't legislate hospitality). Push to the gateway via the adapter, log it, notify the guest.

**Anti-fraud** — a public payment page is a card-testing target, and getting botted means gateway penalties:
- Rate limit by IP and by property
- Cloudflare Turnstile before order creation
- Phone OTP before payment, per-property toggle (mock in dev; real service configurable)
- Velocity checks — many attempts, one card, one property
- Every failed attempt logged with IP and fingerprint

---

## 10. Bookings & Front-Desk Operations

**Who:** owner and staff. Where the business is actually run.

**Lifecycle:** `pending → confirmed → checked_in → checked_out`, with `cancelled` and `no_show` as terminal exits. Payment tracks separately: `unpaid / partial / paid / refunded` — a booking can be confirmed and unpaid (pay at property), or paid and cancelled (refund pending).

**Every booking carries a `source`:** `direct` (the link), `manual` (host-entered), `agent` (travel agent, commission tracked), `airbnb` / `booking_com` (synced). Source drives reporting, commission, and the answer to "where did this come from".

**List** — search by guest/ref/phone, filter by property, room type, status, payment status, source, date range. Saved views for the ones used daily ("arriving today", "unpaid").

**Detail** — guest info, stay, pricing breakdown, payment history, notes, and a full **audit timeline**: who changed what, when. Disputes are settled by this timeline.

**Manual booking** — the phone/walk-in path. Same availability engine, same pricing engine, with override. Never a second code path — a manual booking that skips the availability check is how you oversell.

**Agent booking** — an agent record, a commission %, and a booking attributed to them. Agent-wise reporting.

**Check-in** — mark arrived, capture ID (per local requirement), take balance payment. **Check-out** — settle balance, mark out, trigger the review request.

**Modify** — change dates, room type, or guest count. Re-runs availability, re-prices, shows the delta, records who did it and why.

**Cancel** — with a reason, an optional refund per policy, and inventory released immediately.

---

## 11. Staff & Permissions

**Who:** owner (manages), staff (uses).

**Invite by email** → tokenized link → accept → account. Token single-use, expiring.

**Roles are named permission bundles, not fixed tiers.** Ship sensible defaults — Manager (everything but billing), Front Desk (bookings + check-in, no rates, no financials), Housekeeping (read-only arrivals/departures), Accountant (financials, read-only ops) — and let a tenant define their own. Fixed roles fit the org chart of the company that wrote them and nobody else's.

**Granular permissions:** view/edit properties · view/edit room types & rates · view/create/edit/cancel bookings · check-in/check-out · view financials · issue refunds · manage coupons · manage staff · manage gateways · manage channels · export data · **override availability**.

**Property scoping.** A staff member sees a set of properties, or all of them. Meera's Coorg staff never see Chikmagalur. This is enforced **server-side on every query**, not by hiding UI — a hidden button is not access control.

**Financial visibility is its own permission**, independent of booking access. Front desk needs to check a guest in without seeing what the property earns.

---

## 12. Coupons

**Who:** owner, or staff with `can_manage_coupons`.

Code (unique per tenant), flat or percentage, optional caps: minimum booking amount, maximum discount, valid date window, max total uses, max uses per guest, and scoping to specific properties or room types.

Validated server-side against the real amount at quote time and **re-validated at booking time** — a coupon that expired or exhausted while the guest sat on the page must fail closed. `used_count` increments on **confirmation**, not on validation, and releases on cancellation.

---

## 13. Notifications

**Who:** guests, hosts, staff. **Where WhatsApp becomes the distribution.**

Three channels behind one dispatcher: **email** (Resend, always on), **SMS** (transactional, OTP and reminders), **WhatsApp** (Meta Business API — templates need pre-approval, which is an external dependency with a real lead time; start it early).

**Triggers** — to guest: booking confirmed, payment received, payment failed, check-in reminder (T-24h), checkout reminder, cancellation, refund issued, balance due, review request (post-checkout). To host/staff: new booking, cancellation, payment received, payment failed, daily arrivals digest, channel sync conflict.

**Per-tenant control** over which triggers fire on which channels. Templates are editable with variables; every send is logged (channel, recipient, status, error) and visible in-dashboard. Retry with backoff on transient failure. Failures surface — a silently dead confirmation email is worse than a visible error.

---

## 14. Channel Sync

**Who:** owner, or staff with `can_manage_channels`. **The moat.**

**Channels map to a room type, not a property.** Rohan's Booking.com "Deluxe Double" listing binds to his Deluxe room type. This mapping is the whole design — get it wrong and a hotel's inventory is meaningless.

**iCal (both directions), universal:**
- **Import** — poll each connected calendar on an interval, convert external bookings into blocks against the mapped room type. They appear in the calendar as `airbnb`/`booking_com` source.
- **Export** — every room type publishes an iCal feed, so any OTA can consume our availability.

iCal is coarse — it carries dates, not rates or guest details, and it polls. It's the universal floor: it works with every OTA on day one.

**Native API** where it earns its keep — real-time push, rate sync, guest details, booking modifications. Airbnb and Booking.com first.

**Conflict is the hard part, and it's honest to say so.** Two channels can sell the same night inside one poll interval. When it happens:
1. Detect on ingest — an external booking against inventory that's already gone
2. **Never silently drop it.** It's a real guest with a real reservation.
3. Flag it loudly: dashboard alert + notification, both bookings shown, host decides
4. Log every sync action for the post-mortem

Shortening the poll interval narrows the window; it never closes it. The only real fix is native push, which is why native integrations matter beyond convenience.

**Sync log** — every poll, every change, every failure. When a host asks "why is this night blocked", the log is the answer.

---

## 15. Guest CRM

**Who:** owner and staff.

A **guest** record keyed on email/phone, accumulating across bookings: contact, stay history, lifetime value, notes, tags ("repeat", "VIP", "difficult"), preferences.

**Repeat guests are the entire zero-commission thesis** — they're exactly the people who should never be booked through an OTA again. Surface them: mark repeats on arrival, segment for a WhatsApp broadcast with a private link, spot who hasn't been back in a year.

**Reviews** — post-checkout request, private feedback to the host, optional public testimonial for the booking page.

---

## 16. Reporting & Export

**Who:** owner, or staff with `can_view_financials`.

**Dashboard:** occupancy %, ADR (average daily rate), RevPAR, revenue (booked vs collected), bookings by source — *the number that proves the pitch: revenue taken direct vs revenue taken via OTA, and the commission that didn't get paid.*

**Reports:** revenue by property/room type/period, occupancy over time, source mix, coupon performance, agent commission, tax summary (GST-shaped, for the accountant), outstanding payments.

**Export** — CSV/Excel on bookings, payments, guests, with the applied filters. **Scheduled email exports** (weekly revenue to the owner, monthly to the accountant), because the recurring report is the one that actually gets read.

---

## 17. Owner Payouts

**Who:** Meera. Managers who operate property they don't own.

An **owner** record, properties assigned to it, a commission model (% of revenue, flat per booking, or per-night fee).

**Statement per owner per period:** bookings, gross revenue, commission retained, expenses recorded against the property, net payable. Exportable, emailable, with a payment-recorded status.

Manager-specific, invisible to Priya and Rohan — but designed in now, because retrofitting a revenue split through a booking model that assumes the tenant keeps everything is a rewrite.

---

## 18. Superadmin

**Who:** us. Separate app, separate auth, separate deployment. `role: superadmin`, `tenant_id: null`, bypasses tenant scoping by design — which is exactly why it lives behind its own login on its own domain.

**Tenants** — list with health (properties, bookings, revenue, last active), detail, suspend/restore, plan assignment, trial extension.

**Suspension is read-only, not a wall.** A suspended host keeps dashboard access and their existing bookings keep working — arriving guests are not our leverage. What stops is growth: no new bookings, links return a polite unavailable page. Punish the host, never the guest.

**Impersonation** — enter a tenant's dashboard as read-only to answer "it's broken", every session logged and visible. Support is impossible without it; unlogged impersonation is a breach waiting to be discovered.

**Plans** — CRUD on subscription plans and their limits. **Analytics** — MRR, churn, trial conversion, activation rate (hosts who copied a link), feature adoption, top tenants.

---

## 19. SaaS Billing & Plan Enforcement

**Who:** us charging hosts. Note the recursion — we are the SaaS product here, and this is the one place PropertyOS *does* take money.

**Plans** carry limits: max properties, max room types, max staff, max bookings/month, max channels, and feature flags (WhatsApp, owner payouts, custom domain, white-label, API access).

**Enforcement** is server-side middleware on the create path, not a UI check. Over-limit gets a real upgrade prompt naming the limit hit. Grace over hard-stop: exceeding a booking cap warns rather than dropping a paying guest's reservation. **Never break a booking to enforce a plan** — the host's guest is not the lever.

Trial → paid conversion, upgrade/downgrade with proration, dunning on failed payment (retry, notify, then read-only — never delete), and full data export on cancellation. A host's booking data is theirs, including on the way out.

---

## Cross-cutting rules

These bind every module above. Violating one in any single place breaks the guarantee everywhere.

**Tenant isolation** — every query scoped to `tenant_id`, enforced at the data layer, never left to a caller to remember. Superadmin is the one audited exception. This is the difference between multi-tenant and a data breach.

**Money** — integer minor units everywhere. Floats only at display.

**Idempotency** — every payment and webhook path is replay-safe. Gateways retry; the network duplicates. A path that isn't idempotent isn't finished.

**Audit** — every state change on a booking, payment, rate, or permission records actor, timestamp, before/after. Disputes are settled by this log.

**Time** — store UTC, render in the property's timezone. A "check-in date" is a local calendar date, not an instant; treating it as UTC shifts arrivals across midnight and books the wrong night.

**Fail closed** — availability in doubt, coupon in doubt, payment in doubt: refuse. An unhappy guest at booking time is cheap. An oversold room at 11pm is not.

---

*Thesis: [IDEA.md](IDEA.md) · Build order: [MODULES.md](MODULES.md) · Journeys: [USER_FLOWS.md](USER_FLOWS.md) · Delivery: [ROADMAP.md](ROADMAP.md) · Technical spec: [implementation_plan.md](implementation_plan.md) · Design: [DESIGN.md](DESIGN.md)*
