import { Badge } from "@propertyos/ui/components/badge";
import { format } from "date-fns";
import { FileTextIcon } from "lucide-react";
import type { StaffMember } from "../lib/mock-data";

export function DocumentsTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Documents are stored securely and only visible to Admin/Manager roles.
      </p>
      <div className="flex flex-col divide-y border">
        {staff.documents.map((doc) => (
          <div
            key={doc.type}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                <FileTextIcon className="size-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{doc.label}</span>
                <span className="text-muted-foreground text-xs">
                  Uploaded {format(doc.uploadedAt, "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <Badge variant={doc.verified ? "success" : "warning"}>
              {doc.verified ? "Verified" : "Pending"}
            </Badge>
          </div>
        ))}
        {staff.documents.length === 0 && (
          <p className="px-4 py-6 text-center text-muted-foreground text-sm">
            No documents uploaded yet.
          </p>
        )}
      </div>
    </div>
  );
}
