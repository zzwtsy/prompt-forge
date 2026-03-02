import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-provider";
import { router } from "@/router";

export function AppRouter() {
  const auth = useAuth();

  useEffect(() => {
    void router.invalidate();
  }, [auth.isAuthenticated, auth.isPending]);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated: auth.isAuthenticated,
          isPending: auth.isPending,
        },
      }}
    />
  );
}
