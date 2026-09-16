import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  splicingDefinition,
} from "../../shared";

export function SplicingListPage() {
  return <FactoryListing definition={splicingDefinition} />;
}

export function AddSplicingPage() {
  return <FactoryProcessCreatePage definition={splicingDefinition} />;
}

export function EditSplicingPage() {
  return <FactoryForm definition={splicingDefinition} mode="edit" />;
}

export function ViewSplicingPage() {
  return <FactoryForm definition={splicingDefinition} mode="view" />;
}
