import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@propertyos/ui/components/avatar";
import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  TrashIcon,
} from "lucide-react";

import { formatPhone, getInitials } from "../lib/format";
import { normalizeStaffRole, STAFF_ROLE_LABEL, type Staff } from "../lib/staff";

export function StaffCard({
  staff,
  onEdit,
  onDelete,
}: {
  staff: Staff;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const propertyLabel =
    staff.properties.length === 0
      ? "No properties assigned"
      : staff.properties.length === 1
        ? staff.properties[0]?.name
        : `${staff.properties.length} properties`;

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 px-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar size="lg">
              {staff.photoUrl && <AvatarImage src={staff.photoUrl} alt="" />}
              <AvatarFallback>{getInitials(staff.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-medium text-sm">
                {staff.fullName}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline">
                  {STAFF_ROLE_LABEL[normalizeStaffRole(staff.role)]}
                </Badge>
                {staff.status === "pending_invite" && (
                  <Badge variant="outline">Pending</Badge>
                )}
                {staff.status === "inactive" && (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              className="size-7"
              onClick={onEdit}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="size-7"
              onClick={onDelete}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{propertyLabel}</span>
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
          {staff.email && (
            <span className="flex items-center gap-1.5">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{staff.email}</span>
            </span>
          )}
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
