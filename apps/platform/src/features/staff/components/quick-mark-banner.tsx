import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@propertyos/ui/components/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { getInitials } from "../lib/format";
import { ATTENDANCE_LABELS, type AttendanceStatus } from "../lib/mock-data";

type QuickMarkStaff = { id: string; fullName: string };

const QUICK_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "on_leave",
  "half_day",
];

export function QuickMarkBanner({
  staff,
  alreadyMarked,
  pending,
  onSubmit,
}: {
  staff: QuickMarkStaff[];
  /** Whether today's roster has already been taken. */
  alreadyMarked?: boolean;
  pending?: boolean;
  onSubmit: (marks: Record<string, AttendanceStatus>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  // Staff arrive asynchronously and the property filter changes who is
  // listed, so the defaults are reconciled rather than seeded once.
  const staffKey = staff.map((s) => s.id).join(",");
  const [seededFor, setSeededFor] = useState(staffKey);
  if (staffKey !== seededFor) {
    setSeededFor(staffKey);
    setMarks((prev) =>
      Object.fromEntries(
        staff.map((s) => [s.id, prev[s.id] ?? ("present" as AttendanceStatus)]),
      ),
    );
  }

  if (staff.length === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="p-0">
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            />
          }
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-sm">Mark Today's Attendance</span>
            <span className="text-muted-foreground text-xs">
              {alreadyMarked
                ? "Today has been marked. Submitting again updates it."
                : "Quick-mark all staff for today, defaults to Present."}
            </span>
          </div>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3 border-t px-4 py-4">
            <div className="flex flex-col gap-2">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex min-w-0 items-center justify-between gap-3 border-b py-2 last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                      {getInitials(member.fullName)}
                    </span>
                    <span className="truncate">{member.fullName}</span>
                  </span>
                  <Select
                    value={marks[member.id] ?? "present"}
                    onValueChange={(value) =>
                      setMarks((prev) => ({
                        ...prev,
                        [member.id]: value as AttendanceStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="w-[120px] shrink-0 sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUICK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {ATTENDANCE_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <Button
              className="self-end"
              disabled={pending}
              onClick={() => {
                onSubmit(
                  Object.fromEntries(
                    staff.map((s) => [s.id, marks[s.id] ?? "present"]),
                  ),
                );
                setOpen(false);
              }}
            >
              {pending ? "Submitting…" : "Submit"}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
