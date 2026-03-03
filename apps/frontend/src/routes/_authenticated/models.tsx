import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/page/models";

export const Route = createFileRoute("/_authenticated/models")({
  component: ModelsPage,
});
