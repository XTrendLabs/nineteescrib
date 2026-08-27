import { AppError, createRouter, ok, requireSession } from "../../../core";
import { hqService } from "./hq.service";

export const hqRoutes = createRouter()
  .use(requireSession)
  // The HQs the signed-in user belongs to.
  .get("/", async (c) => {
    const session = c.get("session");
    const result = await hqService.listForUser(session.user.id);
    return c.json(ok(result));
  })
  // Every property under one HQ -- the "view all" surface.
  .get("/:id/properties", async (c) => {
    const session = c.get("session");
    const id = c.req.param("id");
    if (!id) {
      throw AppError.validation("An HQ id is required");
    }

    const result = await hqService.listProperties(id, session.user.id);
    return c.json(ok(result));
  });
