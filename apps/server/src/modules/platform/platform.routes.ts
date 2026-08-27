import { createRouter } from "../../core";
import { hqRoutes } from "./hq/hq.routes";
import { onboardingRoutes } from "./onboarding/onboarding.routes";
import { propertyRoutes } from "./property/property.routes";
import { roomRoutes } from "./room/room.routes";
import { staffRoutes } from "./staff/staff.routes";

export const platformRoutes = createRouter()
  .route("/hq", hqRoutes)
  .route("/onboarding", onboardingRoutes)
  .route("/properties", propertyRoutes)
  .route("/rooms", roomRoutes)
  .route("/staff", staffRoutes);
