import { MasterFormPage } from "../../../shared";
import { gstMasterDefinition } from "../../gstMasterDefinition";

export function ViewGSTMasterPage() {
  return <MasterFormPage definition={gstMasterDefinition} mode="view" />;
}
