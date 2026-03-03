import { createContext } from "react";

export interface AuthSnapshot {
  isAuthenticated: boolean;
  isPending: boolean;
  user: unknown | null;
  session: unknown | null;
}

export const AuthContext = createContext<AuthSnapshot | null>(null);
