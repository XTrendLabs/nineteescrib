import z from "zod";

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

export const policiesSchema = z.object({
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutTime: z.string().min(1, "Check-out time is required"),
  minStayNights: optionalPositiveInt,
  maxStayNights: optionalPositiveInt,
});

export type PoliciesValues = z.infer<typeof policiesSchema>;
