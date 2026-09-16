import { MasterFormPage, MasterListingPage } from "../../shared";
import { gstMasterDefinition } from "../mock/gstMasterData";

export function GSTMasterListPage() {
  return <MasterListingPage definition={gstMasterDefinition} />;
}

export function AddGSTMasterPage() {
  return <MasterFormPage definition={gstMasterDefinition} mode="add" />;
}

export function EditGSTMasterPage() {
  return <MasterFormPage definition={gstMasterDefinition} mode="edit" />;
}

export function ViewGSTMasterPage() {
  return <MasterFormPage definition={gstMasterDefinition} mode="view" />;
}
