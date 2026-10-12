import { MasterFormPage } from "../../../shared";
import { departmentMasterDefinition } from "../../mock/departmentMasterData";

export function ViewDepartmentMasterPage() {
  return <MasterFormPage definition={departmentMasterDefinition} mode="view" />;
}
