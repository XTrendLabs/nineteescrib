import { Card, CardContent, CardHeader } from "@propertyos/ui/components/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Icon className="size-3.5" />
          {label}
        </span>
      </CardHeader>
      <CardContent>
        <p className="truncate font-medium text-sm">{value}</p>
      </CardContent>
    </Card>
  );
}
