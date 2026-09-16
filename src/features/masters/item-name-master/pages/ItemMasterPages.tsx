import { MasterFormPage, MasterListingPage } from "../../shared";
import { itemMasterDefinition } from "../mock/itemMasterData";

export function ItemMasterListPage() {
  return <MasterListingPage definition={itemMasterDefinition} />;
}

export function AddItemMasterPage() {
  return <MasterFormPage definition={itemMasterDefinition} mode="add" />;
}

export function EditItemMasterPage() {
  return <MasterFormPage definition={itemMasterDefinition} mode="edit" />;
}

export function ViewItemMasterPage() {
  return <MasterFormPage definition={itemMasterDefinition} mode="view" />;
}
