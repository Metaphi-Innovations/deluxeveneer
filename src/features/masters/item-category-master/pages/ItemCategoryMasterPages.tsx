import { MasterFormPage, MasterListingPage } from "../../shared";
import { itemCategoryMasterDefinition } from "../mock/itemCategoryMasterData";

export function ItemCategoryMasterListPage() {
  return <MasterListingPage definition={itemCategoryMasterDefinition} />;
}

export function AddItemCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemCategoryMasterDefinition} mode="add" />
  );
}

export function EditItemCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemCategoryMasterDefinition} mode="edit" />
  );
}

export function ViewItemCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemCategoryMasterDefinition} mode="view" />
  );
}
