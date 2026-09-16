import { MasterFormPage, MasterListingPage } from "../../shared";
import { departmentMasterDefinition } from "../mock/departmentMasterData";

export function DepartmentMasterListPage() {
  return <MasterListingPage definition={departmentMasterDefinition} />;
}

export function AddDepartmentMasterPage() {
  return <MasterFormPage definition={departmentMasterDefinition} mode="add" />;
}

export function EditDepartmentMasterPage() {
  return <MasterFormPage definition={departmentMasterDefinition} mode="edit" />;
}

export function ViewDepartmentMasterPage() {
  return <MasterFormPage definition={departmentMasterDefinition} mode="view" />;
}
