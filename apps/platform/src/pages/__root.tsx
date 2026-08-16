import { FeedbackPopup } from "@propertyos/ui/components/feedback-popup";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/components/theme-provider";
import { ErrorFallback } from "@/shared/components/error-fallback";
import { Loading } from "@/shared/components/loading";
import { NotFound } from "@/shared/components/not-found";
import { AppProviders } from "@/shared/providers/app-providers";

import "../index.css";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  pendingComponent: Loading,
  errorComponent: ErrorFallback,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        title: "propertyos",
      },
      {
        name: "description",
        content: "propertyos is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <AppProviders>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          storageKey="vite-ui-theme"
        >
          <div className="grid h-svh grid-rows-[auto_1fr]">
            <Outlet />
          </div>
          <FeedbackPopup />
        </ThemeProvider>
      </AppProviders>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
