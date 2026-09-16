import { Navigate } from "react-router";

import { InventoryForm, mdfDefinition } from "../../shared";

export function MDFListPage() {
  return (
    <Navigate
      replace
      to="/warehouse-b?section=inventory&inventory=mdf"
    />
  );
}

export function AddMDFPage() {
  return <InventoryForm definition={mdfDefinition} mode="add" />;
}

export function EditMDFPage() {
  return <InventoryForm definition={mdfDefinition} mode="edit" />;
}

export function ViewMDFPage() {
  return <InventoryForm definition={mdfDefinition} mode="view" />;
}
