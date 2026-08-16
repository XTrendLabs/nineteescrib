import { env } from "@propertyos/env/web";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    organizationClient({
      schema: {
        member: {
          additionalFields: {
            title: { type: "string", required: false },
            phoneNumber: { type: "string", required: false },
            phoneNumberVerifiedAt: { type: "date", required: false },
          },
        },
      },
    }),
  ],
});
