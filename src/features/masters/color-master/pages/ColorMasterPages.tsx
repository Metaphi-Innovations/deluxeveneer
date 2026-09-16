import { MasterFormPage, MasterListingPage } from "../../shared";
import { colorMasterDefinition } from "../mock/colorMasterData";

export function ColorMasterListPage() {
  return <MasterListingPage definition={colorMasterDefinition} />;
}

export function AddColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="add" />;
}

export function EditColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="edit" />;
}

export function ViewColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="view" />;
}
