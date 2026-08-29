export const staffRoleValues = [
  "admin",
  "manager",
  "caretaker",
  "housekeeping",
] as const;

export type StaffRole = (typeof staffRoleValues)[number];

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  caretaker: "Caretaker",
  housekeeping: "Housekeeping",
};

export const staffStatusValues = [
  "active",
  "pending_invite",
  "inactive",
] as const;

export type StaffStatus = (typeof staffStatusValues)[number];

export const STAFF_STATUS_LABEL: Record<StaffStatus, string> = {
  active: "Active",
  pending_invite: "Pending Invite",
  inactive: "Inactive",
};

export const staffGenderValues = ["male", "female", "other"] as const;
export type StaffGender = (typeof staffGenderValues)[number];

export const STAFF_GENDER_LABEL: Record<StaffGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export type StaffProperty = {
  id: string;
  name: string;
  slug: string;
};

export type Staff = {
  id: string;
  hqOrganizationId: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  photoUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  /** True when the member has a login account for the platform. */
  hasPlatformAccess: boolean;
  /** True when this record belongs to the signed-in user. */
  isSelf?: boolean;
  properties: StaffProperty[];
};

export function normalizeStaffRole(value: string): StaffRole {
  return staffRoleValues.includes(value as StaffRole)
    ? (value as StaffRole)
    : "caretaker";
}

export function normalizeStaffStatus(value: string): StaffStatus {
  return staffStatusValues.includes(value as StaffStatus)
    ? (value as StaffStatus)
    : "active";
}
