export * from "./SawingListPage";
import { FactoryForm, FactoryProcessCreatePage, sawingDefinition } from "../../shared";

export function AddSawingPage() {
  return <FactoryProcessCreatePage definition={sawingDefinition} />;
}

export function EditSawingPage() {
  return <FactoryForm definition={sawingDefinition} mode="edit" />;
}

export { SawingViewPage as ViewSawingPage } from "./SawingViewPage";
