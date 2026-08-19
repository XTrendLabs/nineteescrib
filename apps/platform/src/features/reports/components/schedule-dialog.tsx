import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";

import {
  DAY_OF_WEEK_LABELS,
  type ExportFormat,
  type ScheduleFrequency,
} from "../lib/mock-data";

export type ScheduleSource =
  | { type: "template"; key: string; name: string }
  | { type: "saved_report"; id: string; name: string };

const FORMAT_OPTIONS: { value: ExportFormat | "excel_csv"; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV" },
  { value: "excel_csv", label: "PDF + CSV" },
];

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function ScheduleDialog({
  source,
  onOpenChange,
  onCreated,
}: {
  source: ScheduleSource | null;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat | "excel_csv">("pdf");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [recipients, setRecipients] = useState("");

  function reset() {
    setFormat("pdf");
    setFrequency("weekly");
    setDayOfWeek(1);
    setDayOfMonth(1);
    setTimeOfDay("09:00");
    setRecipients("");
  }

  return (
    <Dialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>{source?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Select Format</span>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as typeof format)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value: unknown) =>
                    FORMAT_OPTIONS.find((o) => o.value === value)?.label ??
                    "Format"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Frequency</span>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as ScheduleFrequency)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value: unknown) =>
                    FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ??
                    "Frequency"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === "weekly" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Day of Week</span>
              <Select
                value={String(dayOfWeek)}
                onValueChange={(v) => setDayOfWeek(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: unknown) => DAY_OF_WEEK_LABELS[Number(value)]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DAY_OF_WEEK_LABELS.slice(1).map((label, i) => (
                    <SelectItem key={label} value={String(i + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === "monthly" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Day of Month
              </span>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Time of Day</span>
            <Input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Recipients</span>
            <Input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="owner@email.com, accountant@email.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!recipients.trim()}
            onClick={() => {
              toast.success(`Schedule created for ${source?.name}`);
              onCreated();
              reset();
            }}
          >
            Create Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
