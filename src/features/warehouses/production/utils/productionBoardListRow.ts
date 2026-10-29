import type { ProductionInventoryItem } from "../api/productionWarehouseApi";

export function mapProductionBoardQuantities(item: ProductionInventoryItem) {
  const receivedNoOfSheets = String(
    item.receivedQuantity ?? item.noOfSheets ?? item.totalNoOfSheets ?? "",
  );
  const availableNoOfSheets = String(
    item.availableQuantity ?? item.noOfSheets ?? item.totalNoOfSheets ?? "",
  );
  const availableSqm = String(
    item.availableSqm ?? item.sqm ?? item.totalSqm ?? "",
  );
  const availableSqf = String(
    item.availableSqf ?? item.sqf ?? item.totalSqf ?? "",
  );
  return {
    noOfSheets: availableNoOfSheets,
    receivedNoOfSheets,
    availableNoOfSheets,
    sqm: availableSqm,
    receivedSqm: String(item.receivedSqm ?? availableSqm),
    availableSqm,
    sqf: availableSqf,
    receivedSqf: String(item.receivedSqf ?? availableSqf),
    availableSqf,
  };
}
