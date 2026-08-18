import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@propertyos/ui/components/accordion";
import { Button } from "@propertyos/ui/components/button";
import { Card } from "@propertyos/ui/components/card";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import type { RoleDefinition, StaffMember } from "../lib/mock-data";
import { CreateRoleDialog } from "./create-role-dialog";
import { PermissionMatrix } from "./permission-matrix";

export function RolesPermissions({
  roles,
  staff,
}: {
  roles: RoleDefinition[];
  staff: StaffMember[];
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Create Role
        </Button>
      </div>

      <Card className="p-0">
        <Accordion>
          {roles.map((role) => {
            const memberCount = staff.filter(
              (s) => s.role === role.role,
            ).length;

            return (
              <AccordionItem key={role.id} value={role.id}>
                <AccordionTrigger>
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{role.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {role.description}
                      </span>
                    </div>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {memberCount} {memberCount === 1 ? "Member" : "Members"}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionPanel>
                  <PermissionMatrix role={role} />
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
