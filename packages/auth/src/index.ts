import { createDb } from "@propertyos/db";
import * as schema from "@propertyos/db/schema/auth";
import * as organizationSchema from "@propertyos/db/schema/organization";
import { env } from "@propertyos/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();
  const isProduction = env.NODE_ENV === "production";

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
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 15 * 60,
      },
    },
    advanced: {
      // Cross-site cookies (SameSite=None) require Secure, which browsers only
      // honor over HTTPS. Safari rejects them outright on http://localhost, so
      // fall back to Lax in development.
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: isProduction
        ? { sameSite: "none" as const, secure: true, httpOnly: true }
        : { sameSite: "lax" as const, secure: false, httpOnly: true },
    },
    plugins: [
      organization({
        creatorRole: "owner",
        schema: {
          organization: {
            additionalFields: {
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
          member: {
            additionalFields: {
              title: {
                type: "string",
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
