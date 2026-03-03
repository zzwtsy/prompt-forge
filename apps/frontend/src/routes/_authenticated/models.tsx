import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/page/workbench";

export const Route = createFileRoute("/_authenticated/models")({
  component: ModelsPage,
});
