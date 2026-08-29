import { Button } from "@propertyos/ui/components/button";
import { UserPlusIcon } from "lucide-react";

export function StaffPageHeader({
  canManage,
  onInviteClick,
}: {
  /** Hiring happens at HQ; a property-scoped viewer gets no invite action. */
  canManage: boolean;
  onInviteClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-display-md">Staff Management</h1>
        <p className="text-muted-foreground text-sm">
          {canManage
            ? "Manage your team, track attendance, and configure role permissions"
            : "See who you work with and keep your own details up to date"}
        </p>
      </div>
      {canManage && (
        <Button onClick={onInviteClick}>
          <UserPlusIcon />
          Invite Staff
        </Button>
      )}
    </div>
  );
}
