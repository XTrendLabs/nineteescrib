import { Card, CardContent } from "@propertyos/ui/components/card";

export function AttendanceSummaryBand({
  presentToday,
  absentToday,
  onLeaveToday,
  totalStaff,
  avgAttendance,
}: {
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  totalStaff: number;
  avgAttendance: number;
}) {
  const items = [
    { label: "Present Today", value: `${presentToday} / ${totalStaff}` },
    { label: "Absent Today", value: String(absentToday) },
    { label: "On Leave", value: String(onLeaveToday) },
    { label: "Avg Attendance", value: `${avgAttendance.toFixed(1)}%` },
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
