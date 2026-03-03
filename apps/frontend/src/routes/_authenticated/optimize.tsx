import { createFileRoute } from "@tanstack/react-router";
import { OptimizePage } from "@/page/workbench";

export const Route = createFileRoute("/_authenticated/optimize")({
  component: OptimizePage,
});
