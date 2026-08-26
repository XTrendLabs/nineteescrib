import { createDb } from "@propertyos/db";
import * as schema from "@propertyos/db/schema/auth";
import * as organizationSchema from "@propertyos/db/schema/organization";
import { env } from "@propertyos/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

  // Derive cookie behaviour from the actual deployment URLs rather than
  // NODE_ENV, which is easy to leave unset on a host and would silently
  // downgrade cookies to a config that breaks the OAuth state round trip.
  const isSecure =
    new URL(env.BETTER_AUTH_URL).protocol === "https:" &&
    new URL(env.CORS_ORIGIN).protocol === "https:";

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
    // Without this, OAuth failures fall back to `${baseURL}/error`, stranding
    // the user on the API host instead of the app they signed in from.
    onAPIError: {
      errorURL: `${env.CORS_ORIGIN}/auth/login`,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 15 * 60,
      },
    },
    advanced: {
      // The app and API are on separate origins, so the session and OAuth
      // state cookies must be SameSite=None to survive the cross-site
      // redirect back from Google. That requires Secure, which browsers only
      // honour over HTTPS -- Safari rejects such cookies outright on
      // http://localhost -- so fall back to Lax when not on HTTPS.
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: isSecure
        ? { sameSite: "none" as const, secure: true, httpOnly: true }
        : { sameSite: "lax" as const, secure: false, httpOnly: true },
    },
    plugins: [
      organization({
        creatorRole: "owner",
        // Each property organization can group its staff into teams
        // (housekeeping, front desk, ...).
        teams: {
          enabled: true,
        },
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
              // An organization is either a single property or the HQ that
              // groups a set of them. See the schema note in
              // packages/db/src/schema/organization.ts.
              kind: {
                type: "string",
                required: false,
                defaultValue: "property",
              },
              parentOrganizationId: {
                type: "string",
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
