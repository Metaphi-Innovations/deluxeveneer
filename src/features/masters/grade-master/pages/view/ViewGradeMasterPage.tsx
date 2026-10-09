import { MasterFormPage } from "../../../shared";
import { gradeMasterDefinition } from "../../gradeMasterDefinition";

export function ViewGradeMasterPage() {
  return <MasterFormPage definition={gradeMasterDefinition} mode="view" />;
}
