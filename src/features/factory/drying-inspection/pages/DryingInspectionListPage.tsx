import { FactoryListing } from "../../shared/FactoryListing";
import { dryingInspectionDefinition } from "../../shared/factoryDefinitions";

export function DryingInspectionListPage() {
  return <FactoryListing definition={dryingInspectionDefinition} />;
}

export const InspectionListPage = DryingInspectionListPage;
