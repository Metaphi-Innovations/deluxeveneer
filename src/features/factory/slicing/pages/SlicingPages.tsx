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
  return <FactoryProcessCreatePage definition={slicingDefinition} mode="edit" />;
}

export { SlicingViewPage as ViewSlicingPage } from "./SlicingViewPage";
