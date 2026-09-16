import {
  dryingDefinition,
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
} from "../../shared";

export function DryingListPage() {
  return <FactoryListing definition={dryingDefinition} />;
}

export function AddDryingPage() {
  return <FactoryProcessCreatePage definition={dryingDefinition} />;
}

export function EditDryingPage() {
  return <FactoryForm definition={dryingDefinition} mode="edit" />;
}

export function ViewDryingPage() {
  return <FactoryForm definition={dryingDefinition} mode="view" />;
}
