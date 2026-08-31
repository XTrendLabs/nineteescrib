import { createDb } from "@propertyos/db";
import * as schema from "@propertyos/db/schema/auth";
import * as organizationSchema from "@propertyos/db/schema/organization";
import { env } from "@propertyos/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { ac, roles } from "./permissions";

export function createAuth() {
  const db = createDb();

  // Derive cookie behaviour from the actual deployment URLs rather than
  // NODE_ENV, which is easy to leave unset on a host and would silently
  // downgrade cookies to a config that breaks the OAuth state round trip.
  const apiUrl = new URL(env.BETTER_AUTH_URL);
  const appUrl = new URL(env.CORS_ORIGIN);

  // A differing port or host makes the app and API cross-site as far as
  // cookies are concerned, even on localhost. The browser then drops a
  // SameSite=Lax cookie from every fetch the app makes, so the user appears
  // signed out -- Chrome enforces this, Firefox is laxer, which is why it can
  // look like a browser-specific bug.
  const isCrossSite =
    apiUrl.hostname !== appUrl.hostname || apiUrl.port !== appUrl.port;

  // SameSite=None requires Secure. Browsers treat localhost as a trustworthy
  // origin, so a Secure cookie is accepted there over plain http; anywhere
  // else it genuinely needs HTTPS.
  const isLocalhost =
    apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1";
  const canUseSecure = apiUrl.protocol === "https:" || isLocalhost;

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
      // The app and API sit on separate origins, so the session and OAuth
      // state cookies must be SameSite=None to be sent on the app's fetches
      // and to survive the redirect back from Google. Lax is only correct
      // when both are genuinely same-site.
      // Without a Domain attribute the session cookie is host-only to the API,
      // so the browser never sends it on requests from the app's own origin --
      // sign-in succeeds and the very next request looks signed out. Set
      // COOKIE_DOMAIN to the shared parent (".myapp.com") in that deployment.
      crossSubDomainCookies: env.COOKIE_DOMAIN
        ? { enabled: true, domain: env.COOKIE_DOMAIN }
        : { enabled: false },
      defaultCookieAttributes:
        isCrossSite && canUseSecure
          ? { sameSite: "none" as const, secure: true, httpOnly: true }
          : {
              sameSite: "lax" as const,
              secure: apiUrl.protocol === "https:",
              httpOnly: true,
            },
    },
    plugins: [
      organization({
        creatorRole: "owner",
        ac,
        roles,
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
