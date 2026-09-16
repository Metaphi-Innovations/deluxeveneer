import { MasterFormPage, MasterListingPage } from "../../shared";
import { gradeMasterDefinition } from "../mock/gradeMasterData";

export function GradeMasterListPage() {
  return <MasterListingPage definition={gradeMasterDefinition} />;
}

export function AddGradeMasterPage() {
  return <MasterFormPage definition={gradeMasterDefinition} mode="add" />;
}

export function EditGradeMasterPage() {
  return <MasterFormPage definition={gradeMasterDefinition} mode="edit" />;
}

export function ViewGradeMasterPage() {
  return <MasterFormPage definition={gradeMasterDefinition} mode="view" />;
}
