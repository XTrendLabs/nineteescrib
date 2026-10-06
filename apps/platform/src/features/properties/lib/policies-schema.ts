import z from "zod";

export const policiesSchema = z.object({
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutTime: z.string().min(1, "Check-out time is required"),
  minStayNights: z.coerce.number().int().positive().optional(),
  maxStayNights: z.coerce.number().int().positive().optional(),
});

export type PoliciesValues = z.infer<typeof policiesSchema>;
