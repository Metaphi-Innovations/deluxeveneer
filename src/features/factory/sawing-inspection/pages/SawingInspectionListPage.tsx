import { FactoryListing } from "../../shared/FactoryListing";
import { sawingInspectionDefinition } from "../../shared/factoryDefinitions";

export function SawingInspectionListPage() {
  return <FactoryListing definition={sawingInspectionDefinition} />;
}
