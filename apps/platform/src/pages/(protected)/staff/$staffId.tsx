import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@propertyos/ui/components/avatar";
import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useStaffMember } from "@/features/staff/api/use-staff-member";
import { StaffDialog } from "@/features/staff/components/staff-dialog";
import { formatPhone, getInitials } from "@/features/staff/lib/format";
import {
  normalizeStaffRole,
  normalizeStaffStatus,
  STAFF_GENDER_LABEL,
  STAFF_ROLE_LABEL,
  STAFF_STATUS_LABEL,
  type Staff,
  type StaffGender,
} from "@/features/staff/lib/staff";

export const Route = createFileRoute("/(protected)/staff/$staffId")({
  component: RouteComponent,
});

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

function RouteComponent() {
  const { staffId } = Route.useParams();
  const { activeHqId } = useActiveHq();
  const { data: response, isLoading, isError } = useStaffMember(staffId);
  const member = response?.data as unknown as Staff | undefined;

  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-muted-foreground text-sm">
          This staff member could not be found.
        </p>
        <Link to="/staff" className="text-foreground text-sm underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  const address = [
    member.addressLine1,
    member.addressLine2,
    member.city,
    member.state,
    member.pinCode,
  ]
    .filter((part) => part?.trim())
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
            <AvatarFallback className="text-base">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-display-sm">{member.fullName}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">
                {STAFF_ROLE_LABEL[normalizeStaffRole(member.role)]}
              </Badge>
              <Badge variant="outline">
                {STAFF_STATUS_LABEL[normalizeStaffStatus(member.status)]}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <PencilIcon />
          Edit
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Phone" value={formatPhone(member.phone)} />
          <DetailRow label="Email" value={member.email} />
          <DetailRow
            label="Gender"
            value={
              member.gender
                ? STAFF_GENDER_LABEL[member.gender as StaffGender]
                : null
            }
          />
          <DetailRow label="Date of Birth" value={member.dateOfBirth} />
          <DetailRow label="Emergency Contact" value={member.emergencyName} />
          <DetailRow
            label="Emergency Phone"
            value={
              member.emergencyPhone ? formatPhone(member.emergencyPhone) : null
            }
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <DetailRow label="Address" value={address} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <span className="font-medium text-sm">Assigned Properties</span>
          {member.properties.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No properties assigned yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {member.properties.map((property) => (
                <Badge key={property.id} variant="outline">
                  {property.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {activeHqId && (
        <StaffDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          hqOrganizationId={activeHqId}
          staff={member}
        />
      )}
    </motion.div>
  );
}
