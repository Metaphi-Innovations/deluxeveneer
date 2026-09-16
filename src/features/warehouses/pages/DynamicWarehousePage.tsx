import { Typography } from "@mui/material";
import { useMemo } from "react";
import { useParams } from "react-router";

import { warehouseLocationMasterDefinition } from "../../masters/shared/masterDefinitions";
import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
} from "../../masters/shared";
import { buildMasterInitialValues } from "../../masters/shared/utils";
import { findLocalWarehouseBySlug } from "../shared/localWarehouseStore";
import { WarehouseAInventoryModulePage } from "./WarehouseAInventoryPage";
import { WarehouseBInventoryModulePage } from "./WarehouseBInventoryPage";
import { WarehouseCInventoryModulePage } from "./WarehouseCInventoryPage";

export function DynamicWarehousePage() {
  const params = useParams<{ warehouseSlug: string }>();
  const warehouseSlug = params.warehouseSlug ?? "";
  const warehouse = useMemo(
    () => findLocalWarehouseBySlug(warehouseSlug),
    [warehouseSlug],
  );
  const values = useMemo(
    () =>
      buildMasterInitialValues(
        warehouseLocationMasterDefinition,
        warehouse,
      ),
    [warehouse],
  );

  if (!warehouse) {
    return (
      <MasterPageShell
        breadcrumbs={[{ label: "Warehouses" }, { label: "Not Found" }]}
        title="Warehouse"
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            This temporary warehouse could not be found in local storage.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (warehouse.warehouseType === "Inward") {
    return (
      <WarehouseAInventoryModulePage
        warehouseName={warehouse.warehouseName}
        warehouseRootPath={`/warehouses/${warehouse.slug}`}
      />
    );
  }

  if (warehouse.warehouseType === "Storage") {
    return (
      <WarehouseBInventoryModulePage
        warehouseName={warehouse.warehouseName}
        warehouseRootPath={`/warehouses/${warehouse.slug}`}
      />
    );
  }

  if (warehouse.warehouseType === "Production") {
    return (
      <WarehouseCInventoryModulePage warehouseName={warehouse.warehouseName} />
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Warehouses" }, { label: warehouse.warehouseName }]}
      title={warehouse.warehouseName}
    >
      <MasterSectionCard>
        <MasterFormFields
          definition={warehouseLocationMasterDefinition}
          onChange={() => undefined}
          readOnly
          values={values}
        />
      </MasterSectionCard>
    </MasterPageShell>
  );
}
