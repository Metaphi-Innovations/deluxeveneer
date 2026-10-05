import { FactoryListing } from "../../shared/FactoryListing";
import {
  dryingInspectionDefinition,
  sawingInspectionDefinition,
} from "../../shared/factoryDefinitions";

export function SawingInspectionListPage() {
  return <FactoryListing definition={sawingInspectionDefinition} />;
}

export function DryingInspectionListPage() {
  return <FactoryListing definition={dryingInspectionDefinition} />;
}

export const InspectionListPage = DryingInspectionListPage;
