import { createRouter } from "../../core";
import { onboardingRoutes } from "./onboarding/onboarding.routes";
import { propertyRoutes } from "./property/property.routes";
import { roomRoutes } from "./room/room.routes";

export const platformRoutes = createRouter()
  .route("/onboarding", onboardingRoutes)
  .route("/properties", propertyRoutes)
  .route("/rooms", roomRoutes);
