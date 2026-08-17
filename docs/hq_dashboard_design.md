# PropertyOS — Multi-Property Owner HQ Dashboard Specification

The **Owner HQ Dashboard** is the ultimate multi-property command center for property owners and managers (such as Meera or Rohan). It aggregates real-time financials, calendar availability, channel performance, and guest check-in operations across all physical locations into a single pane of glass.

---

## 1. Design System & Aesthetic (Monochrome / High Contrast)
Following the design tokens in [DESIGN.md](DESIGN.md):
- **Canvas:** Off-white canvas `#ffffff` with light-gray card overlays `#f5f5f5` and subtle `#e5e7eb` borders.
- **Typography:** Display metrics, total financial earnings, and occupancy numbers are rendered in bold, geometric **Cal Sans** with `-0.04em` tracking. Helper text, data tables, and tooltips are set in **Inter**.
- **Monochrome Charts:** Charts utilize stroke widths, dashed patterns, and grayscale fills (solid black `#111111`, slate gray `#6b7280`, light gray `#d1d5db`, and bordered hollows) to maintain a premium, uncluttered look.

---

## 2. Layout Grid (Multi-Property Blueprint)

The dashboard is structured around an asymmetric grid optimized for multi-location tracking:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Owner HQ: Portfolio Overview   [All Properties / Filter ▼]    │
│             ├───────────────────────────────────────────────────────────────┤
│  • HQ       │  [1. PORTFOLIO PERFORMANCE METRICS - Cal Sans Bold]           │
│  • Calendar │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐│
│  • Bookings │  │ Total Rev    │ │ Avg Occup.   │ │ Comm. Saved  │ │ Arrivals││
│  • Finance  │  │ ₹14,82,500   │ │ 74.2%        │ │ ₹1,88,200    │ │ 12 / 8 ││
│  • Settings │  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘│
│             │                                                               │
│             │  [2. ANALYTICS BLOCK - 8/4 Width Split]                       │
│             │  ┌──────────────────────────────┐ ┌─────────────────────────┐ │
│             │  │                              │ │                         │ │
│             │  │  A. PORTFOLIO REVENUE CHART  │ │  B. PROPERTY CONTRIBUTION│ │
│             │  │  • Stacked Bar Chart         │ │  • Donut Chart          │ │
│             │  │  • Daily / Weekly / Monthly  │ │  • Occupancy / Revenue  │ │
│             │  │                              │ │                         │ │
│             │  └──────────────────────────────┘ └─────────────────────────┘ │
│             │  [3. OPERATIONAL BLOCK - 6/6 Width Split]                     │
│             │  ┌──────────────────────────────┐ ┌─────────────────────────┐ │
│             │  │  C. LIVE CHECK-IN COCKPIT    │ │  D. CHANNEL SYNC STATUS │ │
│             │  │  • Arrivals & Departures     │ │  • OTA Real-Time Feeds  │ │
│             │  │  • Balance Payments Due      │ │  • active holds & alerts│ │
│             │  └──────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core HQ Features & Widgets

### Feature A: Portfolio Performance Metrics (Top Band)
Four high-density metric cards displaying portfolio aggregates with comparison indicators against the previous 30 days:
1. **Total Portfolio Revenue:** Aggregate earnings across all properties in paise (formatted as `₹XX,XX,XXX` for display).
2. **Average Portfolio Occupancy:** (Combined Nights Sold / Combined Total Units Available) displayed as a percentage.
3. **Commission Saved:** Total revenue captured through direct booking links multiplied by standard OTA commission rates (15%) to show the direct monetary yield of using PropertyOS.
4. **Today's Operations:** Quick ratio of **Check-ins / Check-outs** scheduled across the portfolio (e.g. `12 arrivals / 8 departures`).

### Feature B: Portfolio Revenue Chart (Mid-Left)
A stacked bar chart visualizer designed for comparison:
* **Interactive Toggles:** Switch the time scale between **Daily**, **Weekly**, or **Monthly**, and toggle between **Revenue (₹)** or **Nights Booked**.
* **Visuals:** 
  - Each vertical bar represents a time slice. The bar is stacked vertically into segments, with each segment representing a property's revenue contribution.
  - The segments are colored in high-contrast patterns (e.g., Property A is solid black `#111111`, Property B is slate `#6b7280`, Property C is light gray `#d1d5db`, and Property D uses a thin border with diagonal stripes).
  - Hovering over a segment pops up a tooltip: `[Property Name] | Revenue: ₹1,24,000 | Share: 34%`.

### Feature C: Property Share & Contribution (Mid-Right)
A clean donut chart detailing overall portfolio splits:
* **Toggle:** Switch between **Revenue Contribution** or **Occupancy Volume**.
* **Visuals:** 
  - Represents the percentage share of each property.
  - Center metric shows the dominant performer in bold Cal Sans (e.g. **Villa Goa | 42%**).

### Feature D: Live Check-in Cockpit (Bottom-Left)
A unified operations cockpit listing guest movements across all properties, sorted chronologically by time:
* **Arrivals Tab:** Lists upcoming guests. Displays check-in time, guest name, property name, room type, source badge (direct, Airbnb, Booking.com), and payment balance status. Features a one-click "Check In" button.
* **Departures Tab:** Lists checking-out guests. Displays guest status, key recovery checklist, and a "Complete Check Out & Send Review Request" button.
* **Balance Alert:** Highlights unpaid bookings in soft red text if check-in is today and payment status is `partial` or `unpaid`.

### Feature E: Channel Sync & Live Activity (Bottom-Right)
The system heartbeat monitor:
* **Live Action Log:** Shows active checkout holds currently in progress (e.g., *"Guest checking out Deluxe Suite - Coorg | 8m hold remaining"*).
* **OTA Sync Monitor:** Displays real-time heartbeat statuses for connected Airbnb and Booking.com APIs (e.g., *"Airbnb Sync: Active 2m ago. 0 conflicts"*).
* **Conflict Alerts:** In case of sync delays or double-booking threats, it highlights the conflict in high-visibility warning frames, offering an immediate resolution button.

---

## 4. Multi-Property Navigation Controls

To make the dashboard useful for owners managing diverse properties, three key navigation controls are integrated at the top of the workspace:
1. **The Global Portfolio Filter:** A dropdown at the top-right that defaults to "All Properties". Selecting a specific property (e.g. *Sunrise Villa - Goa*) instantly updates the entire dashboard—including the revenue timeline, check-in checklists, and channel feeds—to show only that property's data.
2. **Grouped Clusters:** Allows managers to group properties by geography (e.g. "Coorg Cluster", "Goa Properties") to compare regional performance.
3. **Owner Payout Panel:** For property managers who operate units on behalf of other owners, this button opens a modal showing outstanding payouts, management fee splits, and statement statuses.
