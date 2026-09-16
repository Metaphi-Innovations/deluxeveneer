import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  sawingDefinition,
} from "../../shared";

export function SawingListPage() {
  return <FactoryListing definition={sawingDefinition} />;
}

export function AddSawingPage() {
  return <FactoryProcessCreatePage definition={sawingDefinition} />;
}

export function EditSawingPage() {
  return <FactoryForm definition={sawingDefinition} mode="edit" />;
}

export function ViewSawingPage() {
  return <FactoryForm definition={sawingDefinition} mode="view" />;
}
