import type { AuthSnapshot } from "@/lib/context/auth";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/sonner";

export type RouterAuthContext = Pick<AuthSnapshot, "isAuthenticated" | "isPending">;

export interface RouterContext {
  auth: RouterAuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    return (
      <>
        <Outlet />
        <Toaster position="top-right" />
        <TanStackRouterDevtools />
      </>
    );
  },
});
