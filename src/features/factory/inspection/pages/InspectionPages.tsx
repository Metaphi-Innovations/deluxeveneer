import { FactoryListing } from "../../shared/FactoryListing";
import { inspectionDefinition } from "../../shared/factoryDefinitions";

export function InspectionListPage() {
  return <FactoryListing definition={inspectionDefinition} />;
}
