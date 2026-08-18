import { createFileRoute, Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";

import { SettingsNav } from "@/features/settings/components/settings-nav";

export const Route = createFileRoute("/(protected)/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex min-h-0 flex-1 flex-col gap-6 p-4"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 sm:flex-row">
        <div className="shrink-0 sm:sticky sm:top-0 sm:self-start">
          <SettingsNav />
        </div>
        <div className="no-scrollbar min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </motion.div>
  );
}
