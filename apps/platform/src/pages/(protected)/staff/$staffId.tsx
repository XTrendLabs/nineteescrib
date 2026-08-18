import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";

import { ActivityLogTab } from "@/features/staff/components/activity-log-tab";
import { DocumentsTab } from "@/features/staff/components/documents-tab";
import { PersonalInfoTab } from "@/features/staff/components/personal-info-tab";
import { StaffProfileHeader } from "@/features/staff/components/staff-profile-header";
import { WorkspacesTab } from "@/features/staff/components/workspaces-tab";
import { buildStaffMembers } from "@/features/staff/lib/mock-data";

export const Route = createFileRoute("/(protected)/staff/$staffId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { staffId } = Route.useParams();
  const staff = useMemo(() => buildStaffMembers(), []);
  const member = staff.find((s) => s.id === staffId);

  if (!member) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <StaffProfileHeader staff={member} />

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTab value="personal">Personal</TabsTab>
          <TabsTab value="documents">Documents</TabsTab>
          <TabsTab value="workspaces">Workspaces</TabsTab>
          <TabsTab value="activity">Activity Log</TabsTab>
        </TabsList>

        <TabsPanel value="personal">
          <PersonalInfoTab staff={member} />
        </TabsPanel>
        <TabsPanel value="documents">
          <DocumentsTab staff={member} />
        </TabsPanel>
        <TabsPanel value="workspaces">
          <WorkspacesTab staff={member} />
        </TabsPanel>
        <TabsPanel value="activity">
          <ActivityLogTab staff={member} />
        </TabsPanel>
      </Tabs>
    </motion.div>
  );
}
