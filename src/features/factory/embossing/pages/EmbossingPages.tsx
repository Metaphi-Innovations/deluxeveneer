import {
  embossingDefinition,
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
} from "../../shared";

export function EmbossingListPage() {
  return <FactoryListing definition={embossingDefinition} />;
}

export function AddEmbossingPage() {
  return <FactoryProcessCreatePage definition={embossingDefinition} />;
}

export function EditEmbossingPage() {
  return <FactoryForm definition={embossingDefinition} mode="edit" />;
}

export function ViewEmbossingPage() {
  return <FactoryForm definition={embossingDefinition} mode="view" />;
}
