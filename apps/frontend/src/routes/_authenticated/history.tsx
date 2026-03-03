import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/page/workbench";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});
