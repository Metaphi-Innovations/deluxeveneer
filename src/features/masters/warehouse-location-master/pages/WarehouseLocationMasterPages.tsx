import { MasterFormPage, MasterListingPage } from "../../shared";
import {
  buildWarehouseLocationMasterDefinition,
  createLocalWarehouse,
  isLocalWarehouseRecordId,
  updateLocalWarehouse,
} from "../../../warehouses/shared/localWarehouseStore";

export function WarehouseLocationMasterListPage() {
  return (
    <MasterListingPage definition={buildWarehouseLocationMasterDefinition()} />
  );
}

export function AddWarehouseLocationMasterPage() {
  return (
    <MasterFormPage
      cancelTo="/masters/warehouse-location-master"
      definition={buildWarehouseLocationMasterDefinition()}
      mode="add"
      onSave={({ values }) => {
        createLocalWarehouse(values);
      }}
    />
  );
}

export function EditWarehouseLocationMasterPage() {
  return (
    <MasterFormPage
      definition={buildWarehouseLocationMasterDefinition()}
      mode="edit"
      onSave={({ row, values }) => {
        if (row && isLocalWarehouseRecordId(row.id)) {
          updateLocalWarehouse(row.id, values);
        }
      }}
    />
  );
}

export function ViewWarehouseLocationMasterPage() {
  return (
    <MasterFormPage
      definition={buildWarehouseLocationMasterDefinition()}
      mode="view"
    />
  );
}
