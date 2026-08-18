import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { CalendarIcon, DownloadIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import {
  MOCK_EXPORT_DATA_TYPES,
  MOCK_SCHEDULED_REPORTS,
  type ScheduledReport,
} from "@/features/settings/lib/mock-data";

export function DataExportSection() {
  const feedback = useFeedback();
  const [reports, setReports] = useState<ScheduledReport[]>(
    MOCK_SCHEDULED_REPORTS,
  );
  const [addReportOpen, setAddReportOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportSchedule, setReportSchedule] = useState("Every Monday 9:00 AM");
  const [reportRecipient, setReportRecipient] = useState("");

  function handleAddReport() {
    if (!reportName.trim() || !reportRecipient.trim()) {
      feedback.error("Missing details", "Name and recipient are required.");
      return;
    }
    setReports((prev) => [
      ...prev,
      {
        id: `rep-${Date.now()}`,
        name: reportName,
        schedule: reportSchedule,
        recipient: reportRecipient,
      },
    ]);
    feedback.success("Scheduled report added");
    setReportName("");
    setReportRecipient("");
    setAddReportOpen(false);
  }

  function handleRemoveReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    feedback.success("Scheduled report removed");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Data Export</h2>
        <p className="text-muted-foreground text-xs">
          Download data on demand, schedule recurring reports, or request a full
          account export.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Manual Exports
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-3">
            {MOCK_EXPORT_DATA_TYPES.map((type) => (
              <div
                key={type}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-xs">{type}</span>
                <div className="flex items-center gap-2">
                  <Select defaultValue="csv">
                    <SelectTrigger className="w-24">
                      <SelectValue>CSV</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="30d">
                    <SelectTrigger className="w-36">
                      <SelectValue>Last 30 days</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      feedback.success(
                        "Export started",
                        `${type} download will begin shortly.`,
                      )
                    }
                  >
                    <DownloadIcon />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Scheduled Reports
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <CalendarIcon className="mt-0.5 size-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs">{report.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {report.schedule} → {report.recipient}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveReport(report.id)}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddReportOpen(true)}
              >
                <PlusIcon />
                Add Scheduled Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Full Account Export
        </h3>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              Download a complete export of all your data. Includes: bookings,
              guests, payments, properties, staff.
            </p>
            <Button
              onClick={() =>
                feedback.success(
                  "Full export requested",
                  "We'll email you a download link when it's ready.",
                )
              }
            >
              Request Full Export
            </Button>
          </CardContent>
        </Card>
      </section>

      <Dialog open={addReportOpen} onOpenChange={setAddReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Scheduled Report</DialogTitle>
            <DialogDescription>
              Set up a recurring report emailed to a recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <Field>
              <FieldLabel>Report Name</FieldLabel>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Schedule</FieldLabel>
              <Select
                value={reportSchedule}
                onValueChange={(value) => setReportSchedule(value as string)}
              >
                <SelectTrigger>
                  <SelectValue>{reportSchedule}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Every Monday 9:00 AM">
                    Every Monday 9:00 AM
                  </SelectItem>
                  <SelectItem value="1st of each month">
                    1st of each month
                  </SelectItem>
                  <SelectItem value="Daily 8:00 AM">Daily 8:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Recipient Email</FieldLabel>
              <Input
                type="email"
                value={reportRecipient}
                onChange={(e) => setReportRecipient(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReport}>Add Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
