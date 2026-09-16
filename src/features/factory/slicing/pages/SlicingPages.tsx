import { FactoryForm, FactoryListing, slicingDefinition } from "../../shared";
import { SlicingCreatePage } from "./SlicingCreatePage";

export function SlicingListPage() {
  return <FactoryListing definition={slicingDefinition} />;
}

export function AddSlicingPage() {
  return <SlicingCreatePage />;
}

export function EditSlicingPage() {
  return <FactoryForm definition={slicingDefinition} mode="edit" />;
}

export function ViewSlicingPage() {
  return <FactoryForm definition={slicingDefinition} mode="view" />;
}
