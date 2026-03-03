import { use } from "react";
import { AuthContext } from "./auth-context";

export function useAuth() {
  const value = use(AuthContext);

  if (value === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
