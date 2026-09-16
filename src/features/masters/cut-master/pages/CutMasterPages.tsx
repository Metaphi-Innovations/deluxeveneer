import { MasterFormPage, MasterListingPage } from "../../shared";
import { cutMasterDefinition } from "../mock/cutMasterData";

export function CutMasterListPage() {
  return <MasterListingPage definition={cutMasterDefinition} />;
}

export function AddCutMasterPage() {
  return <MasterFormPage definition={cutMasterDefinition} mode="add" />;
}

export function EditCutMasterPage() {
  return <MasterFormPage definition={cutMasterDefinition} mode="edit" />;
}

export function ViewCutMasterPage() {
  return <MasterFormPage definition={cutMasterDefinition} mode="view" />;
}
