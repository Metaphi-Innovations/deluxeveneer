import { MasterFormPage, MasterListingPage } from "../../shared";
import { unitMasterDefinition } from "../mock/unitMasterData";

export function UnitMasterListPage() {
  return <MasterListingPage definition={unitMasterDefinition} />;
}

export function AddUnitMasterPage() {
  return <MasterFormPage definition={unitMasterDefinition} mode="add" />;
}

export function EditUnitMasterPage() {
  return <MasterFormPage definition={unitMasterDefinition} mode="edit" />;
}

export function ViewUnitMasterPage() {
  return <MasterFormPage definition={unitMasterDefinition} mode="view" />;
}
