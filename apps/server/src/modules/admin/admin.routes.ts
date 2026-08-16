import { createRouter } from "../../core";

// No admin-facing endpoints yet — apps/admin is currently a static shell
// (see docs/MODULES.md §18). Mounted now so /api/admin/* exists as a real,
// separately-authenticated boundary when superadmin endpoints land.
export const adminRoutes = createRouter();
