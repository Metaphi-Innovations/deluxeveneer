import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  slicingDefinition,
} from "../../shared";
import { SlicingEditPage } from "./SlicingEditPage";

export function SlicingListPage() {
  return <FactoryListing definition={slicingDefinition} />;
}

export function AddSlicingPage() {
  return <FactoryProcessCreatePage definition={slicingDefinition} />;
}

export function EditSlicingPage() {
  return <SlicingEditPage />;
}

export function ViewSlicingPage() {
  return <FactoryForm definition={slicingDefinition} mode="view" />;
}
