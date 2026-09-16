import {
  cncFlutingDefinition,
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
} from "../../shared";

export function CNCFlutingListPage() {
  return <FactoryListing definition={cncFlutingDefinition} />;
}

export function AddCNCFlutingPage() {
  return <FactoryProcessCreatePage definition={cncFlutingDefinition} />;
}

export function EditCNCFlutingPage() {
  return <FactoryForm definition={cncFlutingDefinition} mode="edit" />;
}

export function ViewCNCFlutingPage() {
  return <FactoryForm definition={cncFlutingDefinition} mode="view" />;
}
