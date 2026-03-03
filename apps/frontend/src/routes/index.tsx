import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isPending) {
      return;
    }

    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/optimize" });
    }

    throw redirect({
      to: "/login",
      search: {
        redirect: "/optimize",
      },
    });
  },
  component: AuthLoadingScreen,
});
