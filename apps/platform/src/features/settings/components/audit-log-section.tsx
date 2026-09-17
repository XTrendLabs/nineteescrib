import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { DataTableContainer } from "@propertyos/ui/components/data-table";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useAuditLog } from "../api/use-audit-log";

/** One page. Matches the server's page size. */
const PAGE_SIZE = 10;

/**
 * "17 Sep, 2:04 PM" -- the log is read newest-first and mostly within the last
 * few days, so the day and time matter more than the year.
 */
function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuditLogSection() {
  const { activeScopeId } = useActiveHq();

  // The cursor stack, one entry per page visited. Kept rather than a page
  // number because keyset paging has no way back from a cursor alone -- going
  // back means reusing the cursor that produced the previous page.
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useAuditLog(activeScopeId, cursor);

  const entries = response?.data.entries ?? [];
  const nextCursor = response?.data.nextCursor ?? null;
  const pageNumber = cursors.length + 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Audit Log</h2>
          <p className="text-muted-foreground text-xs">
            A record of actions taken across your organization.
          </p>
        </div>
      </div>

      <DataTableContainer className="sm:[--content-inset:17.5rem]">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => `row-${i}`).map(
                (key) => (
                  <tr key={key} className="border-b last:border-b-0">
                    {["t", "a", "c", "g", "d"].map((cell) => (
                      <td key={cell} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {formatWhen(entry.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span>{entry.actor}</span>
                      {entry.propertyName ? (
                        <span className="text-[11px] text-muted-foreground">
                          {entry.propertyName}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{entry.actionLabel}</Badge>
                  </td>
                  <td className="px-3 py-2 font-medium">{entry.target}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTableContainer>

      {/* Hidden on the only page, so a short log carries no dead controls. */}
      {cursors.length > 0 || nextCursor ? (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            Page {pageNumber}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={cursors.length === 0 || isFetching}
              onClick={() => setCursors((prev) => prev.slice(0, -1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextCursor || isFetching}
              onClick={() =>
                nextCursor && setCursors((prev) => [...prev, nextCursor])
              }
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
