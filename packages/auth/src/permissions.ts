import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Resources this app authorizes, on top of the organization plugin's own
 * `organization`, `member`, `invitation` and `team` statements.
 *
 * Because a property *is* an organization, these are evaluated against
 * whichever organization is active -- an HQ or a single property.
 */
export const statement = {
  ...defaultStatements,
  property: ["create", "read", "update", "delete"],
  room: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
  attendance: ["create", "read", "update"],
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read", "update"],
  vendor: ["create", "read", "update", "delete"],
  expense: ["create", "read", "update", "delete"],
  report: ["read"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Full control, including billing and deleting the organization. Held by the
 * person who signed up; at HQ level this is what grants reach into every
 * property beneath it.
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
  property: ["create", "read", "update", "delete"],
  room: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
  attendance: ["create", "read", "update"],
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read", "update"],
  vendor: ["create", "read", "update", "delete"],
  expense: ["create", "read", "update", "delete"],
  report: ["read"],
});

/**
 * Runs the day-to-day operation of a property: rooms, rates and bookings.
 * Cannot delete the property itself or change its financial setup.
 *
 * Managing staff -- hiring, editing, assigning properties -- is the owner's
 * alone, so this role only reads the directory. Marking attendance is the
 * exception: it is a daily operational task, so it sits with whoever runs the
 * property rather than with the owner.
 *
 * The vendor directory is theirs to curate: deciding who the business buys
 * from is a management call, which is why `vendor` is its own resource rather
 * than riding on `finance` -- the latter still gates payouts and reporting,
 * which stay read-only here.
 */
export const propertyManager = ac.newRole({
  ...adminAc.statements,
  property: ["read", "update"],
  room: ["create", "read", "update", "delete"],
  staff: ["read"],
  attendance: ["create", "read", "update"],
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read"],
  vendor: ["create", "read", "update", "delete"],
  expense: ["create", "read", "update", "delete"],
  report: ["read"],
});

/**
 * Front-desk and housekeeping. Works bookings and reads what they need to do
 * the job, but changes nothing structural.
 *
 * Logging an expense is deliberately open to them: whoever spends the money is
 * the one who can record it accurately, and a caretaker paying a plumber in
 * cash should not have to wait on a manager. Choosing *which* vendors the
 * business deals with is a management call, so vendors stay read-only.
 */
export const staffRole = ac.newRole({
  property: ["read"],
  room: ["read", "update"],
  staff: ["read"],
  attendance: ["read"],
  booking: ["create", "read", "update"],
  rate: ["read"],
  report: [],
  finance: [],
  vendor: ["read"],
  expense: ["create", "read", "update", "delete"],
});

export const roles = {
  owner,
  "property-manager": propertyManager,
  staff: staffRole,
} as const;

export type AppRole = keyof typeof roles;

export const appRoleValues = [
  "owner",
  "property-manager",
  "staff",
] as const satisfies readonly AppRole[];

/** Human-readable labels for role pickers. */
export const roleLabels: Record<AppRole, string> = {
  owner: "Owner",
  "property-manager": "Property Manager",
  staff: "Staff",
};
