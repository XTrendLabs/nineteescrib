import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";

import { AttendanceMarkDialog } from "@/features/staff/components/attendance-mark-dialog";
import { AttendanceTracker } from "@/features/staff/components/attendance-tracker";
import { InviteStaffDialog } from "@/features/staff/components/invite-staff-dialog";
import { RolesPermissions } from "@/features/staff/components/roles-permissions";
import { StaffDirectory } from "@/features/staff/components/staff-directory";
import { StaffPageHeader } from "@/features/staff/components/staff-page-header";
import { buildStaffMembers, MOCK_ROLES } from "@/features/staff/lib/mock-data";

export const Route = createFileRoute("/(protected)/staff/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [staff, setStaff] = useState(() => buildStaffMembers());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tab, setTab] = useState("directory");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <StaffPageHeader onInviteClick={() => setInviteOpen(true)} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList>
          <TabsTab value="directory">Directory</TabsTab>
          <TabsTab value="attendance">Attendance</TabsTab>
          <TabsTab value="roles">Roles & Permissions</TabsTab>
        </TabsList>

        <TabsPanel value="directory">
          <StaffDirectory
            staff={staff}
            onInviteClick={() => setInviteOpen(true)}
          />
        </TabsPanel>

        <TabsPanel value="attendance">
          <AttendanceTracker staff={staff} />
        </TabsPanel>

        <TabsPanel value="roles">
          <RolesPermissions roles={MOCK_ROLES} staff={staff} />
        </TabsPanel>
      </Tabs>

      <InviteStaffDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={(name, phone, role) => {
          setStaff((prev) => [
            {
              id: `pending-${Date.now()}`,
              fullName: name,
              phone,
              role,
              primaryPropertyId: "prop-1",
              primaryPropertyName: "Sunrise Villa - Goa",
              todayStatus: "present",
              joinedAt: new Date(),
              documents: [],
              workspaces: [],
              activity: [],
              status: "pending_invite",
            },
            ...prev,
          ]);
        }}
      />

      <AttendanceMarkDialog />
    </motion.div>
  );
}
