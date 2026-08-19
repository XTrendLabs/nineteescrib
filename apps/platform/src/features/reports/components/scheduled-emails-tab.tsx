import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { format } from "date-fns";
import {
  CalendarClockIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  buildScheduledReports,
  DAY_OF_WEEK_LABELS,
  REPORT_TEMPLATES,
  type ScheduledReport,
} from "../lib/mock-data";
import { ScheduleDialog, type ScheduleSource } from "./schedule-dialog";

function frequencyLabel(schedule: ScheduledReport) {
  if (schedule.frequency === "daily") return `Daily at ${schedule.timeOfDay}`;
  if (schedule.frequency === "weekly") {
    return `Every ${DAY_OF_WEEK_LABELS[schedule.dayOfWeek ?? 1]} at ${schedule.timeOfDay}`;
  }
  return `${schedule.dayOfMonth ?? 1}${schedule.dayOfMonth === 1 ? "st" : "th"} of every month at ${schedule.timeOfDay}`;
}

function reportLabel(schedule: ScheduledReport) {
  return (
    REPORT_TEMPLATES.find((t) => t.key === schedule.templateKey)?.name ??
    "Custom Report"
  );
}

function ScheduleRow({
  schedule,
  onTogglePause,
  onDelete,
}: {
  schedule: ScheduledReport;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3 last:border-b-0">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 font-medium text-sm">
          <CalendarClockIcon className="size-3.5" />
          {schedule.label}
        </p>
        <p className="text-muted-foreground text-xs">
          Report: {reportLabel(schedule)} · Format:{" "}
          {schedule.format === "excel_csv"
            ? "PDF + CSV"
            : schedule.format.toUpperCase()}
        </p>
        <p className="text-muted-foreground text-xs">
          Frequency: {frequencyLabel(schedule)}
        </p>
        <p className="text-muted-foreground text-xs">
          Recipients: {schedule.recipients.join(", ")}
        </p>
        <p className="flex items-center gap-1.5 text-xs">
          <Badge variant={schedule.status === "active" ? "success" : "muted"}>
            {schedule.status === "active" ? "● Active" : "Paused"}
          </Badge>
          <span className="text-muted-foreground">
            Next run: {format(schedule.nextRunAt, "MMM d, h:mm a")}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTogglePause(schedule.id)}
        >
          {schedule.status === "active" ? <PauseIcon /> : <PlayIcon />}
          {schedule.status === "active" ? "Pause" : "Resume"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={() => onDelete(schedule.id)}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}

export function ScheduledEmailsTab() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(() =>
    buildScheduledReports(),
  );
  const [createOpen, setCreateOpen] = useState(false);

  function togglePause(id: string) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s,
      ),
    );
  }

  function remove(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Schedule deleted");
  }

  const createSource: ScheduleSource | null = createOpen
    ? { type: "template", key: "new", name: "New Schedule" }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Active Schedules</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Create Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
          <p className="text-sm">No scheduled exports yet</p>
          <p className="text-muted-foreground text-xs">
            Create a schedule to automate recurring report delivery
          </p>
        </div>
      ) : (
        <Card className="py-0">
          <CardContent className="px-0 py-0">
            {schedules.map((schedule) => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                onTogglePause={togglePause}
                onDelete={remove}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <ScheduleDialog
        source={createSource}
        onOpenChange={(open) => !open && setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />
    </div>
  );
}
