import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { format } from "date-fns";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { StaffMember, StaffRole } from "../lib/mock-data";
import { ROLE_LABELS } from "../lib/mock-data";
import { AssignWorkspaceDialog } from "./assign-workspace-dialog";

export function WorkspacesTab({ staff }: { staff: StaffMember }) {
  const feedback = useFeedback();
  const [workspaces, setWorkspaces] = useState(staff.workspaces);
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Assigned Workspaces</h2>
        <Button size="sm" onClick={() => setAssignOpen(true)}>
          <PlusIcon />
          Assign New
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.propertyId}
            className="flex flex-col gap-2 border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-sm">
                <MapPinIcon className="size-3.5 text-muted-foreground" />
                {workspace.propertyName}
              </span>
              <span className="text-muted-foreground text-xs">
                Role: {ROLE_LABELS[workspace.role as StaffRole]}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              Access: {workspace.access.join(", ")}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Since: {format(workspace.since, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setWorkspaces((prev) =>
                    prev.filter((w) => w.propertyId !== workspace.propertyId),
                  );
                  feedback.success(
                    "Workspace removed",
                    `Removed access to ${workspace.propertyName}.`,
                  );
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No workspaces assigned yet.
          </p>
        )}
      </div>

      <AssignWorkspaceDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignedPropertyIds={workspaces.map((w) => w.propertyId)}
        onAssign={(propertyId, propertyName, role) => {
          setWorkspaces((prev) => [
            ...prev,
            {
              propertyId,
              propertyName,
              role,
              access: [],
              since: new Date(),
            },
          ]);
        }}
      />
    </div>
  );
}
