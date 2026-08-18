import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { formatPhone, getInitials } from "../lib/format";
import type { StaffMember } from "../lib/mock-data";
import { AttendanceStatusDot } from "./attendance-status-dot";
import { RoleBadge } from "./role-badge";

export function StaffCard({ staff }: { staff: StaffMember }) {
  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 px-0">
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            {staff.photoUrl && <AvatarImage src={staff.photoUrl} alt="" />}
            <AvatarFallback>{getInitials(staff.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-sm">
              {staff.fullName}
            </span>
            <RoleBadge role={staff.role} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{staff.primaryPropertyName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <PhoneIcon className="size-3.5 shrink-0" />
            <a
              href={`tel:${staff.phone}`}
              className="truncate hover:text-foreground"
            >
              {formatPhone(staff.phone)}
            </a>
          </span>
          <AttendanceStatusDot status={staff.todayStatus} showLabel />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="justify-between"
          render={<Link to="/staff/$staffId" params={{ staffId: staff.id }} />}
        >
          View Profile
          <ArrowRightIcon />
        </Button>
      </CardContent>
    </Card>
  );
}
