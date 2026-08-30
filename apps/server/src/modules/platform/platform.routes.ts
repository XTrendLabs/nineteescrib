import { createRouter } from "../../core";
import { attendanceRoutes } from "./attendance/attendance.routes";
import { expenseRoutes } from "./expense/expense.routes";
import { hqRoutes } from "./hq/hq.routes";
import { onboardingRoutes } from "./onboarding/onboarding.routes";
import { propertyRoutes } from "./property/property.routes";
import { roomRoutes } from "./room/room.routes";
import { memberRoutes } from "./settings/member.routes";
import { settingsRoutes } from "./settings/settings.routes";
import { staffRoutes } from "./staff/staff.routes";
import { vendorRoutes } from "./vendor/vendor.routes";

export const platformRoutes = createRouter()
  .route("/attendance", attendanceRoutes)
  .route("/expenses", expenseRoutes)
  .route("/hq", hqRoutes)
  .route("/onboarding", onboardingRoutes)
  .route("/properties", propertyRoutes)
  .route("/rooms", roomRoutes)
  .route("/settings", settingsRoutes)
  .route("/settings/members", memberRoutes)
  .route("/staff", staffRoutes)
  .route("/vendors", vendorRoutes);
