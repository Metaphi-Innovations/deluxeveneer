import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

import {
  MasterPageShell,
  MasterSectionCard,
} from "../../masters/shared";
import { fetchWarehouseMasterDetail } from "../../masters/warehouse-location-master/api/warehouseMasterApi";

export function DynamicWarehousePage() {
  const params = useParams<{ warehouseSlug: string }>();
  const warehouseId = params.warehouseSlug ?? "";
  const [warehouseName, setWarehouseName] = useState("Warehouse");
  const [warehouseType, setWarehouseType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadWarehouse = async () => {
      if (!warehouseId) {
        if (!ignore) {
          setErrorMessage("Warehouse not found.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const record = await fetchWarehouseMasterDetail(warehouseId);
        if (ignore) {
          return;
        }

        const name =
          typeof record.warehouseName === "string" && record.warehouseName.trim()
            ? record.warehouseName.trim()
            : "Warehouse";
        const type =
          typeof record.warehouseType === "string" ? record.warehouseType.trim() : "";

        setWarehouseName(name);
        setWarehouseType(type);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load warehouse.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadWarehouse();

    return () => {
      ignore = true;
    };
  }, [warehouseId]);

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: isLoading ? "Loading..." : warehouseName },
      ]}
      subtitle={
        warehouseType
          ? `${warehouseType} warehouse`
          : "Warehouse workspace"
      }
      title={isLoading ? "Warehouse" : warehouseName}
    >
      <MasterSectionCard>
        <Typography variant="body2" color="text.secondary">
          {errorMessage
            ? errorMessage
            : isLoading
              ? "Loading warehouse..."
              : "Warehouse workspace will be configured based on warehouse type."}
        </Typography>
      </MasterSectionCard>
    </MasterPageShell>
  );
}
