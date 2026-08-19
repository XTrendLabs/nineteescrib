import { Card, CardContent } from "@propertyos/ui/components/card";

import { formatInr } from "../lib/format";
import type { AdvancedSection, ReportRow } from "../lib/mock-data";
import { CURRENCY_COLUMNS } from "../lib/mock-data";

function cellValue(column: string, value: ReportRow[string]) {
  if (value === "" || value === undefined) return "";
  if (typeof value === "number" && CURRENCY_COLUMNS.has(column)) {
    return formatInr(value);
  }
  if (typeof value === "number" && column === "Amount") {
    const formatted = formatInr(Math.abs(value));
    return value < 0 ? `(${formatted})` : formatted;
  }
  if (typeof value === "number" && column.includes("%")) {
    return `${value}%`;
  }
  return value;
}

function StatsSectionView({
  section,
}: {
  section: Extract<AdvancedSection, { type: "stats" }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-sm">{section.title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {section.stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="text-muted-foreground text-xs">{stat.label}</p>
              <p className="text-display-sm tabular-nums leading-none">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FlatTableSectionView({
  section,
}: {
  section: Extract<AdvancedSection, { type: "flat_table" }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-sm">{section.title}</p>
      <div className="overflow-x-auto border">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              {section.columns.map((column) => (
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
            {section.rows.map((row, i) => (
              <tr
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic mock rows have no stable identity
                key={i}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
              >
                {section.columns.map((column) => (
                  <td
                    key={column}
                    className="whitespace-nowrap px-3 py-2.5 tabular-nums"
                  >
                    {cellValue(column, row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NestedTableSectionView({
  section,
}: {
  section: Extract<AdvancedSection, { type: "nested_table" }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-sm">{section.title}</p>
      <div className="flex flex-col gap-3">
        {section.groups.map((group) => (
          <div key={group.group} className="overflow-hidden border">
            <div className="border-b bg-muted/50 px-3 py-2 font-medium text-xs">
              {group.group}
            </div>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b bg-muted/20">
                  {section.columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row, i) => (
                  <tr
                    // biome-ignore lint/suspicious/noArrayIndexKey: deterministic mock rows have no stable identity
                    key={i}
                    className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    {section.columns.map((column) => (
                      <td
                        key={column}
                        className="whitespace-nowrap px-3 py-2 pl-6 tabular-nums"
                      >
                        {cellValue(column, row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
                {group.subtotal && (
                  <tr className="border-t bg-muted/30 font-medium">
                    {section.columns.map((column, colIndex) => {
                      const subtotal = group.subtotal as ReportRow;
                      return (
                        <td
                          key={column}
                          className="whitespace-nowrap px-3 py-2 tabular-nums"
                        >
                          {colIndex === 0
                            ? subtotal[column]
                            : cellValue(column, subtotal[column])}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdvancedSectionRenderer({
  section,
}: {
  section: AdvancedSection;
}) {
  if (section.type === "stats") return <StatsSectionView section={section} />;
  if (section.type === "flat_table")
    return <FlatTableSectionView section={section} />;
  return <NestedTableSectionView section={section} />;
}
