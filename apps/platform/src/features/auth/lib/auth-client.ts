import { ac, roles } from "@propertyos/auth/permissions";
import { env } from "@propertyos/env/web";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  // The API lives on a different origin than the app, so the browser needs to
  // be told explicitly to send and store the session cookie.
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    organizationClient({
      // Same access-control definitions as the server, so
      // `checkRolePermission` can be evaluated client-side.
      ac,
      roles,
      schema: {
        organization: {
          additionalFields: {
            phoneNumber: { type: "string", required: false },
            phoneNumberVerifiedAt: { type: "date", required: false },
            // "hq" or "property" -- see packages/db/src/schema/organization.ts
            kind: { type: "string", required: false },
            parentOrganizationId: { type: "string", required: false },
          },
        },
        member: {
          additionalFields: {
            title: { type: "string", required: false },
          },
        },
      },
    }),
  ],
});
