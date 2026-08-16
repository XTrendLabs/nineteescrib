import type { auth } from "@propertyos/auth";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type AppEnv = {
  Variables: {
    session: NonNullable<AuthSession>;
  };
};
