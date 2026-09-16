import type { WarehousePageId } from "../shared/warehouseTableData";
import { WarehouseAInventoryPage } from "./WarehouseAInventoryPage";
import { WarehouseCInventoryPage } from "./WarehouseCInventoryPage";
import { WarehouseListingPage } from "./WarehouseListingPage";
import { WarehouseBInventoryPage } from "./WarehouseBInventoryPage";

interface WarehousesPageProps {
  warehouseId: WarehousePageId;
}

export function WarehousesPage({ warehouseId }: WarehousesPageProps) {
  if (warehouseId === "warehouse-a") {
    return <WarehouseAInventoryPage />;
  }

  if (warehouseId === "warehouse-b") {
    return <WarehouseBInventoryPage />;
  }

  if (warehouseId === "warehouse-c") {
    return <WarehouseCInventoryPage />;
  }

  return <WarehouseListingPage warehouseId={warehouseId} />;
}
