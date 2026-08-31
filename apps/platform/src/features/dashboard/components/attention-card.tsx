import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";

import { formatDayLabel, formatPaise } from "../lib/format";

export type AttentionRow = {
  id: string;
  ref: string;
  propertyName: string;
  guestName: string | null;
  checkIn: string;
  status: string;
  totalAmountPaise: number;
  paidPaise: number;
};

/**
 * Stays that have money outstanding and are already here or arriving within
 * three days -- the balances somebody has to chase today.
 */
export function AttentionCard({
  rows,
  showProperty,
}: {
  rows: AttentionRow[] | undefined;
  showProperty: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {(rows?.length ?? 0) > 0 && (
            <AlertTriangleIcon className="size-4 text-warning" />
          )}
          Payments to chase
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!rows || rows.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-xs">
            Every upcoming stay is paid up.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {(rows ?? []).map((row) => {
              const due = row.totalAmountPaise - row.paidPaise;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 border border-border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {row.guestName ?? "Guest"}
                      <span className="ml-1.5 font-normal text-muted-foreground text-xs">
                        {row.ref}
                      </span>
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {showProperty && `${row.propertyName} · `}
                      Arrives {formatDayLabel(row.checkIn, "day")}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-destructive text-sm tabular-nums">
                    {formatPaise(due)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <div className="border-t p-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          render={<Link to="/bookings" />}
        >
          Open bookings
        </Button>
      </div>
    </Card>
  );
}
