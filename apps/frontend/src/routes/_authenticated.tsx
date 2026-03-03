import {
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import {
  resetOptimizeSessionStore,
  resetWorkbenchShellStore,
} from "@/lib/store";
import { WorkbenchLayoutPage } from "@/page/workbench-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isPending) {
      return;
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: function AuthenticatedLayout() {
    const { auth } = Route.useRouteContext();

    useEffect(() => {
      return () => {
        resetOptimizeSessionStore();
        resetWorkbenchShellStore();
      };
    }, []);

    if (auth.isPending) {
      return <AuthLoadingScreen />;
    }

    return <WorkbenchLayoutPage />;
  },
});
