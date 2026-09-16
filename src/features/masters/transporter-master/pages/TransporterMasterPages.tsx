import { MasterFormPage, MasterListingPage } from "../../shared";
import { transporterMasterDefinition } from "../mock/transporterMasterData";

export function TransporterMasterListPage() {
  return <MasterListingPage definition={transporterMasterDefinition} />;
}

export function AddTransporterMasterPage() {
  return <MasterFormPage definition={transporterMasterDefinition} mode="add" />;
}

export function EditTransporterMasterPage() {
  return <MasterFormPage definition={transporterMasterDefinition} mode="edit" />;
}

export function ViewTransporterMasterPage() {
  return <MasterFormPage definition={transporterMasterDefinition} mode="view" />;
}
