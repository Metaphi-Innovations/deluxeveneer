import {
  FactoryForm,
  FactoryListing,
  pressingDefinition,
} from "../../shared";
import { CreatePressingPage } from "../CreatePressingPage";

export function PressingListPage() {
  return <FactoryListing definition={pressingDefinition} />;
}

export function AddPressingPage() {
  return <CreatePressingPage />;
}

export function EditPressingPage() {
  return <FactoryForm definition={pressingDefinition} mode="edit" />;
}

export function ViewPressingPage() {
  return <FactoryForm definition={pressingDefinition} mode="view" />;
}
