import {
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { WorkbenchLayoutPage } from "@/page/workbench";

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

    if (auth.isPending) {
      return <AuthLoadingScreen />;
    }

    return <WorkbenchLayoutPage />;
  },
});
