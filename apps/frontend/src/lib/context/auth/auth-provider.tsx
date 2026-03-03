import type { ReactNode } from "react";
import type { AuthSnapshot } from "./auth-context";
import { useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const sessionState = authClient.useSession();
  const sessionData = sessionState.data;

  const value = useMemo<AuthSnapshot>(() => {
    return {
      isAuthenticated: Boolean(sessionData?.user && sessionData?.session),
      isPending: sessionState.isPending,
      user: sessionData?.user ?? null,
      session: sessionData?.session ?? null,
    };
  }, [sessionData, sessionState.isPending]);

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}
