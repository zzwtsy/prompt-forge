import type { AuthSnapshot } from "@/lib/auth-provider";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export type RouterAuthContext = Pick<AuthSnapshot, "isAuthenticated" | "isPending">;

export interface RouterContext {
  auth: RouterAuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    );
  },
});
