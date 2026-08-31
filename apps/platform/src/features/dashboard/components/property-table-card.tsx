import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";

import { formatCount, formatPaise, formatRate } from "../lib/format";

export type PropertyRow = {
  propertyId: string;
  propertyName: string;
  revenuePaise: number;
  collectedPaise: number;
  expensePaise: number;
  bookingCount: number;
  bookedNights: number;
  availableNights: number;
};

/**
 * How each property in the portfolio performed over the window.
 *
 * HQ-only: inside a single property this would be one row restating the tiles
 * above it, so the page does not render it there.
 */
export function PropertyTableCard({
  rows,
}: {
  rows: PropertyRow[] | undefined;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">By property</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {!rows || rows.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-xs">
            No properties to compare yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y text-muted-foreground text-xs">
                  <th className="px-4 py-2 text-left font-normal">Property</th>
                  <th className="px-4 py-2 text-right font-normal">Revenue</th>
                  <th className="px-4 py-2 text-right font-normal">Expenses</th>
                  <th className="px-4 py-2 text-right font-normal">Net</th>
                  <th className="px-4 py-2 text-right font-normal">
                    Occupancy
                  </th>
                  <th className="px-4 py-2 text-right font-normal">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((row) => {
                  const net = row.revenuePaise - row.expensePaise;
                  const occupancy =
                    row.availableNights > 0
                      ? (row.bookedNights / row.availableNights) * 100
                      : null;

                  return (
                    <tr
                      key={row.propertyId}
                      className="border-b last:border-b-0"
                    >
                      <td className="max-w-48 truncate px-4 py-2.5">
                        {row.propertyName}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatPaise(row.revenuePaise)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                        {formatPaise(row.expensePaise)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right tabular-nums",
                          net > 0 && "text-success",
                          net < 0 && "text-destructive",
                        )}
                      >
                        {formatPaise(net)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatRate(occupancy)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                        {formatCount(row.bookingCount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
