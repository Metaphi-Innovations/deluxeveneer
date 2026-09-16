import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  marquetryDefinition,
} from "../../shared";

export function MarquetryListPage() {
  return <FactoryListing definition={marquetryDefinition} />;
}

export function AddMarquetryPage() {
  return <FactoryProcessCreatePage definition={marquetryDefinition} />;
}

export function EditMarquetryPage() {
  return <FactoryForm definition={marquetryDefinition} mode="edit" />;
}

export function ViewMarquetryPage() {
  return <FactoryForm definition={marquetryDefinition} mode="view" />;
}
