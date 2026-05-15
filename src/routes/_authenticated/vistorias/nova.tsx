import { createFileRoute } from "@tanstack/react-router";
import { InspectionWizard } from "@/components/inspection/InspectionWizard";

export const Route = createFileRoute("/_authenticated/vistorias/nova")({
  component: () => <InspectionWizard />,
});
