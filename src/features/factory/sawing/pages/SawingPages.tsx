export * from "./SawingListPage";
import { FactoryProcessCreatePage, sawingDefinition } from "../../shared";
import { SawingEditPage } from "./SawingEditPage";

export function AddSawingPage() {
  return <FactoryProcessCreatePage definition={sawingDefinition} />;
}

export function EditSawingPage() {
  return <SawingEditPage />;
}

export { SawingViewPage as ViewSawingPage } from "./SawingViewPage";
