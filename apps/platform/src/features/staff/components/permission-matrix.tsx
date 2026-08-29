import { DataTableContainer } from "@propertyos/ui/components/data-table";
import { cn } from "@propertyos/ui/lib/utils";
import { CheckIcon, XIcon } from "lucide-react";
import {
  PERMISSION_CAPABILITIES,
  PERMISSION_MODULES,
  type RoleDefinition,
} from "../lib/mock-data";

export function PermissionMatrix({ role }: { role: RoleDefinition }) {
  return (
    <DataTableContainer className="border-0 border-t">
      <table className="w-full min-w-max border-collapse text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-medium">Capability</th>
            {PERMISSION_MODULES.map((module) => (
              <th
                key={module.key}
                className="px-3 py-2 text-center font-medium"
              >
                {module.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_CAPABILITIES.map((capability) => (
            <tr key={capability.key} className="border-b last:border-b-0">
              <td className="px-3 py-2 text-muted-foreground">
                {capability.label}
              </td>
              {PERMISSION_MODULES.map((module) => {
                const allowed = role.permissions[module.key][capability.key];
                return (
                  <td key={module.key} className="px-3 py-2 text-center">
                    {allowed ? (
                      <CheckIcon className="mx-auto size-3.5 text-success" />
                    ) : (
                      <XIcon
                        className={cn(
                          "mx-auto size-3.5 text-muted-foreground/40",
                        )}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableContainer>
  );
}
