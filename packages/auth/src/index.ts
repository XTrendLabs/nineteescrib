import { createDb } from "@propertyos/db";
import * as schema from "@propertyos/db/schema/auth";
import * as organizationSchema from "@propertyos/db/schema/organization";
import { env } from "@propertyos/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: { ...schema, ...organizationSchema },
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        allowDifferentEmails: false,
      },
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      organization({
        creatorRole: "owner",
        schema: {
          member: {
            additionalFields: {
              title: {
                type: "string",
                required: false,
              },
              phoneNumber: {
                type: "string",
                required: false,
              },
              phoneNumberVerifiedAt: {
                type: "date",
                required: false,
              },
            },
          },
        },
      }),
    ],
  });
}

export const auth = createAuth();
