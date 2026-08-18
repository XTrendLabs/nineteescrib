import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";

import { formatInr } from "../../lib/format";
import type { PropertyDetail } from "../../lib/mock-data";

export function PricingTab({ property }: { property: PropertyDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Base Rates</p>
        <Button size="sm">
          <PlusIcon />
          Add Rate Override
        </Button>
      </div>

      <div className="overflow-x-auto border">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2.5 font-medium text-muted-foreground">
                Room Type
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">
                Base / Night
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">
                Weekend Rate
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">
                Extra Guest
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">
                Min Stay
              </th>
            </tr>
          </thead>
          <tbody>
            {property.roomTypes.map((rt) => (
              <tr key={rt.id} className="border-b last:border-b-0">
                <td className="px-3 py-2.5 font-medium">{rt.name}</td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatInr(rt.baseRatePaise)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatInr(rt.weekendRatePaise)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatInr(rt.extraGuestPaise)}
                </td>
                <td className="px-3 py-2.5">
                  {rt.minStayNights} night{rt.minStayNights === 1 ? "" : "s"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-sm">Seasonal Overrides</p>
        {property.rateOverrides.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No seasonal overrides configured.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {property.rateOverrides.map((override) => (
              <Card key={override.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-4">
                  <div>
                    <p className="font-medium text-sm">
                      {override.emoji} {override.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {format(override.startDate, "MMM d")} –{" "}
                      {format(override.endDate, "MMM d")}
                      {override.minStayOverride
                        ? ` · Min Stay: ${override.minStayOverride} nights`
                        : ""}
                    </p>
                    <div className="mt-2 flex flex-col gap-0.5 text-xs">
                      {override.prices.map((p) => (
                        <p key={p.roomTypeId}>
                          {p.roomTypeName}: {formatInr(p.customPricePaise)}
                          /night
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
