import { Card, CardContent } from "@propertyos/ui/components/card";
import { formatInrFromPaise } from "../lib/format";

export function SummaryBand({
  totalPaise,
  paidPaise,
  pendingPaise,
  ownerDeductedPaise,
}: {
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  ownerDeductedPaise: number;
}) {
  const items = [
    { label: "Total Expenses", value: formatInrFromPaise(totalPaise) },
    { label: "Paid Amount", value: formatInrFromPaise(paidPaise) },
    { label: "Pending Balance", value: formatInrFromPaise(pendingPaise) },
    {
      label: "Owner Deducted",
      value: formatInrFromPaise(ownerDeductedPaise),
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
