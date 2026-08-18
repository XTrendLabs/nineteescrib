# PropertyOS — Settings Page Specification

This document details the complete UI for the **Settings Page** — a unified configuration center that adapts its content based on context. In **HQ Mode** it shows organization-wide settings (company profile, billing, integrations, security). In **Property Mode** it shows property-specific configuration (taxes, policies, branding). Shared sections appear in both modes.

---

## 1. Context-Aware Behavior

The Settings page follows the same context-scoping pattern as the rest of the sidebar:

| Setting Section | HQ Mode (All Properties) | Property Mode (Single Property) |
| :--- | :--- | :--- |
| Company Profile | ✅ Visible | ❌ Hidden |
| Subscription & Billing | ✅ Visible | ❌ Hidden |
| Notifications | ✅ Visible (global defaults) | ✅ Visible (property overrides) |
| Integrations | ✅ Visible (all gateways) | ✅ Visible (this property's gateway) |
| Security & Access | ✅ Visible | ❌ Hidden |
| Property Branding | ❌ Hidden | ✅ Visible |
| Tax Configuration | ❌ Hidden | ✅ Visible |
| Booking Page Customization | ❌ Hidden | ✅ Visible |
| Danger Zone | ✅ Visible (org-level) | ✅ Visible (property-level) |

---

## 2. Page Layout — Vertical Sidebar Tab Navigation

Settings uses a **left vertical tab list** instead of horizontal tabs, giving more room for dense configuration forms. This matches the common pattern used by GitHub, Stripe, and Linear settings pages.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                   │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│  GENERAL         │  (Active section content renders here)                   │
│  ○ Company       │                                                          │
│  ○ Members       │                                                          │
│                  │                                                          │
│  BILLING         │                                                          │
│  ○ Plan & Usage  │                                                          │
│  ○ Invoices      │                                                          │
│                  │                                                          │
│  INTEGRATIONS    │                                                          │
│  ○ Payment GW    │                                                          │
│  ○ Notifications │                                                          │
│  ○ Webhooks      │                                                          │
│                  │                                                          │
│  SECURITY        │                                                          │
│  ○ Authentication│                                                          │
│  ○ Audit Log     │                                                          │
│                  │                                                          │
│  ADVANCED        │                                                          │
│  ○ Data Export   │                                                          │
│  ○ Danger Zone   │                                                          │
│                  │                                                          │
├──────────────────┴──────────────────────────────────────────────────────────┤
│  (In Property Mode, sections change to property-specific items)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. HQ Mode Settings (Organization-Level)

### Section A: Company Profile

The business identity that appears on invoices, owner statements, and legal footers.

```
┌──────────────────────────────────────────────────────────────────┐
│  Company Profile                                   [Save Changes]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BUSINESS IDENTITY                                               │
│  ┌──────────┐                                                    │
│  │  [Logo]  │  Company Name *     [ Sunrise Hospitality Pvt Ltd ]│
│  │  Upload  │  Display Name       [ Sunrise Retreats            ]│
│  └──────────┘  Slug               [ sunrise-retreats ] (locked)  │
│                                                                  │
│  REGISTERED ADDRESS                                              │
│  Address Line 1     [ 42/A Ribandar Industrial Estate           ]│
│  Address Line 2     [ Panaji                                    ]│
│  City               [ Panaji          ]  State    [ Goa         ]│
│  Country            [ India           ]  PIN      [ 403001      ]│
│                                                                  │
│  LEGAL & TAX IDENTITY                                            │
│  PAN Number         [ AABCS1234A                                ]│
│  GSTIN              [ 30AABCS1234A1ZV                           ]│
│  CIN (optional)     [ U55101GA2020PTC012345                     ]│
│                                                                  │
│  CONTACT                                                         │
│  Business Email     [ hello@sunriseretreats.in                  ]│
│  Business Phone     [ +91 832 2456789                           ]│
│  Support Email      [ support@sunriseretreats.in                ]│
│  Website            [ https://sunriseretreats.in                ]│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

| Field | Type | Notes |
| :--- | :--- | :--- |
| Company Name | Text | Legal registered name (for invoices) |
| Display Name | Text | Friendly brand name |
| Slug | Text (locked) | URL prefix. Immutable after first booking link is shared |
| Logo | File upload | Used on invoices, booking pages, and email templates |
| Registered Address | Address fields | Full 5-field Indian address |
| PAN Number | Text | For tax compliance |
| GSTIN | Text | GST registration number |
| CIN | Text | Company Identification Number (optional, for Pvt Ltd) |
| Business Email | Email | Primary contact |
| Business Phone | Tel | Primary phone |
| Support Email | Email | Guest-facing support address |
| Website | URL | External company website |

---

### Section B: Members & Invitations

Manages organization-level user accounts (distinct from Staff profiles which track personal details, attendance, and property assignments).

```
┌──────────────────────────────────────────────────────────────────┐
│  Members                                         [Invite Member +]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACTIVE MEMBERS                                                  │
│  ┌────────────┬──────────────────┬──────────┬────────┬──────────┐│
│  │ Name       │ Email            │ Role     │ Joined │ Actions  ││
│  ├────────────┼──────────────────┼──────────┼────────┼──────────┤│
│  │ Bikram S.  │ bikram@xtrend.in │ Owner    │ Mar 24 │ —        ││
│  │ Meera K.   │ meera@email.com  │ Admin    │ Jul 24 │ [⋮]      ││
│  │ Sagar P.   │ sagar@email.com  │ Member   │ Aug 24 │ [⋮]      ││
│  └────────────┴──────────────────┴──────────┴────────┴──────────┘│
│                                                                  │
│  PENDING INVITATIONS                                             │
│  ┌────────────────────────┬──────────┬──────────┬───────────────┐│
│  │ Email                  │ Role     │ Sent     │ Actions       ││
│  ├────────────────────────┼──────────┼──────────┼───────────────┤│
│  │ ravi@email.com         │ Member   │ 2d ago   │ [Resend][Revoke]│
│  └────────────────────────┴──────────┴──────────┴───────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Owner** role cannot be removed or demoted (the signup user).
- **Admin** can manage properties, staff, billing, and settings.
- **Member** has scoped access based on their staff profile permissions.
- **Three-dots menu (⋮):** Change role, remove from organization.
- **Invite modal:** Email + role selector. Sends an email invite link.

---

### Section C: Plan & Usage (SaaS Subscription)

```
┌──────────────────────────────────────────────────────────────────┐
│  Plan & Usage                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CURRENT PLAN                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🏷️ Growth Plan — ₹2,499/month                              │ │
│  │  Billing Cycle: Monthly  |  Next Renewal: Sep 18, 2025      │ │
│  │  Status: ● Active                                           │ │
│  │                               [Change Plan]  [Cancel Plan]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  USAGE LIMITS                                                    │
│  ┌─────────────────────┬────────────┬────────────┬─────────────┐│
│  │ Resource            │ Used       │ Limit      │ Bar         ││
│  ├─────────────────────┼────────────┼────────────┼─────────────┤│
│  │ Properties          │ 3          │ 5          │ ████░░      ││
│  │ Room Types          │ 8          │ 15         │ █████░░░    ││
│  │ Staff Members       │ 6          │ 10         │ ██████░░░░  ││
│  │ Bookings (this mo.) │ 42         │ 200        │ ██░░░░░░░░  ││
│  │ Channel Connections │ 1          │ 3          │ ███░░░░░░░  ││
│  └─────────────────────┴────────────┴────────────┴─────────────┘│
│                                                                  │
│  FEATURE FLAGS                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ✅ WhatsApp Notifications                                  │ │
│  │  ✅ Owner Payouts & Statements                              │ │
│  │  ❌ Custom Domain (upgrade to Pro)                           │ │
│  │  ❌ White-Label Booking Page (upgrade to Enterprise)         │ │
│  │  ❌ API Access (upgrade to Enterprise)                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Current Plan Card:** Plan name, price, billing cycle, next renewal date, and status.
- **Usage Meters:** Horizontal progress bars showing consumption against plan limits.
- **Feature Flags:** Checklist showing which features are enabled or gated behind upgrades.
- **Change Plan:** Opens a plan comparison modal with upgrade/downgrade options and proration preview.

---

### Section D: Billing Invoices (Platform Invoices)

```
┌──────────────────────────────────────────────────────────────────┐
│  Billing Invoices                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PAYMENT METHOD                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  💳 Visa ending in 4242  |  Exp: 12/26     [Update Card]    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  INVOICE HISTORY                                                 │
│  ┌──────────┬────────────┬──────────┬──────────┬───────────────┐│
│  │ Invoice  │ Date       │ Amount   │ Status   │ Actions       ││
│  ├──────────┼────────────┼──────────┼──────────┼───────────────┤│
│  │ INV-0012 │ Aug 1, 2025│ ₹2,499   │ ● Paid   │ [Download PDF]││
│  │ INV-0011 │ Jul 1, 2025│ ₹2,499   │ ● Paid   │ [Download PDF]││
│  │ INV-0010 │ Jun 1, 2025│ ₹1,999   │ ● Paid   │ [Download PDF]││
│  └──────────┴────────────┴──────────┴──────────┴───────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Payment Method:** Stored card details with update option.
- **Invoice Table:** Chronological list of platform subscription invoices with download links.

---

### Section E: Payment Gateway Integrations

```
┌──────────────────────────────────────────────────────────────────┐
│  Payment Gateways                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  These gateways process guest booking payments. Each property    │
│  can be assigned a specific gateway.                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Razorpay                                                   │ │
│  │  Status: ● Connected                                        │ │
│  │  Key ID: rzp_live_xxxxxxxxxx                                │ │
│  │  Used by: Sunrise Villa, Hilltop Retreat                    │ │
│  │                              [Test Connection] [Disconnect] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Stripe                                                     │ │
│  │  Status: ○ Not Connected                                    │ │
│  │                                              [Connect →]    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Gateway Cards:** Show connection status, API key preview, and which properties use each gateway.
- **Connect Flow:** Opens a secure form to enter API keys (key + secret), or OAuth flow for Stripe Connect.

---

### Section F: Notification Preferences

```
┌──────────────────────────────────────────────────────────────────┐
│  Notifications                                     [Save Changes]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GUEST NOTIFICATIONS (Sent to guests)                            │
│  ┌──────────────────────────────┬──────────┬──────────┬────────┐│
│  │ Event                        │ Email    │ WhatsApp │ SMS    ││
│  ├──────────────────────────────┼──────────┼──────────┼────────┤│
│  │ Booking Confirmation         │ ☑        │ ☑        │ ☐      ││
│  │ Payment Receipt              │ ☑        │ ☐        │ ☐      ││
│  │ Check-in Reminder (1 day)    │ ☑        │ ☑        │ ☐      ││
│  │ Check-out Reminder           │ ☑        │ ☐        │ ☐      ││
│  │ Post-Stay Review Request     │ ☑        │ ☑        │ ☐      ││
│  │ Cancellation Confirmation    │ ☑        │ ☐        │ ☐      ││
│  └──────────────────────────────┴──────────┴──────────┴────────┘│
│                                                                  │
│  HOST NOTIFICATIONS (Sent to you / staff)                        │
│  ┌──────────────────────────────┬──────────┬──────────┬────────┐│
│  │ Event                        │ Email    │ WhatsApp │ Push   ││
│  ├──────────────────────────────┼──────────┼──────────┼────────┤│
│  │ New Booking Received         │ ☑        │ ☑        │ ☑      ││
│  │ Payment Captured             │ ☑        │ ☐        │ ☑      ││
│  │ Cancellation Alert           │ ☑        │ ☑        │ ☑      ││
│  │ Channel Sync Conflict        │ ☑        │ ☑        │ ☑      ││
│  │ Guest Check-in Completed     │ ☐        │ ☑        │ ☐      ││
│  │ Daily Revenue Summary        │ ☑        │ ☐        │ ☐      ││
│  └──────────────────────────────┴──────────┴──────────┴────────┘│
│                                                                  │
│  WHATSAPP CONFIGURATION                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Provider:    [MSG91 ▼]                                     │ │
│  │  API Key:     [••••••••••••]                     [Update]   │ │
│  │  Sender ID:   [SUNRSE]                                      │ │
│  │  Status:      ● Active — Last sent: 2m ago                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Event × Channel Matrix:** Toggle checkboxes controlling which events trigger Email, WhatsApp, SMS, or Push notifications.
- **Guest vs Host Split:** Separate matrices for guest-facing and host-facing notifications.
- **WhatsApp Config:** Provider selection, API key entry, sender ID, and connection health indicator.

---

### Section G: Security & Authentication

```
┌──────────────────────────────────────────────────────────────────┐
│  Security                                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUTHENTICATION                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Password Policy:     [Minimum 8 characters ▼]              │ │
│  │  2FA Enforcement:     ( ○ Optional ) ( ● Required for Admin)│ │
│  │  Session Timeout:     [ 7 days ▼ ]                          │ │
│  │  OAuth Providers:     ☑ Google  ☐ Microsoft                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ACTIVE SESSIONS                                                 │
│  ┌──────────────┬─────────────────┬──────────┬─────────────────┐│
│  │ Device       │ IP Address      │ Location │ Actions         ││
│  ├──────────────┼─────────────────┼──────────┼─────────────────┤│
│  │ Chrome/Mac   │ 103.21.xxx.xxx  │ Goa, IN  │ Current Session ││
│  │ Safari/iOS   │ 49.37.xxx.xxx   │ Goa, IN  │ [Revoke]        ││
│  └──────────────┴─────────────────┴──────────┴─────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Section H: Audit Log

```
┌──────────────────────────────────────────────────────────────────┐
│  Audit Log                                [Export CSV]  [Filter ▼]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┬──────────────┬──────────────────────────┬─────────┐│
│  │ Time     │ Actor        │ Action                   │ Target  ││
│  ├──────────┼──────────────┼──────────────────────────┼─────────┤│
│  │ 10:32 AM │ Bikram S.    │ Updated room type price  │ Deluxe  ││
│  │ 09:15 AM │ Meera K.     │ Checked in guest         │ POS-102 ││
│  │ 08:47 AM │ System       │ Payment captured (RZP)   │ POS-103 ││
│  │ Yesterday│ Sagar P.     │ Marked housekeeping done │ Room 201││
│  └──────────┴──────────────┴──────────────────────────┴─────────┘│
│                                                                  │
│  [Load More ↓]                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Filterable by:** Actor, action type, date range, target entity.
- **Exportable:** CSV download of the full audit trail for compliance.

---

### Section I: Data Export

```
┌──────────────────────────────────────────────────────────────────┐
│  Data Export                                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MANUAL EXPORTS                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [ Bookings Data     ] [CSV ▼] [Date Range ▼] [Download →] │ │
│  │  [ Guest CRM Data    ] [CSV ▼] [Date Range ▼] [Download →] │ │
│  │  [ Revenue Report    ] [CSV ▼] [Date Range ▼] [Download →] │ │
│  │  [ Payment Records   ] [CSV ▼] [Date Range ▼] [Download →] │ │
│  │  [ Staff Attendance  ] [CSV ▼] [Date Range ▼] [Download →] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  SCHEDULED REPORTS                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📅 Weekly Revenue Summary                                  │ │
│  │     Every Monday 9:00 AM → bikram@xtrend.in      [Edit][×] │ │
│  │  📅 Monthly Tax Report                                      │ │
│  │     1st of each month → ca@sunriseretreats.in    [Edit][×] │ │
│  │                                                             │ │
│  │  [+ Add Scheduled Report]                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  FULL ACCOUNT EXPORT                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Download a complete export of all your data.               │ │
│  │  Includes: bookings, guests, payments, properties, staff.  │ │
│  │                                       [Request Full Export] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Manual Exports:** Select data type, format, and date range. One-click download.
- **Scheduled Reports:** Recurring email reports (weekly revenue, monthly tax summary) with configurable recipients and schedules.
- **Full Account Export:** GDPR/compliance-ready full data dump. Queued as a background job, download link sent via email.

---

### Section J: Danger Zone

```
┌──────────────────────────────────────────────────────────────────┐
│  Danger Zone                                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠️ These actions are irreversible. Proceed with extreme caution.│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TRANSFER OWNERSHIP                                         │ │
│  │  Transfer owner role to another admin member.               │ │
│  │                                       [Transfer Ownership]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  DELETE ORGANIZATION                                        │ │
│  │  Permanently delete this organization and all associated    │ │
│  │  data. Active bookings will be cancelled.                   │ │
│  │                                    [Delete Organization ☠️]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Transfer Ownership:** Reassign the owner role. Requires confirmation and re-authentication.
- **Delete Organization:** Permanent deletion with a multi-step confirmation (type org name to confirm). Triggers a full data export first.

---

## 4. Property Mode Settings

When the sidebar switcher is set to a specific property, the Settings page transforms to show property-specific configuration. These sections correspond to what already exists in the Properties detail tabs but are surfaced here for quick access:

### Property Settings Sections

| Section | What it configures |
| :--- | :--- |
| **Property Details** | Name, type, description, address, map coordinates |
| **Branding** | Logo, accent color, welcome text, T&C for the booking page |
| **Tax Configuration** | Tax rate, inclusive/exclusive, tax label, GSTIN |
| **Check-in/out Rules** | Check-in time, check-out time, ID verification toggle |
| **Cancellation Policy** | Policy type (free/moderate/strict), deadline hours, refund % |
| **House Rules** | Free-text rules, pet/smoking/event policies, security deposit |
| **Payment Gateway** | Which connected gateway this property uses |
| **Notifications** | Property-level overrides for notification preferences |
| **Danger Zone** | Deactivate property, archive property, delete property |

> [!NOTE]
> These property settings are **mirrors** of the corresponding tabs inside `/properties/:propertyId`. Editing them in Settings updates the same underlying data. The duplication exists because hosts expect to find configuration in Settings — not having it there feels like a bug.

---

## 5. Routing Structure

```
/settings                    → Redirects to /settings/company (in HQ mode)
                               or /settings/property (in Property mode)

HQ Mode:
/settings/company            → Company Profile
/settings/members            → Members & Invitations
/settings/plan               → Plan & Usage
/settings/invoices           → Billing Invoices
/settings/gateways           → Payment Gateway Integrations
/settings/notifications      → Notification Preferences
/settings/security           → Security & Authentication
/settings/audit              → Audit Log
/settings/export             → Data Export
/settings/danger             → Danger Zone

Property Mode:
/settings/property           → Property Details
/settings/branding           → Branding & Booking Page
/settings/tax                → Tax Configuration
/settings/policies           → Check-in/out & Cancellation
/settings/rules              → House Rules
/settings/gateway            → Property Payment Gateway
/settings/notifications      → Property Notification Overrides
/settings/danger             → Property Danger Zone
```
