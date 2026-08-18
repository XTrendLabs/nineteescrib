# PropertyOS — Staff Management Page Specification

This document details the layout, tab structure, profile screens, attendance tracking, and database schema for the **Staff Management Page** in PropertyOS. Staff can range from caretakers and housekeepers at a single villa to multi-property managers operating across 12+ locations.

---

## 1. Aesthetic System (Aligned with DESIGN.md)
- **Staff Cards:** Clean white card panels with subtle `border-border` outlines. Avatar circles with initials (or uploaded photos) on the left.
- **Role Badges:** Compact rounded capsules:
  - `Admin`: Solid black capsule (`bg-neutral-900 text-white`).
  - `Manager`: Dark gray capsule (`bg-neutral-700 text-white`).
  - `Caretaker`: Muted slate capsule (`bg-slate-100 text-slate-700 border-slate-200`).
  - `Housekeeping`: Soft blue capsule (`bg-blue-50 text-blue-700 border-blue-200`).
- **Attendance Indicators:**
  - `Present`: Green dot (`bg-emerald-500`).
  - `Absent`: Red dot (`bg-red-500`).
  - `On Leave`: Amber dot (`bg-amber-500`).
  - `Half Day`: Split green/amber dot.

---

## 2. Page-Level Tab Structure

The Staff page uses a **top-level horizontal tab bar** beneath the page header to divide concerns cleanly:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Staff Management                                    [Invite Staff +]       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Directory ]  [ Attendance ]  [ Roles & Permissions ]                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  (Active tab content renders below)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Directory (Default)
The main staff listing and profile management interface.

### Tab 2: Attendance
Daily/monthly attendance tracker with calendar heatmaps.

### Tab 3: Roles & Permissions
Configuration panel for role definitions and property-scope access controls.

---

## 3. Tab 1 — Staff Directory

### Layout Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Search staff by name, phone...]  [Filter Role ▼]  [Filter Property ▼]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [STAFF CARDS GRID - 3 Columns on Desktop, 1 on Mobile]                    │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────┐│
│  │  [Avatar]               │  │  [Avatar]               │  │  [Avatar]    ││
│  │  Sagar Patil             │  │  Meera Krishnan         │  │  Ravi Kumar  ││
│  │  Caretaker               │  │  Manager                │  │  Housekeeping││
│  │  📍 Sunrise Villa, Goa   │  │  📍 All Properties      │  │  📍 Coorg    ││
│  │  📞 +91 98765 43210      │  │  📞 +91 87654 32109     │  │  📞 +91 765..││
│  │  ● Present               │  │  ● Present              │  │  ● On Leave  ││
│  │  [View Profile →]        │  │  [View Profile →]       │  │  [View →]    ││
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────┘│
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │  [Avatar]               │  │  [+ Invite New Staff]   │                  │
│  │  Priya Sharma            │  │                         │                  │
│  │  Front Desk              │  │  Add a team member to   │                  │
│  │  📍 Sunrise Villa, Goa   │  │  your workspace.        │                  │
│  │  📞 +91 65432 10987      │  │                         │                  │
│  │  ● Present               │  │                         │                  │
│  │  [View Profile →]        │  │                         │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Staff Card Contents
Each card in the directory grid displays:
- **Photo / Avatar Initials:** Circular thumbnail (48px). Falls back to initials if no photo is uploaded.
- **Full Name:** Bold Cal Sans heading.
- **Role Badge:** Color-coded role capsule.
- **Assigned Properties:** Lists the properties/workspaces the staff member belongs to (e.g., *"Sunrise Villa, Goa"* or *"All Properties"* for managers).
- **Phone Number:** Quick-tap callable on mobile.
- **Today's Attendance Status:** Live colored dot indicator (Present, Absent, On Leave).
- **View Profile →:** Opens the full Staff Profile side-sheet or sub-page.

---

## 4. Staff Profile Detail View (Side-Sheet or Sub-Page)

Clicking "View Profile" opens a comprehensive detail view. This can be rendered as a **right-side sheet drawer** or as a **dedicated sub-route** (`/staff/:staffId`):

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Directory                                             │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                                    │
│  │  [Photo] │  Sagar Patil                                       │
│  │  Upload  │  Caretaker · Sunrise Villa, Goa                    │
│  └──────────┘  Joined: March 2024                                │
├──────────────────────────────────────────────────────────────────┤
│  [ Personal ]  [ Documents ]  [ Workspaces ]  [ Activity Log ]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  (Sub-tab content renders below)                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Sub-Tab: Personal Information
A clean two-column form layout displaying editable fields:

| Field | Type | Notes |
| :--- | :--- | :--- |
| Full Name | Text | Required |
| Phone Number | Tel | Required. Used for WhatsApp notifications |
| Email | Email | Optional |
| Date of Birth | Date Picker | Optional |
| Gender | Select (M/F/Other) | Optional |
| Address Line 1 | Text | Street / Building |
| Address Line 2 | Text | Locality / Area |
| City | Text | |
| State | Text | |
| PIN Code | Text | 6-digit Indian postal code |
| Emergency Contact Name | Text | For safety |
| Emergency Contact Phone | Tel | |

### Sub-Tab: Documents & ID
A secure document vault for regulatory compliance (required for hotel staff in India):

| Document | Upload | Status |
| :--- | :--- | :--- |
| Aadhaar Card | File upload (front + back) | ✅ Verified / ⏳ Pending |
| PAN Card | File upload | ✅ Verified / ⏳ Pending |
| Police Verification | File upload | ✅ Verified / ⏳ Pending |
| Photo ID (Passport/DL) | File upload | ✅ Verified / ⏳ Pending |

- Each document row shows a thumbnail preview, upload date, and verification status.
- Documents are stored securely and only visible to Admin/Manager roles.

### Sub-Tab: Workspaces & Property Access
Displays which properties/workspaces the staff member is scoped to:

```
┌──────────────────────────────────────────────────────────────┐
│  ASSIGNED WORKSPACES                          [+ Assign New] │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📍 Sunrise Villa - Goa          Role: Caretaker        │ │
│  │     Access: Check-in, Housekeeping, Guest Communication │ │
│  │     Since: March 2024                    [Remove]       │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📍 Hillside Retreat - Coorg     Role: Caretaker        │ │
│  │     Access: Check-in, Housekeeping                      │ │
│  │     Since: July 2024                     [Remove]       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- Shows each property the member is assigned to with their role, specific permissions, and date of assignment.
- **"+ Assign New"** opens a modal to link the staff member to an additional property with a role and permission set.

### Sub-Tab: Activity Log
A chronological feed of actions performed by this staff member:
- *"Checked in Guest Arjun Sen at Sunrise Villa (Jun 14, 10:32 AM)"*
- *"Marked housekeeping complete for Unit 201 (Jun 14, 11:15 AM)"*
- *"Updated check-out status for Booking POS-102 (Jun 13, 11:00 AM)"*

---

## 5. Tab 2 — Attendance Tracker

### Layout Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Attendance              [◀ June 2025 ▶]         [Filter Property ▼]        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [SUMMARY ROW]                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐│
│  │ Present Today  │ │ Absent Today   │ │ On Leave       │ │ Avg Attendance ││
│  │ 6 / 8          │ │ 1              │ │ 1              │ │ 92.4%          ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘│
│                                                                             │
│  [ATTENDANCE MATRIX - Staff × Days Grid]                                    │
│  ┌────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐     │
│  │ Staff      │  1  │  2  │  3  │  4  │  5  │  6  │  7  │ ... │ 30  │     │
│  ├────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤     │
│  │ Sagar P.   │  ●  │  ●  │  ●  │  ○  │  ●  │  ◐  │  ●  │     │     │     │
│  │ Ravi K.    │  ●  │  ●  │  ◑  │  ●  │  ●  │  ●  │  ○  │     │     │     │
│  │ Priya S.   │  ●  │  ○  │  ●  │  ●  │  ●  │  ●  │  ●  │     │     │     │
│  └────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘     │
│                                                                             │
│  Legend: ● Present  ○ Absent  ◐ On Leave  ◑ Half Day                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Attendance Matrix
- **Y-Axis (Rows):** Staff member names.
- **X-Axis (Columns):** Days of the month (1-30/31).
- **Cell Content:** Color-coded dot indicators.
  - Clicking any cell toggles its state (Present → Absent → On Leave → Half Day → Present).
  - Today's column is highlighted with a subtle vertical background tint.
- **Month Navigator:** Previous/Next month buttons with a dropdown.
- **Property Filter:** Scopes the grid to a single property's staff.

### Daily Quick Mark
At the top of the attendance tab, a collapsible "**Mark Today's Attendance**" banner provides a fast checklist:
- Lists all staff with checkboxes defaulting to "Present".
- Toggle individuals to Absent / On Leave / Half Day.
- One-click "Submit" saves the day's entries.

---

## 6. Tab 3 — Roles & Permissions

### Layout Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Roles & Permissions                                 [Create Role +]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Admin                                              4 Members          ││
│  │  Full access to all properties, billing, and settings.                 ││
│  │  [View Permissions →]                                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Manager                                            2 Members          ││
│  │  Access to bookings, calendar, guests, and reports. No billing.        ││
│  │  [View Permissions →]                                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Caretaker                                          6 Members          ││
│  │  Check-in/out guests, mark housekeeping, view calendar.                ││
│  │  [View Permissions →]                                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  Housekeeping                                       3 Members          ││
│  │  View assigned units, mark cleaning status.                            ││
│  │  [View Permissions →]                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Clicking "View Permissions →" expands a permission matrix inline:          │
│  ┌──────────────────┬──────────┬─────────┬──────────┬───────┬─────────────┐│
│  │ Capability       │ Calendar │ Booking │ Guests   │ Staff │ Finance     ││
│  ├──────────────────┼──────────┼─────────┼──────────┼───────┼─────────────┤│
│  │ View             │    ✅    │   ✅    │    ✅    │   ✅  │     ✅      ││
│  │ Create / Edit    │    ✅    │   ✅    │    ✅    │   ✅  │     ✅      ││
│  │ Delete           │    ✅    │   ✅    │    ✅    │   ✅  │     ✅      ││
│  │ Export           │    ✅    │   ✅    │    ✅    │   ❌  │     ✅      ││
│  └──────────────────┴──────────┴─────────┴──────────┴───────┴─────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- Each role row lists the role name, description, and member count.
- Expanding "View Permissions" renders an inline capabilities × modules grid with toggle checkboxes.
- **"Create Role +"** opens a dialog to name a new role and configure its permission matrix.

---

## 7. Invite Staff Flow

The **"Invite Staff +"** button at the top of the page triggers a dialog modal:

```
┌──────────────────────────────────────────────────────────┐
│  Invite New Staff Member                          [  ×  ]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Full Name *         [ __________________________ ]      │
│  Phone Number *      [ __________________________ ]      │
│  Email (optional)    [ __________________________ ]      │
│                                                          │
│  Assign Role *       [ Caretaker            ▼    ]       │
│  Assign Properties * [ ☑ Sunrise Villa - Goa      ]      │
│                      [ ☐ Hillside Retreat - Coorg ]      │
│                      [ ☐ Seaside Cottage - Kerala ]      │
│                                                          │
│              [ Cancel ]          [ Send Invite ]         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- **Send Invite** dispatches an SMS/WhatsApp message with a login link.
- The invited staff member can then set up their password and complete their profile (personal info, documents, photo).

---

## 8. Proposed Database Schema

### `staff_profiles` Table
```sql
id                  uuid PK
tenant_id           uuid FK → tenants
user_id             uuid FK → users (Better Auth)
full_name           text NOT NULL
phone               text NOT NULL
email               text
date_of_birth       date
gender              text        -- 'male' | 'female' | 'other'
photo_url           text
address_line_1      text
address_line_2      text
city                text
state               text
pin_code            text
emergency_name      text
emergency_phone     text
created_at          timestamp
updated_at          timestamp
```

### `staff_documents` Table
```sql
id                  uuid PK
staff_id            uuid FK → staff_profiles
document_type       text        -- 'aadhaar' | 'pan' | 'police_verification' | 'photo_id'
document_url        text NOT NULL
file_name           text
verified            boolean DEFAULT false
uploaded_at         timestamp
verified_at         timestamp
```

### `staff_property_assignments` Table
```sql
id                  uuid PK
staff_id            uuid FK → staff_profiles
property_id         uuid FK → properties
role                text NOT NULL  -- 'admin' | 'manager' | 'caretaker' | 'housekeeping'
permissions         jsonb          -- granular capability flags
assigned_at         timestamp
```

### `attendance` Table
```sql
id                  uuid PK
staff_id            uuid FK → staff_profiles
property_id         uuid FK → properties
date                date NOT NULL
status              text NOT NULL  -- 'present' | 'absent' | 'on_leave' | 'half_day'
marked_by           uuid FK → users
created_at          timestamp
UNIQUE(staff_id, property_id, date)
```
