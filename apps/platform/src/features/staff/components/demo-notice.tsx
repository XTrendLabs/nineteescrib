import { Badge } from "@propertyos/ui/components/badge";
import { FlaskConicalIcon } from "lucide-react";

/**
 * Marks a tab that still runs on generated mock data.
 *
 * Attendance and Roles & Permissions have no backing tables yet (see
 * docs/staff_design.md), so everything they show is seeded locally and is
 * not persisted. This banner keeps that obvious to anyone using the page.
 */
export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-warning/30 bg-warning/10 px-3 py-2">
      <Badge variant="warning">
        <FlaskConicalIcon />
        Demo
      </Badge>
      <p className="text-muted-foreground text-xs">{children}</p>
    </div>
  );
}
