import { appRoleValues } from "@propertyos/auth/permissions";
import z from "zod";

/**
 * The roles a member can be given from the directory.
 *
 * These are the app's own roles, the same set the server authorizes against --
 * not a separate "admin"/"member" vocabulary, which would have to be mapped
 * back and could disagree with what permissions actually apply.
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(appRoleValues),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
