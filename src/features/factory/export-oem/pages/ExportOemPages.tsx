import {
  exportOemDefinition,
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
} from "../../shared";

export function ExportOemListPage() {
  return <FactoryListing definition={exportOemDefinition} />;
}

export function AddExportOemPage() {
  return <FactoryProcessCreatePage definition={exportOemDefinition} />;
}

export function EditExportOemPage() {
  return <FactoryForm definition={exportOemDefinition} mode="edit" />;
}

export function ViewExportOemPage() {
  return <FactoryForm definition={exportOemDefinition} mode="view" />;
}
