import type { auth } from "@propertyos/auth";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type OrganizationAccess = {
  role: string;
  /** Rights come from the HQ above this organization, not from it directly. */
  viaHq: boolean;
  organization: {
    id: string;
    kind: string;
    parentOrganizationId: string | null;
  };
};

export type AppEnv = {
  Variables: {
    session: NonNullable<AuthSession>;
    access?: OrganizationAccess;
  };
};
