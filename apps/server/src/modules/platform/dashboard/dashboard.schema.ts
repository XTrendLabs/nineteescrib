import { z } from "zod";

/** A calendar day, matching the `date` columns the dashboard aggregates over. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const overviewQuerySchema = z
  .object({
    activeOrganizationId: z.string().optional(),
    /** "all" and an absent value both mean the whole portfolio. */
    propertyId: z.string().optional(),
    from: isoDate,
    to: isoDate,
  })
  .refine((value) => value.from <= value.to, {
    message: "`from` must not be after `to`",
    path: ["from"],
  });
