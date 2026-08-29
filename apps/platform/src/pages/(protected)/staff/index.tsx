import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useDeleteStaff } from "@/features/staff/api/use-delete-staff";
import { useStaff } from "@/features/staff/api/use-staff";
import { AttendanceMarkDialog } from "@/features/staff/components/attendance-mark-dialog";
import { AttendanceTracker } from "@/features/staff/components/attendance-tracker";
import { StaffDialog } from "@/features/staff/components/staff-dialog";
import { StaffDirectory } from "@/features/staff/components/staff-directory";
import { StaffPageHeader } from "@/features/staff/components/staff-page-header";
import type { Staff } from "@/features/staff/lib/staff";
import { useCanManageStaff } from "@/features/staff/lib/use-can-manage-staff";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/staff/")({
  component: RouteComponent,
});

function RouteComponent() {
  const feedback = useFeedback();
  const { activeHqId: hqOrganizationId, activeScopeId } = useActiveHq();

  const {
    data: response,
    isLoading,
    isFetching,
  } = useStaff(hqOrganizationId, activeScopeId);
  const canManage = useCanManageStaff();
  const staff = (response?.data ?? []) as unknown as Staff[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(
    undefined,
  );
  const [staffToDelete, setStaffToDelete] = useState<Staff | undefined>(
    undefined,
  );
  const deleteStaff = useDeleteStaff();

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
      className="flex min-w-0 flex-col gap-6 p-4"
    >
      <StaffPageHeader canManage={canManage} onInviteClick={openCreate} />

      <Tabs className="min-w-0" defaultValue="directory">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTab value="directory">Directory</TabsTab>
          <TabsTab value="attendance">Attendance</TabsTab>
        </TabsList>

        <TabsPanel className="min-w-0" value="directory">
          <StaffDirectory
            staff={staff}
            hqOrganizationId={hqOrganizationId}
            canManage={canManage}
            isLoading={isLoading || isFetching}
            onAddClick={openCreate}
            onEdit={openEdit}
            onDelete={setStaffToDelete}
          />
        </TabsPanel>

        <TabsPanel className="min-w-0" value="attendance">
          <AttendanceTracker
            staff={staff}
            hqOrganizationId={hqOrganizationId}
            canMark={canManage}
          />
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
