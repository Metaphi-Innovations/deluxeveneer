import { MasterFormPage } from "../../../shared";
import { colorMasterDefinition } from "../../colorMasterDefinition";

export function ViewColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="view" />;
}
