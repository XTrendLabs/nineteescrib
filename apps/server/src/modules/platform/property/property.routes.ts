import { propertyTypeValues } from "@propertyos/db/schema/property";
import z from "zod";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import { propertyService } from "./property.service";

const createPropertySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  propertyType: z.enum(propertyTypeValues),
  addressLine1: z.string().min(2),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});

export const propertyRoutes = createRouter()
  .use(requireSession)
  .post("/", async (c) => {
    const body = createPropertySchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const result = await propertyService.create(body.data);

    return c.json(ok(result));
  });
