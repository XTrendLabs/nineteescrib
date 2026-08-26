import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import { UploadIcon } from "lucide-react";
import { formatJoinedDate, getInitials } from "../lib/format";
import type { StaffMember } from "../lib/mock-data";
import { RoleBadge } from "./role-badge";

export function StaffProfileHeader({ staff }: { staff: StaffMember }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <Avatar className="size-16">
            {staff.photoUrl && <AvatarImage src={staff.photoUrl} alt="" />}
            <AvatarFallback className="text-base">
              {getInitials(staff.fullName)}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="xs" disabled>
            <UploadIcon />
            Upload
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-display-sm">{staff.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <RoleBadge role={staff.role} />
            <span>·</span>
            <span>{staff.primaryPropertyName}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            Joined: {formatJoinedDate(staff.joinedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
