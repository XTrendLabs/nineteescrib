# PropertyOS — Consolidated Feature List

This document provides a clean, structured, and comprehensive list of all platform features in PropertyOS. All features are aligned with the **Room Type** inventory model and **integer minor-unit pricing** architecture.

---

## 1. Core Architecture & Multi-Tenancy
- **Strict Row-Level Tenant Isolation:** Every database query is scoped to a single `tenant_id` at the data layer to prevent cross-tenant data leaks.
- **Single-Tenant User Scoping:** User accounts are strictly bound to one tenant, ensuring clean session credentials.
- **Flexible Property & Room Type Hierarchy:**
  - **Properties:** Physical locations holding identity, coordinates, gallery, brand assets (logo, accent colors), and tax jurisdiction rates.
  - **Room Types:** The actual bookable units within a property, containing physical capacity (`quantity`), occupancy caps, base/weekend/extra guest rates, and stay limits.
  - **Single-Unit Auto-Mapping:** Adding a villa automatically creates a single-unit room type (`quantity = 1`) behind the scenes to keep the user interface simple for solo hosts.

---

## 2. Platform Engines
- **Nightly Availability Engine:**
  - Performs night-by-night inventory counts (Jun 10 to Jun 13 consumes nights of 10th, 11th, and 12th; checkout day remains open for same-day check-in).
  - Deducts active bookings, maintenance blocks, checkout holds, and active booking link holds from the room type's total quantity.
- **Day-by-Day Pricing Engine:**
  - Resolves rates night-by-night based on overrides, weekend rates, and base rates.
  - Computes extra guest fees and calculates tax on the discounted base tariff to prevent tax overcharges.
- **Integer Minor-Unit Math:** All monetary records, transactions, coupons, and quotes are processed as integers (paise/cents) to eliminate float rounding discrepancies.
- **Checkout Holds Manager:**
  - Atomically locks inventory for 10 minutes during the checkout/payment process inside a serialized transaction.
  - Releases inventory automatically on expiry, transaction failure, or cart abandonment.

---

## 3. Host Dashboard & Operations
- **Interactive Calendar Views:**
  - **Month View:** Displays rates, availability ratios, and color-coded statuses (available, partial, full, blocked).
  - **Multi-Room-Type Grid:** Rohan-style hotel overview showing room types as rows and calendar dates as columns.
  - **Inline Actions:** Allows hosts to block dates, adjust rates, or drag-and-drop bookings.
- **Front-Desk Booking Management:**
  - **Walk-in/Manual Bookings:** Enables staff to book rooms manually with live availability validation.
  - **Override Access:** Authorized managers can bypass inventory locks with a mandatory warning and reason log.
  - **Booking Lifecycle:** Tracks status (`pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show`) and payment states (`unpaid`, `partial`, `paid`, `refunded`).
- **Granular Staff Permissions:**
  - Scopes staff members to specific properties (e.g. Sagar can only manage Coorg villas).
  - Hides financial data from operational roles (e.g. front-desk staff cannot view property revenue).
- **Guest CRM:**
  - Automatically builds guest histories based on email and phone numbers.
  - Tracks lifetime value, flags repeat guests, and captures private host notes.

---

## 4. Guest Booking Surface
- **Customizable Single-Page Booking Widget:**
  - Adapts to the host's brand accent colors, logo, house rules, and terms.
  - Cal.com-grade range picker with built-in minimum stay constraints.
  - Dynamic guest selector that filters eligible room types and updates extra-guest pricing in real time.
- **Scarcity Signals:** Displays honest scarcity indicators ("Only 2 rooms left") based on actual real-time inventory.
- **Post-Booking Success Page:** Presents a receipt summary, a downloadable calendar invite (`.ics`), and direct contact details.

---

## 5. Payments, Coupons, & Notifications
- **Decoupled Payment Adapter Interface (`IPaymentAdapter`):** Standardizes order creation, verification, and refunds, making gateways interchangeable.
- **Razorpay Direct Integration (v1):**
  - Connects the host's own merchant keys (encrypted at rest via AES-256-GCM).
  - Mounts the Razorpay payment widget inline inside the booking page.
  - Idempotent signature verification for both client callbacks and backend webhooks.
- **Flexible Coupons Manager:**
  - Supports flat discounts (paise) or percentages (basis points) with minimum order values, expiration dates, and room-type scoping.
- **Multi-Channel Notifications:**
  - Dispatches transactional updates to guests and alerts to hosts via Email (Resend).
  - Supports extensible templates for SMS/WhatsApp triggers.

---

## 6. SaaS Platform & Administration
- **SaaS Billing & Limits Enforcement:**
  - Restricts tenants based on subscription plan limitations (properties, staff accounts, monthly bookings).
  - Graceful degradation: prevents plan limits from breaking existing guest reservations.
- **Owner Payouts (Property Management):**
  - Generates periodic statement reports calculating commissions, deductible maintenance expenses, and final payouts to third-party owners.
- **Superadmin Panel (`apps/admin`):**
  - Audited impersonation tool for read-only host support.
  - Suspend feature that halts host growth (blocks new bookings) while keeping current guest arrivals functional.
  - Aggregated platform metrics (MRR, tenant growth, direct-vs-OTA booking splits).
