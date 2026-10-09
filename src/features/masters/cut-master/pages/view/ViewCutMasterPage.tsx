import { MasterFormPage } from "../../../shared";
import { cutMasterDefinition } from "../../cutMasterDefinition";

export function ViewCutMasterPage() {
  return <MasterFormPage definition={cutMasterDefinition} mode="view" />;
}
