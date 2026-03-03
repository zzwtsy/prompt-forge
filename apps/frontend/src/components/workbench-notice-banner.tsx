import type { GlobalNotice } from "@/lib/workbench-shell";
import { AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkbenchNoticeBannerProps {
  notice: GlobalNotice;
  onClose: () => void;
}

export function WorkbenchNoticeBanner(props: WorkbenchNoticeBannerProps) {
  const { notice, onClose } = props;

  const toneClassName = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  }[notice.tone];

  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm shadow-sm", toneClassName)}>
      <div className="flex min-w-0 gap-2">
        {notice.tone === "error" || notice.tone === "warning"
          ? <AlertCircle className="mt-0.5 size-4 shrink-0" />
          : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
        <div className="grid gap-0.5">
          <p className="font-medium">{notice.title}</p>
          <p className="text-xs/5 opacity-90">{notice.message}</p>
          {notice.onAction !== undefined && notice.actionLabel !== undefined && (
            <button
              type="button"
              onClick={notice.onAction}
              className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium underline underline-offset-2"
            >
              {notice.actionLabel}
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
      <button type="button" onClick={onClose} className="rounded p-1 opacity-70 transition hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}
