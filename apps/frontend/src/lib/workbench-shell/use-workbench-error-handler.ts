import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { buildLoginRedirectTarget } from "@/lib/auth-redirect";
import { useWorkbenchShellStore } from "@/lib/store";
import { WORKBENCH_TAB_PATHS } from "./constants";
import { useWorkbenchRequestError } from "./use-workbench-request-error";

export function useWorkbenchErrorHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const showNotice = useWorkbenchShellStore(state => state.showNotice);

  const navigateToTab = useCallback((tab: keyof typeof WORKBENCH_TAB_PATHS) => {
    void navigate({
      to: WORKBENCH_TAB_PATHS[tab],
    });
  }, [navigate]);

  const redirectToLogin = useCallback(() => {
    void navigate({
      to: "/login",
      search: {
        redirect: buildLoginRedirectTarget(location),
      },
      replace: true,
    });
  }, [location, navigate]);

  const { handleRequestError } = useWorkbenchRequestError({
    showNotice,
    navigateToTab,
    redirectToLogin,
  });

  return {
    handleRequestError,
  };
}
