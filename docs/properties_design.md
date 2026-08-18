# PropertyOS — Properties Page Specification

This document details the complete UI for the **Properties Management Page** — the central hub for configuring physical locations, room inventories, pricing, amenities, policies, media, and booking link controls. Properties can range from a single 1-unit villa to a 50-room hotel with multiple floors, room categories, and grouped unit blocks.

---

## 1. Aesthetic System (Aligned with DESIGN.md)
- **Property Cards (Directory):** White panels with cover image thumbnail, property name in bold Cal Sans, and address in muted Inter. Subtle `border-border` borders and `hover:shadow-sm` lift.
- **Property Type Badges:** Compact rounded capsules:
  - `Hotel`: Solid black (`bg-neutral-900 text-white`).
  - `Villa`: Muted slate (`bg-slate-100 text-slate-700 border-slate-200`).
  - `Apartment`: Soft blue (`bg-blue-50 text-blue-700 border-blue-200`).
  - `Homestay`: Soft amber (`bg-amber-50 text-amber-700 border-amber-200`).
  - `Hostel`: Soft violet (`bg-violet-50 text-violet-700 border-violet-200`).
- **Room Status Tags:**
  - `Active`: Green capsule (`bg-emerald-50 text-emerald-700`).
  - `Inactive`: Muted gray capsule (`bg-neutral-100 text-neutral-500`).
  - `Under Maintenance`: Orange capsule (`bg-orange-50 text-orange-700`).

---

## 2. Page-Level Structure: Directory → Detail

The Properties section follows a **master-detail** pattern:
- **Level 1: `/properties`** — Property directory grid (listing all properties).
- **Level 2: `/properties/:propertyId`** — Property detail page with internal tab navigation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Properties                                          [+ Add Property]       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Search properties... ]            [Filter Type ▼]  [Filter Status ▼]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [PROPERTY CARDS GRID - 3 Columns]                                          │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────┐│
│  │  [Cover Image]          │  │  [Cover Image]          │  │  [Cover Img] ││
│  │  Sunrise Villa           │  │  Hilltop Retreat         │  │  City Nest   ││
│  │  🏠 Villa · Active       │  │  🏨 Hotel · Active       │  │  🏢 Apartment ││
│  │  📍 Anjuna, Goa          │  │  📍 Madikeri, Coorg      │  │  📍 Bengaluru ││
│  │  3 Room Types · 14 Units │  │  2 Room Types · 8 Units  │  │  1 RT · 1 U  ││
│  │  Occ: 72%  |  ADR: ₹4.5k│  │  Occ: 68%  |  ADR: ₹6.2k│  │  Occ: 45%   ││
│  │  [Manage →]              │  │  [Manage →]              │  │  [Manage →]  ││
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────┘│
│                                                                             │
│  ┌─────────────────────────┐                                                │
│  │  [+ Add New Property]   │                                                │
│  │                         │                                                │
│  │  Set up a new location  │                                                │
│  │  in your portfolio.     │                                                │
│  └─────────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Property Card Contents
Each card in the directory grid displays:
- **Cover Image Thumbnail:** Top of the card. Falls back to a muted placeholder gradient if no image.
- **Property Name:** Bold Cal Sans heading.
- **Type Badge + Status:** e.g. *"🏨 Hotel · Active"*.
- **Location:** City and state.
- **Inventory Summary:** Room type count and total physical unit count (e.g. *"3 Room Types · 14 Units"*).
- **Live Metrics:** Current occupancy rate and Average Daily Rate (ADR).
- **Manage →:** Opens the property detail page.

---

## 3. Property Detail Page (`/properties/:propertyId`)

Clicking "Manage →" navigates to a dedicated property management page with a **horizontal tab bar**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Properties    Sunrise Villa                    [Active ●]  [Edit Name]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Overview ]  [ Rooms & Units ]  [ Pricing ]  [ Gallery ]  [ Policies ]    │
│  [ Amenities ]  [ Booking Links ]  [ Taxes & Billing ]                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  (Active tab content renders below)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Tab 1: Overview (Property Summary Dashboard)

A quick snapshot of the property's health and configuration completeness:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [PROPERTY HERO - Cover Image + Details Side-by-Side]                       │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │                              │  │  Sunrise Villa                       │ │
│  │     [Cover Image]            │  │  🏠 Villa · Anjuna, Goa, India       │ │
│  │     [Change Cover]           │  │                                      │ │
│  │                              │  │  Address: 123 Beach Road, Anjuna,    │ │
│  │                              │  │  Bardez, Goa 403509                  │ │
│  │                              │  │  Map: [15.5937° N, 73.7425° E]      │ │
│  │                              │  │                                      │ │
│  │                              │  │  Check-in: 2:00 PM | Out: 11:00 AM  │ │
│  │                              │  │  Slug: sunrise-retreats/villa-1      │ │
│  └──────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                             │
│  [PROPERTY METRICS - 4 Columns]                                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐│
│  │ Total Units    │ │ Current Occ.   │ │ This Month Rev │ │ Direct Share   ││
│  │ 14             │ │ 72%            │ │ ₹3,82,000      │ │ 58%            ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘│
│                                                                             │
│  [SETUP COMPLETENESS CHECKLIST]                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ✅ Property details added                                             ││
│  │  ✅ Room types configured (3 types, 14 units)                          ││
│  │  ✅ Photos uploaded (12 images)                                        ││
│  │  ⚠️ Payment gateway not connected                                      ││
│  │  ⚠️ Booking link not shared yet                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Hero Section:** Cover image on the left, property identity + address on the right.
- **Metrics Row:** Total units, current occupancy, monthly revenue, and direct booking share.
- **Setup Checklist:** Persistent progress tracker showing which areas need configuration (photos, gateway, etc).

---

### Tab 2: Rooms & Units (The Core Inventory Manager)

This is the most complex and critical tab. It manages the property's physical inventory using a **hierarchical tree structure**: Property → Room Types → Floors/Groups → Individual Units.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Rooms & Units                                       [+ Add Room Type]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌── ROOM TYPE: Standard Room ─────────────────────── Qty: 6 ── Active ──┐ │
│  │                                                                        │ │
│  │  Base Rate: ₹3,500/night  |  Weekend: ₹4,500  |  Max Guests: 3        │ │
│  │  Min Stay: 1 night  |  Extra Guest: ₹800/night                        │ │
│  │                                          [Edit Room Type]  [Manage ▼] │ │
│  │                                                                        │ │
│  │  ┌─ FLOOR / GROUP ──────────────────────────────────────────────────┐  │ │
│  │  │  Ground Floor                                                    │  │ │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                    │  │ │
│  │  │  │ Room 101   │ │ Room 102   │ │ Room 103   │                    │  │ │
│  │  │  │ ● Occupied │ │ ○ Vacant   │ │ ○ Vacant   │                    │  │ │
│  │  │  │ John D.    │ │            │ │            │                    │  │ │
│  │  │  │ Jun 10-13  │ │            │ │            │                    │  │ │
│  │  │  └────────────┘ └────────────┘ └────────────┘                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─ FLOOR / GROUP ──────────────────────────────────────────────────┐  │ │
│  │  │  First Floor                                                     │  │ │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                    │  │ │
│  │  │  │ Room 201   │ │ Room 202   │ │ Room 203   │                    │  │ │
│  │  │  │ ○ Vacant   │ │ 🔧 Maint.  │ │ ● Occupied │                    │  │ │
│  │  │  │            │ │            │ │ Sarah K.   │                    │  │ │
│  │  │  │            │ │            │ │ Jun 11-15  │                    │  │ │
│  │  │  └────────────┘ └────────────┘ └────────────┘                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌── ROOM TYPE: Deluxe Suite ──────────────────────── Qty: 4 ── Active ──┐ │
│  │                                                                        │ │
│  │  Base Rate: ₹6,200/night  |  Weekend: ₹7,800  |  Max Guests: 4        │ │
│  │  Min Stay: 2 nights  |  Extra Guest: ₹1,200/night                     │ │
│  │                                          [Edit Room Type]  [Manage ▼] │ │
│  │                                                                        │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │ │
│  │  │ Suite 301  │ │ Suite 302  │ │ Suite 303  │ │ Suite 304  │          │ │
│  │  │ ● Occupied │ │ ○ Vacant   │ │ ○ Vacant   │ │ ○ Vacant   │          │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌── ROOM TYPE: Entire Villa (Private Pool) ───────── Qty: 1 ── Active ──┐ │
│  │                                                                        │ │
│  │  Base Rate: ₹18,000/night  |  Weekend: ₹22,000  |  Max Guests: 8      │ │
│  │                                          [Edit Room Type]  [Manage ▼] │ │
│  │                                                                        │ │
│  │  This room type has quantity = 1 (no individual units to display).      │ │
│  │  It operates as a single bookable unit.                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Room Type Hierarchy
The tree breaks down as:
1.  **Room Type (Category):** The bookable "product" — Deluxe, Standard, Entire Villa, Dormitory Bed, etc. Defines pricing, occupancy rules, and stay limits.
2.  **Floor / Group (Optional Organizer):** A logical grouping layer for hotels with multiple floors (e.g. Ground Floor, First Floor) or clusters (e.g. Pool Wing, Garden Wing). *This is optional — a small villa skips it entirely.*
3.  **Individual Units (Physical Rooms):** The actual rooms — Room 101, Room 102, Suite 301. Each unit can be independently:
    - Assigned to a specific booking.
    - Marked as Under Maintenance.
    - Blocked for owner stays.

#### Unit Card States
Each unit card in the grid shows its current live status:
- **Vacant (○):** White card with muted border. Available for booking.
- **Occupied (●):** Dark background with guest name and stay dates.
- **Under Maintenance (🔧):** Orange-outlined card. Blocked from bookings until cleared.
- **Blocked/Owner Stay:** Gray diagonal stripes.

#### Smart Quantity Behavior
- When a host changes `quantity` on a Room Type (e.g. 6 → 8), the system auto-generates Unit placeholders (Room 107, Room 108) that the host can rename.
- When `quantity` is reduced, the system checks if any active bookings conflict with the lower count and refuses the change if so (displaying the conflicting dates).
- For **Priya's villa** (quantity = 1), the individual unit grid is hidden entirely — the room type card displays as a single bookable entity without a unit breakdown.

---

### Tab 3: Pricing & Rate Management

A dedicated interface for managing base rates, seasonal overrides, weekend pricing, and extra-guest charges:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Pricing                                              [+ Add Rate Override] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [BASE RATES TABLE]                                                        │
│  ┌──────────────┬──────────────┬──────────────┬──────────┬────────────────┐ │
│  │ Room Type    │ Base / Night │ Weekend Rate │ Extra Gst│ Min Stay       │ │
│  ├──────────────┼──────────────┼──────────────┼──────────┼────────────────┤ │
│  │ Standard     │ ₹3,500       │ ₹4,500       │ ₹800     │ 1 night        │ │
│  │ Deluxe Suite │ ₹6,200       │ ₹7,800       │ ₹1,200   │ 2 nights       │ │
│  │ Entire Villa │ ₹18,000      │ ₹22,000      │ ₹2,000   │ 2 nights       │ │
│  └──────────────┴──────────────┴──────────────┴──────────┴────────────────┘ │
│                                                                             │
│  [SEASONAL OVERRIDES LIST]                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  🎄 Christmas Peak        Dec 20 - Jan 5     Standard: ₹5,500/night   ││
│  │                                               Deluxe: ₹9,800/night    ││
│  │                                               Min Stay: 3 nights      ││
│  │                                                        [Edit] [Delete]││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  🌧️ Monsoon Low           Jun 15 - Sep 15    Standard: ₹2,200/night   ││
│  │                                               Deluxe: ₹4,000/night    ││
│  │                                                        [Edit] [Delete]││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Base Rates Table:** Editable inline table showing each room type's default pricing.
- **Seasonal Overrides:** Named date-range blocks with custom per-room-type pricing and optional min-stay overrides. Follows the `availability_rules` pricing engine precedence.

---

### Tab 4: Gallery (Media Manager)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Gallery                                              [+ Upload Photos]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PROPERTY-LEVEL PHOTOS - Drag to Reorder]                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ [img 1]  │ │ [img 2]  │ │ [img 3]  │ │ [img 4]  │ │ [img 5]  │         │
│  │ ★ Cover  │ │          │ │          │ │          │ │          │         │
│  │ [×]      │ │ [×]      │ │ [×]      │ │ [×]      │ │ [×]      │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
│  [ROOM TYPE PHOTOS - Per Category]                                         │
│  ── Standard Room ──                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ [img 1]  │ │ [img 2]  │ │ [img 3]  │ │ [+ Add]  │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│  ── Deluxe Suite ──                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                    │
│  │ [img 1]  │ │ [img 2]  │ │ [+ Add]  │                                    │
│  └──────────┘ └──────────┘ └──────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Property-Level Gallery:** Images of the property exterior, common areas, pool, entrance. Drag-to-reorder. First image is marked as Cover (★).
- **Room-Type Galleries:** Separate photo groups per room type. These photos appear on the public booking page under each room type card.
- **Upload:** Supports bulk upload. Images are compressed and stored in object storage. Maximum recommended: 20 per property, 10 per room type.

---

### Tab 5: Policies

A form-based configuration panel:

| Field | Type | Description |
| :--- | :--- | :--- |
| Check-in Time | Time Picker | Default: 2:00 PM |
| Check-out Time | Time Picker | Default: 11:00 AM |
| Cancellation Policy | Select | Free / Moderate / Strict / Non-Refundable |
| Cancellation Deadline | Number + Unit | e.g. "48 hours before check-in" |
| Refund Percentage | Number | e.g. 50% refund if cancelled before deadline |
| House Rules | Textarea | Free-text rules displayed on the booking page |
| Pet Policy | Select | Allowed / Not Allowed / On Request |
| Smoking Policy | Select | Allowed / Not Allowed / Designated Areas |
| Event Policy | Select | Allowed / Not Allowed / On Request (with surcharge) |
| ID Verification | Toggle | Require guest ID upload at booking/check-in |
| Security Deposit | Number (paise) | Refundable deposit amount. 0 = none |

---

### Tab 6: Amenities

A categorized checkbox grid that the host fills out. These display on the public booking page:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Amenities                                                   [Save Changes] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ESSENTIALS                          KITCHEN & DINING                       │
│  ☑ WiFi                              ☑ Kitchen Access                       │
│  ☑ Air Conditioning                  ☑ Refrigerator                         │
│  ☑ Hot Water                         ☐ Washing Machine                      │
│  ☑ Power Backup                      ☐ Dishwasher                           │
│  ☐ Elevator                          ☑ Dining Area                          │
│                                                                             │
│  OUTDOOR & RECREATION                SAFETY & SECURITY                      │
│  ☑ Swimming Pool                     ☑ Fire Extinguisher                    │
│  ☑ Garden / Lawn                     ☑ First Aid Kit                        │
│  ☐ BBQ Grill                         ☑ CCTV (Common Areas)                  │
│  ☐ Gym / Fitness Center              ☑ Security Guard (24h)                 │
│  ☐ Spa / Sauna                       ☐ Safe / Locker                        │
│                                                                             │
│  PARKING & TRANSPORT                 VIEWS & SURROUNDINGS                   │
│  ☑ Free Parking                      ☑ Mountain View                        │
│  ☐ Paid Parking                      ☐ Beach Access                         │
│  ☐ Airport Shuttle                   ☐ Lake View                            │
│  ☐ EV Charging                       ☐ City View                            │
│                                                                             │
│  CUSTOM AMENITIES                                                           │
│  [+ Add Custom]  "Private Chef Available"  "Bonfire Setup"                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Predefined Categories:** Essentials, Kitchen, Outdoor, Safety, Parking, Views.
- **Custom Amenities:** Free-text entries for property-specific features (e.g. "Private Chef", "Telescope for Stargazing").

---

### Tab 7: Booking Links

Manages the direct-booking sharing interface for this property:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Booking Links                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC BOOKING PAGE                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  🌐 https://book.propertyos.in/sunrise-retreats/villa-1                ││
│  │  Status: ● Live                                     [Copy] [Preview]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  BRAND CUSTOMIZATION                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Logo:           [Upload]                                              ││
│  │  Accent Color:   [#111111 ■]                                           ││
│  │  Welcome Text:   "Welcome to Sunrise Villa — your Goa escape."         ││
│  │  Terms & Conds:  [Edit Link / Upload PDF]                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  PRIVATE DEAL LINKS (One-Time)                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Create a pre-filled link for a specific guest with custom pricing.    ││
│  │  [Generate Private Link →]                                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Public Link:** The shareable booking URL for this property. Shows live/inactive status.
- **Brand Customization:** Logo upload, accent color, welcome copy, and T&C configuration — these skin the guest-facing booking page.
- **Private Deal Links:** Quick generator for one-time custom-priced booking URLs pre-filled with guest info.

---

### Tab 8: Taxes & Billing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Taxes & Billing                                           [Save Changes]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TAX CONFIGURATION                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Tax Rate:           [ 18     ]%                                       ││
│  │  Tax Type:           ( ● Exclusive )  ( ○ Inclusive )                   ││
│  │  Tax Label:          [ GST             ]                                ││
│  │  GSTIN (optional):   [ 22AAAAA0000A1Z5 ]                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  PAYMENT GATEWAY                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Razorpay:   ● Connected  (Key: rzp_live_xxxx...)    [Disconnect]      ││
│  │  Stripe:     ○ Not Connected                         [Connect →]       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  INVOICE SETTINGS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Business Name:      [ Sunrise Hospitality Pvt Ltd   ]                  ││
│  │  Business Address:   [ 123 Beach Road, Anjuna, Goa   ]                  ││
│  │  Invoice Prefix:     [ SV-                            ]                  ││
│  │  Auto-Generate:      [✅ On booking confirmation]                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Tax Config:** Rate, inclusive/exclusive toggle, label (GST/VAT), and optional GSTIN for invoice compliance.
- **Payment Gateway:** Connect/disconnect Razorpay or Stripe accounts scoped to this property.
- **Invoice Settings:** Business entity details, prefix format, and auto-generation toggles.

---

## 4. Add Property Flow (Multi-Step Form)

Clicking **"+ Add Property"** opens a clean multi-step creation flow:

### Step 1: Basic Info
- Property Name, Property Type (Villa/Hotel/Apartment/Homestay/Hostel/Other), Description.

### Step 2: Location
- Address Line 1, Address Line 2, City, State, Country, PIN Code.
- Optional: Map pin drop for coordinates.

### Step 3: First Room Type
- Auto-creates a default room type ("Entire Property", quantity = 1).
- Host can edit the name, set quantity (1 for a villa, 6+ for a hotel), set base rate.
- For quantity > 1, prompt to name individual units or auto-generate (Room 101, 102...).

### Step 4: Cover Photo
- Upload a cover image for the property card.

### Step 5: Done → Redirect to Property Detail Page
- Redirects to the newly created property's detail page so the host can continue configuring pricing, policies, amenities, and photos.

---

## 5. Database Schema Additions

### `rooms` Table (Individual Physical Units)
```sql
id                  uuid PK
room_type_id        uuid FK → room_types
name                text NOT NULL      -- "Room 101", "Suite A", "Pool Villa"
floor_group         text               -- "Ground Floor", "First Floor", "Pool Wing" (nullable)
status              text DEFAULT 'active'  -- 'active' | 'maintenance' | 'inactive'
sort_order          integer DEFAULT 0
notes               text               -- internal notes ("AC replaced Jan 2025")
created_at          timestamp
updated_at          timestamp
```

### Additional Columns on `property` Table
```sql
-- Add to existing property table:
slug                text UNIQUE        -- "villa-1" (unique per tenant)
description         text
address_line2       text
pin_code            text
latitude            numeric
longitude           numeric
checkin_time        text DEFAULT '14:00'
checkout_time       text DEFAULT '11:00'
cancellation_policy text DEFAULT 'moderate'
cancellation_hours  integer DEFAULT 48
refund_percentage   integer DEFAULT 50
house_rules         text
pet_policy          text DEFAULT 'not_allowed'
smoking_policy      text DEFAULT 'not_allowed'
event_policy        text DEFAULT 'not_allowed'
id_required         boolean DEFAULT false
security_deposit    integer DEFAULT 0   -- paise
tax_rate            integer DEFAULT 0   -- basis points (1800 = 18%)
tax_type            text DEFAULT 'exclusive'  -- 'exclusive' | 'inclusive'
tax_label           text DEFAULT 'GST'
gstin               text
logo_url            text
accent_color        text DEFAULT '#111111'
welcome_text        text
terms_url           text
invoice_prefix      text
invoice_auto        boolean DEFAULT true
```

### `property_amenities` Table
```sql
id                  uuid PK
property_id         uuid FK → properties
amenity_key         text NOT NULL      -- 'wifi' | 'pool' | 'ac' | 'custom:private_chef'
category            text               -- 'essentials' | 'kitchen' | 'outdoor' | etc.
label               text               -- display name (only for custom amenities)
created_at          timestamp
UNIQUE(property_id, amenity_key)
```

### `property_images` Table
```sql
id                  uuid PK
property_id         uuid FK → properties
room_type_id        uuid FK → room_types (nullable — null = property-level)
url                 text NOT NULL
alt_text            text
sort_order          integer DEFAULT 0
is_cover            boolean DEFAULT false
uploaded_at         timestamp
```

### `rate_overrides` Table (Seasonal Pricing)
```sql
id                  uuid PK
room_type_id        uuid FK → room_types
label               text               -- "Christmas Peak", "Monsoon Low"
start_date          date NOT NULL
end_date            date NOT NULL
custom_price        integer            -- paise (nullable = no price change)
min_stay_override   integer            -- nights (nullable = use default)
created_at          timestamp
```
