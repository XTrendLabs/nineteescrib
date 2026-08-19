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
      schema: {
        organization: {
          additionalFields: {
            phoneNumber: { type: "string", required: false },
            phoneNumberVerifiedAt: { type: "date", required: false },
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
