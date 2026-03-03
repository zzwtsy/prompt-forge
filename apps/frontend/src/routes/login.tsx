import { createFileRoute, redirect } from "@tanstack/react-router";
import { sanitizeRedirectTarget } from "@/lib/auth-redirect";
import { LoginPage } from "@/page/login";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  beforeLoad: ({ context, search }) => {
    if (context.auth.isPending) {
      return;
    }

    if (context.auth.isAuthenticated) {
      throw redirect({ href: sanitizeRedirectTarget(search.redirect) });
    }
  },
  component: function LoginRouteComponent() {
    const search = Route.useSearch();
    const { auth } = Route.useRouteContext();
    return (
      <LoginPage
        redirect={search.redirect}
        isAuthPending={auth.isPending}
      />
    );
  },
});
