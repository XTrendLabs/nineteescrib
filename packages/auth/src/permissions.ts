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
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read", "update"],
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
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read", "update"],
  report: ["read"],
});

/**
 * Runs the day-to-day operation of a property: rooms, rates, bookings and
 * staff. Cannot delete the property itself or change its financial setup.
 */
export const propertyManager = ac.newRole({
  ...adminAc.statements,
  property: ["read", "update"],
  room: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update"],
  booking: ["create", "read", "update", "cancel"],
  rate: ["read", "update"],
  finance: ["read"],
  report: ["read"],
});

/**
 * Front-desk and housekeeping. Works bookings and reads what they need to do
 * the job, but changes nothing structural.
 */
export const staffRole = ac.newRole({
  property: ["read"],
  room: ["read", "update"],
  staff: ["read"],
  booking: ["create", "read", "update"],
  rate: ["read"],
  report: [],
  finance: [],
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
