import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { DownloadIcon } from "lucide-react";

import { MOCK_AUDIT_LOG } from "@/features/settings/lib/mock-data";

export function AuditLogSection() {
  const feedback = useFeedback();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Audit Log</h2>
          <p className="text-muted-foreground text-xs">
            A record of actions taken across your organization.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            feedback.success(
              "Exporting audit log",
              "Your CSV download will start shortly.",
            )
          }
        >
          <DownloadIcon />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto border">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDIT_LOG.map((entry) => (
              <tr key={entry.id} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-muted-foreground">
                  {entry.time}
                </td>
                <td className="px-3 py-2">{entry.actor}</td>
                <td className="px-3 py-2">{entry.action}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {entry.target}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            feedback.success("No more entries", "You're viewing the full log.")
          }
        >
          Load More
        </Button>
      </div>
    </div>
  );
}
