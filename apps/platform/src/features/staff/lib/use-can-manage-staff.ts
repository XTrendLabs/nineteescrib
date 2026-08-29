import { useActiveHq } from "@/features/auth/api/use-cached-organizations";

/**
 * Whether the signed-in user may manage the staff directory: add people, edit
 * anyone's record, or remove them.
 *
 * Hiring is an HQ activity, so this follows the active scope rather than the
 * role alone -- the same rule the server enforces. Someone working inside a
 * single property sees the roster but can only open their own record.
 *
 * This drives what is shown, not what is permitted; the API applies the same
 * check independently.
 */
export function useCanManageStaff() {
  const { isHqActive } = useActiveHq();
  return isHqActive;
}
