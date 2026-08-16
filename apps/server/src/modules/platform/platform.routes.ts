import { createRouter } from "../../core";
import { onboardingRoutes } from "./onboarding/onboarding.routes";
import { propertyRoutes } from "./property/property.routes";

export const platformRoutes = createRouter()
  .route("/onboarding", onboardingRoutes)
  .route("/properties", propertyRoutes);
