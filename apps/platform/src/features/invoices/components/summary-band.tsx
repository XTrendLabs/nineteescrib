import { Card, CardContent } from "@propertyos/ui/components/card";
import { formatInrFromPaise } from "../lib/format";

export function SummaryBand({
  totalInvoicedPaise,
  totalCollectedPaise,
  pendingBalancePaise,
  overdueCount,
}: {
  totalInvoicedPaise: number;
  totalCollectedPaise: number;
  pendingBalancePaise: number;
  overdueCount: number;
}) {
  const items = [
    { label: "Total Invoiced", value: formatInrFromPaise(totalInvoicedPaise) },
    {
      label: "Total Collected",
      value: formatInrFromPaise(totalCollectedPaise),
    },
    {
      label: "Pending Balance",
      value: formatInrFromPaise(pendingBalancePaise),
    },
    {
      label: "Overdue Count",
      value: `${overdueCount} Invoice${overdueCount === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <CardContent className="flex flex-col gap-1 px-0">
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <span className="font-semibold text-xl">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
