import z from "zod";

export const taxDetailsSchema = z.object({
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  billingAddress: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankName: z.string().optional(),
});

export type TaxDetailsValues = z.infer<typeof taxDetailsSchema>;
