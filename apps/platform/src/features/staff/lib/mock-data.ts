/**
 * Structured mock data for the Staff Management feature.
 *
 * Staff and attendance are now backed by real tables; what remains here is
 * the demo roster the Attendance preview runs on, plus the role and permission
 * definitions, which have no tables yet.
 * Determinism follows calendar/hq-dashboard's seeded-hash approach — no
 * Math.random anywhere, so re-renders never cause data to jump around.
 */

import { addDays } from "date-fns";

/** Deterministic pseudo-random in [0, 1) seeded by a string. */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  let state = h || 1;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export type StaffRole = "admin" | "manager" | "caretaker" | "housekeeping";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  caretaker: "Caretaker",
  housekeeping: "Housekeeping",
};

export type AttendanceStatus = "present" | "absent" | "on_leave" | "half_day";

export const ATTENDANCE_LABELS: Record<AttendanceCellStatus, string> = {
  present: "Present",
  absent: "Absent",
  on_leave: "On Leave",
  half_day: "Half Day",
  unmarked: "Not Marked",
};

/** Legend order: the storable statuses, then the empty state. */
export const ATTENDANCE_CYCLE: AttendanceCellStatus[] = [
  "present",
  "absent",
  "on_leave",
  "half_day",
  "unmarked",
];

export type MockProperty = {
  id: string;
  name: string;
};

export const MOCK_PROPERTIES: MockProperty[] = [
  { id: "prop-1", name: "Sunrise Villa - Goa" },
  { id: "prop-2", name: "Hillside Retreat - Coorg" },
  { id: "prop-3", name: "Seaside Cottage - Kerala" },
  { id: "prop-4", name: "Mountain View Homestay - Manali" },
];

export type StaffDocument = {
  type: "aadhaar" | "pan" | "police_verification" | "photo_id";
  label: string;
  verified: boolean;
  uploadedAt: Date;
  fileName: string;
};

export type WorkspaceAssignment = {
  propertyId: string;
  propertyName: string;
  role: StaffRole;
  access: string[];
  since: Date;
};

export type ActivityEntry = {
  id: string;
  text: string;
  at: Date;
};

export type StaffMember = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: StaffRole;
  primaryPropertyId: string | "all";
  primaryPropertyName: string;
  todayStatus: AttendanceStatus;
  joinedAt: Date;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  photoUrl?: string;
  documents: StaffDocument[];
  workspaces: WorkspaceAssignment[];
  activity: ActivityEntry[];
  status: "active" | "pending_invite";
};

const ACCESS_BY_ROLE: Record<StaffRole, string[]> = {
  admin: ["Full Access", "Billing", "Settings"],
  manager: ["Bookings", "Calendar", "Guests", "Reports"],
  caretaker: ["Check-in", "Housekeeping", "Guest Communication"],
  housekeeping: ["Housekeeping", "Unit Status"],
};

const DOCUMENT_DEFS: Array<{
  type: StaffDocument["type"];
  label: string;
}> = [
  { type: "aadhaar", label: "Aadhaar Card" },
  { type: "pan", label: "PAN Card" },
  { type: "police_verification", label: "Police Verification" },
  { type: "photo_id", label: "Photo ID (Passport/DL)" },
];

const ACTIVITY_TEMPLATES = [
  (_name: string, prop: string) => `Checked in Guest Arjun Sen at ${prop}`,
  (_name: string, prop: string) =>
    `Marked housekeeping complete for Unit 201 at ${prop}`,
  () => "Updated check-out status for Booking POS-102",
  (_name: string, prop: string) => `Logged maintenance request at ${prop}`,
  (_name: string, prop: string) => `Checked out Guest Meera Iyer at ${prop}`,
  () => "Updated guest contact details",
];

const STAFF_SEED: Array<{
  fullName: string;
  role: StaffRole;
  primaryPropertyId: string;
  phone: string;
  email?: string;
  joinedMonthsAgo: number;
}> = [
  {
    fullName: "Sagar Patil",
    role: "caretaker",
    primaryPropertyId: "prop-1",
    phone: "9876543210",
    email: "sagar.patil@propertyos.app",
    joinedMonthsAgo: 17,
  },
  {
    fullName: "Meera Krishnan",
    role: "manager",
    primaryPropertyId: "all",
    phone: "8765432109",
    email: "meera.krishnan@propertyos.app",
    joinedMonthsAgo: 26,
  },
  {
    fullName: "Ravi Kumar",
    role: "housekeeping",
    primaryPropertyId: "prop-2",
    phone: "7654321098",
    joinedMonthsAgo: 9,
  },
  {
    fullName: "Priya Sharma",
    role: "caretaker",
    primaryPropertyId: "prop-1",
    phone: "6543210987",
    email: "priya.sharma@propertyos.app",
    joinedMonthsAgo: 12,
  },
  {
    fullName: "Arjun Nair",
    role: "admin",
    primaryPropertyId: "all",
    phone: "9988776655",
    email: "arjun.nair@propertyos.app",
    joinedMonthsAgo: 38,
  },
  {
    fullName: "Kavya Reddy",
    role: "housekeeping",
    primaryPropertyId: "prop-3",
    phone: "9123456780",
    joinedMonthsAgo: 6,
  },
  {
    fullName: "Vikram Desai",
    role: "caretaker",
    primaryPropertyId: "prop-2",
    phone: "9012345678",
    email: "vikram.desai@propertyos.app",
    joinedMonthsAgo: 21,
  },
  {
    fullName: "Ananya Rao",
    role: "manager",
    primaryPropertyId: "prop-3",
    phone: "8901234567",
    email: "ananya.rao@propertyos.app",
    joinedMonthsAgo: 15,
  },
  {
    fullName: "Farhan Ali",
    role: "housekeeping",
    primaryPropertyId: "prop-1",
    phone: "8712345690",
    joinedMonthsAgo: 4,
  },
  {
    fullName: "Ishita Verma",
    role: "caretaker",
    primaryPropertyId: "prop-4",
    phone: "8612345691",
    email: "ishita.verma@propertyos.app",
    joinedMonthsAgo: 11,
  },
];

const TODAY_STATUS_POOL: AttendanceStatus[] = [
  "present",
  "present",
  "present",
  "present",
  "absent",
  "on_leave",
];

function propertyName(id: string): string {
  if (id === "all") {
    return "All Properties";
  }
  return MOCK_PROPERTIES.find((p) => p.id === id)?.name ?? "Unknown Property";
}

function buildDocuments(staffId: string): StaffDocument[] {
  const rand = seededRandom(`docs-${staffId}`);
  return DOCUMENT_DEFS.map((def, idx) => ({
    type: def.type,
    label: def.label,
    verified: rand() > 0.35,
    uploadedAt: addDays(new Date(), -(20 + idx * 7 + Math.floor(rand() * 10))),
    fileName: `${def.type}_${staffId}.pdf`,
  }));
}

function buildWorkspaces(
  staffId: string,
  role: StaffRole,
  primaryPropertyId: string,
  joinedAt: Date,
): WorkspaceAssignment[] {
  if (primaryPropertyId === "all") {
    return MOCK_PROPERTIES.map((p, idx) => ({
      propertyId: p.id,
      propertyName: p.name,
      role,
      access: ACCESS_BY_ROLE[role],
      since: idx === 0 ? joinedAt : addDays(joinedAt, idx * 40),
    }));
  }

  const rand = seededRandom(`workspace-${staffId}`);
  const primary = MOCK_PROPERTIES.find((p) => p.id === primaryPropertyId);
  const assignments: WorkspaceAssignment[] = primary
    ? [
        {
          propertyId: primary.id,
          propertyName: primary.name,
          role,
          access: ACCESS_BY_ROLE[role],
          since: joinedAt,
        },
      ]
    : [];

  if (rand() > 0.6) {
    const secondary = MOCK_PROPERTIES.find((p) => p.id !== primaryPropertyId);
    if (secondary) {
      assignments.push({
        propertyId: secondary.id,
        propertyName: secondary.name,
        role,
        access: ACCESS_BY_ROLE[role].slice(0, 2),
        since: addDays(joinedAt, 90 + Math.floor(rand() * 120)),
      });
    }
  }

  return assignments;
}

function buildActivity(
  staffId: string,
  fullName: string,
  propertyName_: string,
): ActivityEntry[] {
  const rand = seededRandom(`activity-${staffId}`);
  const count = 5 + Math.floor(rand() * 4);
  return Array.from({ length: count }, (_, i) => {
    const template =
      ACTIVITY_TEMPLATES[Math.floor(rand() * ACTIVITY_TEMPLATES.length)];
    return {
      id: `${staffId}-act-${i}`,
      text: template(fullName, propertyName_),
      at: addDays(new Date(), -Math.floor(rand() * 14)),
    };
  }).sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function buildStaffMembers(): StaffMember[] {
  return STAFF_SEED.map((seed, idx) => {
    const id = `staff-${idx + 1}`;
    const rand = seededRandom(`staff-${id}`);
    const joinedAt = addDays(new Date(), -seed.joinedMonthsAgo * 30);
    const propName = propertyName(seed.primaryPropertyId);

    return {
      id,
      fullName: seed.fullName,
      phone: seed.phone,
      email: seed.email,
      role: seed.role,
      primaryPropertyId: seed.primaryPropertyId as string | "all",
      primaryPropertyName: propName,
      todayStatus:
        TODAY_STATUS_POOL[Math.floor(rand() * TODAY_STATUS_POOL.length)],
      joinedAt,
      dateOfBirth: addDays(new Date(1985, 0, 1), Math.floor(rand() * 5000)),
      gender: rand() > 0.5 ? "male" : "female",
      addressLine1: `${10 + Math.floor(rand() * 90)}, Lake View Road`,
      addressLine2: "Near Market Square",
      city: propName.split(" - ")[1] ?? "Panaji",
      state: "Goa",
      pinCode: `40${300 + Math.floor(rand() * 600)}`,
      emergencyName: `${seed.fullName.split(" ")[0]}'s Family Contact`,
      emergencyPhone: `9${Math.floor(100000000 + rand() * 899999999)}`,
      documents: buildDocuments(id),
      workspaces: buildWorkspaces(
        id,
        seed.role,
        seed.primaryPropertyId,
        joinedAt,
      ),
      activity: buildActivity(id, seed.fullName, propName),
      status: "active",
    };
  });
}

/** One stored attendance exception, as returned by the API. */
export type AttendanceRecord = {
  staffId: string;
  date: string; // yyyy-MM-dd
  status: AttendanceStatus;
  reason?: string | null;
  organizationId?: string | null;
};

/**
 * What a matrix cell can show. Attendance is stored as exceptions, so a cell
 * with no record is "present" on a day that was taken and "unmarked" on a day
 * that was not -- the latter is not a storable status, only a rendering of
 * absent data.
 */
export type AttendanceCellStatus = AttendanceStatus | "unmarked";

export type PermissionModule =
  | "calendar"
  | "bookings"
  | "guests"
  | "staff"
  | "finance";

export const PERMISSION_MODULES: Array<{
  key: PermissionModule;
  label: string;
}> = [
  { key: "calendar", label: "Calendar" },
  { key: "bookings", label: "Bookings" },
  { key: "guests", label: "Guests" },
  { key: "staff", label: "Staff" },
  { key: "finance", label: "Finance" },
];

export type PermissionCapability = "view" | "create_edit" | "delete" | "export";

export const PERMISSION_CAPABILITIES: Array<{
  key: PermissionCapability;
  label: string;
}> = [
  { key: "view", label: "View" },
  { key: "create_edit", label: "Create / Edit" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
];

export type RoleDefinition = {
  id: string;
  role: StaffRole;
  name: string;
  description: string;
  permissions: Record<PermissionModule, Record<PermissionCapability, boolean>>;
};

function fullPermissions(
  value: boolean,
): Record<PermissionModule, Record<PermissionCapability, boolean>> {
  const modules = PERMISSION_MODULES.reduce(
    (acc, m) => {
      acc[m.key] = PERMISSION_CAPABILITIES.reduce(
        (capAcc, c) => {
          capAcc[c.key] = value;
          return capAcc;
        },
        {} as Record<PermissionCapability, boolean>,
      );
      return acc;
    },
    {} as Record<PermissionModule, Record<PermissionCapability, boolean>>,
  );
  return modules;
}

export const MOCK_ROLES: RoleDefinition[] = [
  {
    id: "role-admin",
    role: "admin",
    name: "Admin",
    description: "Full access to all properties, billing, and settings.",
    permissions: fullPermissions(true),
  },
  {
    id: "role-manager",
    role: "manager",
    name: "Manager",
    description:
      "Access to bookings, calendar, guests, and reports. No billing.",
    permissions: {
      calendar: { view: true, create_edit: true, delete: true, export: true },
      bookings: { view: true, create_edit: true, delete: true, export: true },
      guests: { view: true, create_edit: true, delete: false, export: true },
      staff: { view: true, create_edit: false, delete: false, export: false },
      finance: {
        view: true,
        create_edit: false,
        delete: false,
        export: false,
      },
    },
  },
  {
    id: "role-caretaker",
    role: "caretaker",
    name: "Caretaker",
    description: "Check-in/out guests, mark housekeeping, view calendar.",
    permissions: {
      calendar: {
        view: true,
        create_edit: false,
        delete: false,
        export: false,
      },
      bookings: {
        view: true,
        create_edit: true,
        delete: false,
        export: false,
      },
      guests: { view: true, create_edit: true, delete: false, export: false },
      staff: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
      finance: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
    },
  },
  {
    id: "role-housekeeping",
    role: "housekeeping",
    name: "Housekeeping",
    description: "View assigned units, mark cleaning status.",
    permissions: {
      calendar: {
        view: true,
        create_edit: false,
        delete: false,
        export: false,
      },
      bookings: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
      guests: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
      staff: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
      finance: {
        view: false,
        create_edit: false,
        delete: false,
        export: false,
      },
    },
  },
];
