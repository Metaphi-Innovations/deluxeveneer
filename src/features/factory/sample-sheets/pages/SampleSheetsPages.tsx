import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  sampleSheetsDefinition,
} from "../../shared";

export function SampleSheetsListPage() {
  return <FactoryListing definition={sampleSheetsDefinition} />;
}

export function AddSampleSheetsPage() {
  return <FactoryProcessCreatePage definition={sampleSheetsDefinition} />;
}

export function EditSampleSheetsPage() {
  return <FactoryForm definition={sampleSheetsDefinition} mode="edit" />;
}

export function ViewSampleSheetsPage() {
  return <FactoryForm definition={sampleSheetsDefinition} mode="view" />;
}
