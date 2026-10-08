import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  slicingDefinition,
} from "../../shared";

export function SlicingListPage() {
  return <FactoryListing definition={slicingDefinition} />;
}

export function AddSlicingPage() {
  return <FactoryProcessCreatePage definition={slicingDefinition} />;
}

export function EditSlicingPage() {
  return <FactoryForm definition={slicingDefinition} mode="edit" />;
}

export function ViewSlicingPage() {
  return <FactoryForm definition={slicingDefinition} mode="view" />;
}
