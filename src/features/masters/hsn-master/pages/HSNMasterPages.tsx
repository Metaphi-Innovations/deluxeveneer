import { MasterFormPage, MasterListingPage } from "../../shared";
import { hsnMasterDefinition } from "../mock/hsnMasterData";

export function HSNMasterListPage() {
  return <MasterListingPage definition={hsnMasterDefinition} />;
}

export function AddHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="add" />;
}

export function EditHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="edit" />;
}

export function ViewHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="view" />;
}
