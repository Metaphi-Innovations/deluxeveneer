/**
 * Create-inward line items share the same implementation as edit inward
 * (Item Master selection, numeric validation, disabled autofill fields).
 */
export {
  InwardEditStockLineItems as WarehouseAAddStockLineItems,
  type InwardEditStockLineItemsHandle as WarehouseAAddStockLineItemsHandle,
  type WarehouseAAddStockFieldConfig,
  type WarehouseAAddStockFieldType,
  type WarehouseAAddStockSlug,
  type WarehouseAGstMode,
  type WarehouseALineItemsTotals,
  getWarehouseAAddStockBodyCellSx,
  getWarehouseAAddStockHeaderCellSx,
  getWarehouseAAddStockScrollableTableSx,
  getWarehouseAAddStockTableConfig,
  getWarehouseAAddStockTableMinWidth,
  isWarehouseAAddStockSlug,
  renderWarehouseAAddStockEditableField,
} from "../../warehouses/components/InwardEditStockLineItems";
