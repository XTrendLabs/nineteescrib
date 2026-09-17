import { env } from "@propertyos/env/web";

/**
 * Whether the public booking engine is switched on.
 *
 * Read through one export rather than reaching for the env var at each call
 * site, so turning the feature on later is one grep with one answer.
 */
export const isBookingEngineEnabled = env.VITE_ENABLE_BOOKING_ENGINE;
