import { Badge } from "@propertyos/ui/components/badge";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useDeleteStaff } from "@/features/staff/api/use-delete-staff";
import { useStaff } from "@/features/staff/api/use-staff";
import { AttendanceMarkDialog } from "@/features/staff/components/attendance-mark-dialog";
import { AttendanceTracker } from "@/features/staff/components/attendance-tracker";
import { DemoNotice } from "@/features/staff/components/demo-notice";
import { RolesPermissions } from "@/features/staff/components/roles-permissions";
import { StaffDialog } from "@/features/staff/components/staff-dialog";
import { StaffDirectory } from "@/features/staff/components/staff-directory";
import { StaffPageHeader } from "@/features/staff/components/staff-page-header";
import { buildStaffMembers, MOCK_ROLES } from "@/features/staff/lib/mock-data";
import type { Staff } from "@/features/staff/lib/staff";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/staff/")({
  component: RouteComponent,
});

function RouteComponent() {
  const feedback = useFeedback();
  const { activeHqId: hqOrganizationId } = useActiveHq();

  const { data: response, isLoading } = useStaff(hqOrganizationId);
  const staff = (response?.data ?? []) as unknown as Staff[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(
    undefined,
  );
  const [staffToDelete, setStaffToDelete] = useState<Staff | undefined>(
    undefined,
  );
  const deleteStaff = useDeleteStaff();

  // Attendance and Roles still run on generated data — they have no tables yet.
  const demoStaff = useMemo(() => buildStaffMembers(), []);

  function openCreate() {
    setEditingStaff(undefined);
    setDialogOpen(true);
  }

  function openEdit(member: Staff) {
    setEditingStaff(member);
    setDialogOpen(true);
  }

  function handleDelete() {
    if (!staffToDelete) return;
    const member = staffToDelete;

    deleteStaff.mutate(
      { param: { id: member.id } },
      {
        onSuccess: () => {
          api.api.platform.staff.$get.invalidate({
            query: { hqOrganizationId: hqOrganizationId ?? "" },
          });
          setStaffToDelete(undefined);
          feedback.success(
            "Staff removed",
            `${member.fullName} has been deleted.`,
          );
        },
        onError: (error) => {
          feedback.error(
            "Couldn't delete staff member",
            getApiErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );
        },
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <StaffPageHeader onInviteClick={openCreate} />

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTab value="directory">Directory</TabsTab>
          <TabsTab value="attendance">
            Attendance
            <Badge variant="warning">Demo</Badge>
          </TabsTab>
          <TabsTab value="roles">
            Roles & Permissions
            <Badge variant="warning">Demo</Badge>
          </TabsTab>
        </TabsList>

        <TabsPanel value="directory">
          <StaffDirectory
            staff={staff}
            hqOrganizationId={hqOrganizationId}
            isLoading={isLoading}
            onAddClick={openCreate}
            onEdit={openEdit}
            onDelete={setStaffToDelete}
          />
        </TabsPanel>

        <TabsPanel value="attendance">
          <div className="flex flex-col gap-4">
            <DemoNotice>
              Attendance is a preview running on sample staff. Marks are not
              saved and don't reflect your real directory.
            </DemoNotice>
            <AttendanceTracker staff={demoStaff} />
          </div>
        </TabsPanel>

        <TabsPanel value="roles">
          <div className="flex flex-col gap-4">
            <DemoNotice>
              Roles and permissions are a preview. Changes here are not saved
              and don't affect real access.
            </DemoNotice>
            <RolesPermissions roles={MOCK_ROLES} staff={demoStaff} />
          </div>
        </TabsPanel>
      </Tabs>

      <AttendanceMarkDialog />

      {hqOrganizationId && (
        <StaffDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          hqOrganizationId={hqOrganizationId}
          staff={editingStaff}
        />
      )}

      <ConfirmDialog
        open={Boolean(staffToDelete)}
        onOpenChange={(open) => {
          if (!open) setStaffToDelete(undefined);
        }}
        title={`Remove ${staffToDelete?.fullName ?? "staff member"}?`}
        description="This permanently removes the staff member and their property assignments. This cannot be undone."
        confirmLabel="Remove"
        loadingLabel="Removing…"
        loading={deleteStaff.isPending}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
