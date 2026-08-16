# PropertyOS — The Idea

> The booking engine for people who own the property but don't own the customer.

---

## The pitch

Every villa owner, homestay host, and boutique hotel in India runs their business on someone else's terms. Airbnb and Booking.com bring the guest and take 15–20% of the money. Everything the OTA doesn't handle — the repeat guest who WhatsApps directly, the walk-in, the corporate block, the wedding party — gets managed in a spreadsheet, a paper register, or a chat thread.

PropertyOS gives those hosts their own booking infrastructure. Add your property, set your rates, and you get a link. Share it on WhatsApp, Instagram, your website, a printed QR code at reception. Guests open it, pick their dates, pay, and the booking lands in your calendar. No commission. No middleman. The link is yours.

Then it goes further: connect the OTA channels you already sell on, and PropertyOS becomes the one calendar where every booking — direct, Airbnb, Booking.com, walk-in — lives together, without double-bookings.

---

## The problem, concretely

**The commission bleeds.** A villa doing ₹18L a year through Airbnb pays roughly ₹2.7L in commission. That's not a line item — for most small hosts it's the entire margin. They know it. They all say the same thing: *"my repeat guests should just book direct."* They have no way to make that happen that doesn't involve manually quoting a price over chat and asking for a UPI transfer.

**Direct booking is a mess of chat.** The host's actual "booking system" today is: guest DMs on Instagram → host checks a spreadsheet → quotes a rate → guest asks about dates → host re-checks → guest sends a UPI screenshot → host writes it in a register. Each booking is fifteen messages. Nothing is validated. Nothing is confirmed. The screenshot might be fake.

**Two channels, one physical property, no shared brain.** The moment a host sells on Airbnb *and* takes direct bookings, they own a double-booking problem. Somebody has to remember to block the dates in both places. Somebody forgets. A guest lands at a villa that's already occupied, and it costs the host a refund, a review, and a reputation.

**Hotel software is built for hotels with an IT budget.** Cloudbeds and Hostaway solve real problems, at prices and onboarding complexity that assume a 60-room property with a revenue manager. A four-room homestay in Coorg cannot buy them, cannot configure them, and does not need 80% of what's inside.

---

## The wedge

Four things people ask us for. They are not four competing bets — they're one story in order.

| | | |
|---|---|---|
| **Zero commission** | the **promise** | *"Keep 100% of what your guests pay."* This is what gets someone to click. It's money, it's specific, and every host already feels the pain. |
| **The booking link** | the **product** | The Cal.com-grade shareable link is the thing they actually touch, share, and love. It's what makes the promise real in under ten minutes. |
| **Unified channels** | the **moat** | Once every OTA calendar flows through PropertyOS, leaving means going back to double-booking. This is what turns a tool into infrastructure. |
| **WhatsApp** | the **distribution** | Hosts already live in WhatsApp. Booking links, confirmations, reminders and payment nudges flow through the channel they never close. |

Read as a sentence: **we get you off commissions (promise), with a link you'll actually want to share (product), that becomes the only calendar you trust (moat), delivered where you already work (distribution).**

The failure mode to avoid is presenting these as a feature list. A feature list reads as unfocused to exactly the hosts we want. The promise leads; the rest is how we keep it.

---

## Who it's for

PropertyOS serves three customers with one product. They differ in scale, not in shape — which is why the core model (**room types with quantity**, see below) covers all three without forking.

### Priya — solo host, 2 villas in Goa
Lists on Airbnb, gets 40% of bookings from Instagram DMs and repeat guests. Runs her calendar in Google Sheets. Loses a weekend a year to double-bookings.

**Buys:** the link and the zero commission. Wants to send a paying link to a repeat guest in thirty seconds instead of fifteen messages.
**Uses:** properties, booking link, payments, calendar, WhatsApp confirmations.
**Model fit:** two properties, one room type each, `quantity = 1`.

### Rohan — boutique hotel, 18 rooms in Udaipur
Three room categories: 8× Standard, 6× Deluxe, 4× Suite. Two front-desk staff on rotating shifts. Sells on Booking.com, MakeMyTrip, and walk-ins. A whiteboard behind reception is the source of truth.

**Buys:** the unified calendar and front-desk ops. The commission matters, but not double-booking his Deluxe inventory matters more.
**Uses:** room types with real inventory counts, staff accounts with permissions, check-in/check-out, channel sync, manual + agent bookings.
**Model fit:** one property, three room types, quantities 8 / 6 / 4. **This is the customer that forces room types into the core.**

### Meera — villa manager, 12 units across Coorg and Chikmagalur
Manages properties she doesn't own. Each owner wants a monthly statement. Her staff should see their own properties and nothing else. She takes a 15% management cut.

**Buys:** multi-property control, per-property staff scoping, and owner payout statements.
**Uses:** everything, plus owner payouts and per-property financial permissions.
**Model fit:** 12 properties, mostly one room type each, staff scoped per property.

---

## The one decision that shapes the product

**The room type is the bookable unit. A villa is a room type with `quantity = 1`.**

This is not a schema detail — it's the core loop, and getting it wrong means rewriting the product when the first hotel signs up.

When a property *is* the bookable thing, availability is a yes/no question: *does any booking overlap these dates?* That works perfectly for Priya's villa and collapses immediately for Rohan. His guest doesn't book *the* Deluxe — they book *a* Deluxe, and there are six. Availability becomes a **count**: *how many Deluxe units are unsold on each night in this range?* Zero on any night means no.

So we model it that way everywhere, from the start:

- **Every property has one or more room types.** Priya's villa has exactly one, quantity 1. Rohan's hotel has three.
- **Rate, occupancy, and minimum stay live on the room type**, not the property. The property holds location, photos, brand, policy.
- **Availability always counts**, never merely overlaps — even when the count can only ever be 1.
- **A booking references a room type**, and the number of units booked.
- **OTA channels map to a room type.** Rohan's Booking.com "Deluxe Double" listing syncs against his Deluxe inventory, not his hotel.
- **The booking page asks which room type**, and skips the question invisibly when there's only one — so Priya never sees a concept she doesn't need.

The payoff: Priya's simple case is a special case of Rohan's general one, not a separate product. One availability engine. One pricing engine. One booking page. No migration the day a hotel signs up.

---

## Why now

**OTA commissions became politically raw.** Post-2020, hosts watched OTAs take a fifth of a shrinking pie. Direct booking went from "nice idea" to the thing every host association talks about.

**Payments got solved locally.** Razorpay and UPI made collecting money from an Indian guest trivial and near-free. The hard part of direct booking used to be *getting paid*. It isn't anymore — the hard part is now the calendar, the link, and the trust. Which is software.

**WhatsApp is the business layer.** Indian hosts don't run their business in email or a CRM. They run it in WhatsApp. A booking product that meets them there isn't a feature — it's the difference between adopted and abandoned.

**Cal.com proved the shape.** A single beautiful link that turns "when are you free?" into a confirmed, paid event is now something people understand without being taught. Nobody has built it for stays.

---

## Where we sit

| | What they do | Why a host still needs us |
|---|---|---|
| **Airbnb / Booking.com** | Bring demand. Take 15–20%. | They own the guest. Every repeat booking through them is margin the host is donating. We're the direct channel *alongside* them, not instead. |
| **Cloudbeds / Hostaway** | Real PMS + channel manager. | Priced and shaped for properties with an IT budget. Too heavy for a 4-room homestay to buy or configure. |
| **Spreadsheets + WhatsApp** | Free. Flexible. Universally used. | No validation, no payment, no confirmation, no protection from double-booking. This is the real incumbent, and the real thing to beat. |
| **Cal.com** | Not a competitor — the UX reference. | Proved a booking link can be a product people love. We're that shape, for date ranges and room inventory. |

**The honest competitive read:** we're not beating Airbnb. Airbnb generates demand we can't. We're beating *the spreadsheet* — and we win by being the place the host's own demand converts, and eventually the one calendar where every channel lands.

---

## Non-goals

Naming these keeps the product from bloating into a PMS nobody can ship.

- **We are not an OTA or marketplace.** No guest-facing search, no listings directory, no demand generation. The host brings the guest; we convert them. The day we take a cut of a booking, we're the thing we're selling against.
- **We are not a full PMS.** No housekeeping rosters, no POS, no minibar, no restaurant billing, no night audit. Rohan can want these; they're not what he's buying.
- **We are not an accounting system.** We report revenue and export cleanly. We don't do GST filing or ledgers.
- **We are not a channel manager for enterprise.** iCal-level sync plus first-class Airbnb/Booking.com. Not 200 OTA integrations.
- **We don't hold host money.** Payments settle directly into the host's own gateway account. We never sit in the funds flow — that's a licensing and trust problem we have no reason to take on.
- **We are not a website builder.** The booking link and an embeddable widget. Not a CMS.

---

## What "done" looks like

A host signs up on a Tuesday. In ten minutes they've added their property, set a rate, and copied a link. They paste it into a WhatsApp broadcast to last year's guests. That evening, three bookings are paid and sitting in their calendar, and they paid ₹0 in commission on any of them.

By month two, their Airbnb calendar is syncing into the same view, and they've stopped keeping the spreadsheet.

That's the whole product.

---

*Feature-level detail: [PRODUCT.md](PRODUCT.md) · Module map and build order: [MODULES.md](MODULES.md) · Journeys: [USER_FLOWS.md](USER_FLOWS.md) · Delivery: [ROADMAP.md](ROADMAP.md) · Technical spec: [implementation_plan.md](implementation_plan.md) · Design system: [DESIGN.md](DESIGN.md)*
