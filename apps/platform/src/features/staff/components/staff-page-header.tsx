import { Button } from "@propertyos/ui/components/button";
import { UserPlusIcon } from "lucide-react";

export function StaffPageHeader({
  onInviteClick,
}: {
  onInviteClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-display-md">Staff Management</h1>
        <p className="text-muted-foreground text-sm">
          Manage your team, track attendance, and configure role permissions
        </p>
      </div>
      <Button onClick={onInviteClick}>
        <UserPlusIcon />
        Invite Staff
      </Button>
    </div>
  );
}
