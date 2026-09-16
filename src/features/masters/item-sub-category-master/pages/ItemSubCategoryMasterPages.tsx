import { MasterFormPage, MasterListingPage } from "../../shared";
import { itemSubCategoryMasterDefinition } from "../mock/itemSubCategoryMasterData";

export function ItemSubCategoryMasterListPage() {
  return <MasterListingPage definition={itemSubCategoryMasterDefinition} />;
}

export function AddItemSubCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemSubCategoryMasterDefinition} mode="add" />
  );
}

export function EditItemSubCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemSubCategoryMasterDefinition} mode="edit" />
  );
}

export function ViewItemSubCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemSubCategoryMasterDefinition} mode="view" />
  );
}
