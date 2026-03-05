import { useMemo } from "react";
import { toast } from "sonner";

const AUTO_CLOSE_DURATION = 4500;

export interface WorkbenchToastAction {
  label: string;
  onClick: () => void;
}

export interface WorkbenchToastPayload {
  title: string;
  message?: string;
  action?: WorkbenchToastAction;
}

export interface WorkbenchToastApi {
  success: (payload: WorkbenchToastPayload) => void;
  info: (payload: WorkbenchToastPayload) => void;
  warning: (payload: WorkbenchToastPayload) => void;
  error: (payload: WorkbenchToastPayload) => void;
}

function showWorkbenchToast(tone: keyof WorkbenchToastApi, payload: WorkbenchToastPayload) {
  const isPersistent = tone === "warning" || tone === "error";
  const options = {
    description: payload.message,
    duration: isPersistent ? Infinity : AUTO_CLOSE_DURATION,
    closeButton: isPersistent,
  };

  if (payload.action !== undefined) {
    const { action } = payload;
    let toastId: string | number | undefined;
    const optionsWithAction = {
      ...options,
      action: {
        label: action.label,
        onClick: () => {
          action.onClick();

          if (toastId !== undefined) {
            toast.dismiss(toastId);
          }
        },
      },
    };

    if (tone === "success") {
      toastId = toast.success(payload.title, optionsWithAction);
      return;
    }

    if (tone === "info") {
      toastId = toast.info(payload.title, optionsWithAction);
      return;
    }

    if (tone === "warning") {
      toastId = toast.warning(payload.title, optionsWithAction);
      return;
    }

    toastId = toast.error(payload.title, optionsWithAction);
    return;
  }

  if (tone === "success") {
    toast.success(payload.title, options);
    return;
  }

  if (tone === "info") {
    toast.info(payload.title, options);
    return;
  }

  if (tone === "warning") {
    toast.warning(payload.title, options);
    return;
  }

  toast.error(payload.title, options);
}

export const workbenchToast: WorkbenchToastApi = {
  success: payload => showWorkbenchToast("success", payload),
  info: payload => showWorkbenchToast("info", payload),
  warning: payload => showWorkbenchToast("warning", payload),
  error: payload => showWorkbenchToast("error", payload),
};

export function useWorkbenchToast() {
  return useMemo<WorkbenchToastApi>(() => workbenchToast, []);
}
