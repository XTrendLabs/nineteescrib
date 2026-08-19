import { formatInr } from "../lib/format";
import { CURRENCY_COLUMNS, type ReportRow } from "../lib/mock-data";

export function ReportDataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReportRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-12 text-center">
        <p className="text-sm">No data for the selected scope</p>
        <p className="text-muted-foreground text-xs">
          Try adjusting the date range or filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-3 py-2.5 font-medium text-muted-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: deterministic mock rows have no stable identity
              key={i}
              className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
            >
              {columns.map((column) => {
                const value = row[column];
                const isCurrency =
                  CURRENCY_COLUMNS.has(column) && typeof value === "number";
                return (
                  <td
                    key={column}
                    className="whitespace-nowrap px-3 py-2.5 tabular-nums"
                  >
                    {isCurrency
                      ? formatInr(value as number)
                      : typeof value === "number" &&
                          (column.includes("%") || column.includes("Rate"))
                        ? `${value}%`
                        : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
