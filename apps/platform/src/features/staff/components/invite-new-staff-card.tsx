import { Card, CardContent } from "@propertyos/ui/components/card";
import { PlusIcon } from "lucide-react";

export function InviteNewStaffCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="h-full justify-center border-2 border-dashed bg-transparent shadow-none ring-0 transition-colors hover:bg-muted/40">
        <CardContent className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PlusIcon className="size-4" />
          </span>
          <span className="font-medium text-sm">Invite New Staff</span>
          <span className="text-muted-foreground text-xs">
            Add a team member to your workspace.
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
