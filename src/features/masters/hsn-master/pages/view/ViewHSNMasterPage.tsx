import { MasterFormPage } from "../../../shared";
import { hsnMasterDefinition } from "../../hsnMasterDefinition";

export function ViewHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="view" />;
}
