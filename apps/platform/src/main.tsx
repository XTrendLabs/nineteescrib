import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";
import { ErrorFallback } from "./shared/components/error-fallback";
import { Loading } from "./shared/components/loading";
import { NotFound } from "./shared/components/not-found";
import { queryClient } from "./shared/lib/query-client";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPendingComponent: Loading,
  defaultErrorComponent: ErrorFallback,
  defaultNotFoundComponent: NotFound,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
