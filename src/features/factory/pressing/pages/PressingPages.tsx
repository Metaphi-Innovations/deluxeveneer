import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  pressingDefinition,
} from "../../shared";

export function PressingListPage() {
  return <FactoryListing definition={pressingDefinition} />;
}

export function AddPressingPage() {
  return <FactoryProcessCreatePage definition={pressingDefinition} />;
}

export function EditPressingPage() {
  return <FactoryForm definition={pressingDefinition} mode="edit" />;
}

export function ViewPressingPage() {
  return <FactoryForm definition={pressingDefinition} mode="view" />;
}
