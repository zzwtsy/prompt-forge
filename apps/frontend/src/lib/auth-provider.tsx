import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { authClient } from "@/lib/auth-client";

export interface AuthSnapshot {
  isAuthenticated: boolean;
  isPending: boolean;
  user: unknown | null;
  session: unknown | null;
}

const AuthContext = createContext<AuthSnapshot | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const sessionState = authClient.useSession();
  const sessionData = sessionState.data as { user?: unknown; session?: unknown } | null | undefined;

  const value = useMemo<AuthSnapshot>(() => {
    return {
      isAuthenticated: Boolean(sessionData?.user && sessionData?.session),
      isPending: sessionState.isPending,
      user: sessionData?.user ?? null,
      session: sessionData?.session ?? null,
    };
  }, [sessionData, sessionState.isPending]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
