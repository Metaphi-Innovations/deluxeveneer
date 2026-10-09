import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import {
  asInventoryDate,
  createInventoryEditFields,
  createInventoryFormFields,
} from "../shared/inventoryDefinitionFields";
import {
  createInventoryRows,
  createInventoryViewFields,
} from "../shared/inventoryUtils";
import type { InventoryDefinition } from "../shared/types";
import type { InventoryRecord } from "../shared/types";

export type ConsumableRecord = InventoryRecord & {
  amount: string;
  availableQuantity: string;
  currency: string;
  exchangeRate: string;
  inwardDate: Date;
  inwardSrNo: string;
  inwardType: string;
  invoiceNo: string;
  itemName: string;
  itemSrNo: string;
  noOfTotalHours: string;
  noOfWorkingHours: string;
  quantity: string;
  remark: string;
  shift: string;
  subCategory: string;
  supplierItemName: string;
  supplierName: string;
  unitName: string;
  workers: string;
};

const consumableColumns: ReadonlyArray<EnterpriseTableColumn<ConsumableRecord>> = [
  { key: "srNo", label: "Sr No" },
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardType", label: "Inward Type" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "itemSrNo", label: "Item Sr No" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "supplierItemName", label: "Supplier Item Name" },
  { key: "itemName", label: "Consumable Name" },
  { key: "subCategory", label: "Category" },
  { key: "unitName", label: "Unit Name" },
  { key: "quantity", label: "Quantity" },
  { key: "availableQuantity", label: "Available Quantity" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
];

const consumablesRows = createInventoryRows<ConsumableRecord>("consumables", [
  {
    inwardSrNo: "INW-CON-2026-0001",
    inwardType: "Purchase",
    inwardDate: asInventoryDate("2026-06-04"),
    invoiceNo: "CON-2404",
    itemSrNo: "CON-001",
    supplierName: "Arihant Veneers LLP",
    supplierItemName: "Fevicol SH Resin Drum",
    itemName: "Fevicol SH Resin",
    subCategory: "Adhesive",
    unitName: "Kilogram",
    quantity: "450",
    availableQuantity: "320",
    currency: "INR",
    amount: "86,400.00",
    remark: "Issued partially to pressing and grouping lines.",
    exchangeRate: "1.00",
    shift: "General",
    workers: "12",
    noOfWorkingHours: "8.0",
    noOfTotalHours: "9.0",
  },
  {
    inwardSrNo: "INW-CON-2026-0002",
    inwardType: "Domestic",
    inwardDate: asInventoryDate("2026-06-07"),
    invoiceNo: "CON-2407",
    itemSrNo: "CON-002",
    supplierName: "Heritage Panel Works",
    supplierItemName: "Melamine Hardener Canister",
    itemName: "Melamine Glue Hardener",
    subCategory: "Chemical",
    unitName: "Litre",
    quantity: "180",
    availableQuantity: "122",
    currency: "INR",
    amount: "54,900.00",
    remark: "Standard hardener stock for hot press adhesive preparation.",
    exchangeRate: "1.00",
    shift: "Morning",
    workers: "10",
    noOfWorkingHours: "8.0",
    noOfTotalHours: "9.0",
  },
  {
    inwardSrNo: "INW-CON-2026-0003",
    inwardType: "Purchase",
    inwardDate: asInventoryDate("2026-06-10"),
    invoiceNo: "CON-2410",
    itemSrNo: "CON-003",
    supplierName: "City Timber Traders",
    supplierItemName: "Edge Protector Roll",
    itemName: "Edge Protector Roll",
    subCategory: "Packaging",
    unitName: "Roll",
    quantity: "300",
    availableQuantity: "248",
    currency: "INR",
    amount: "39,750.00",
    remark: "Reserved for finished veneer and plywood dispatch packing.",
    exchangeRate: "1.00",
    shift: "Evening",
    workers: "8",
    noOfWorkingHours: "7.5",
    noOfTotalHours: "8.5",
  },
  {
    inwardSrNo: "INW-CON-2026-0004",
    inwardType: "Domestic",
    inwardDate: asInventoryDate("2026-06-14"),
    invoiceNo: "CON-2414",
    itemSrNo: "CON-004",
    supplierName: "Royal Laminates India",
    supplierItemName: "Sanding Belt 120 Grit",
    itemName: "Sanding Belt 120 Grit",
    subCategory: "Hardware",
    unitName: "Piece",
    quantity: "520",
    availableQuantity: "406",
    currency: "INR",
    amount: "28,600.00",
    remark: "Consumed across finishing and sample sheet runs.",
    exchangeRate: "1.00",
    shift: "General",
    workers: "14",
    noOfWorkingHours: "8.0",
    noOfTotalHours: "9.0",
  },
  {
    inwardSrNo: "INW-CON-2026-0005",
    inwardType: "Import",
    inwardDate: asInventoryDate("2026-06-18"),
    invoiceNo: "CON-7722",
    itemSrNo: "CON-005",
    supplierName: "Scandic Wood Surfaces",
    supplierItemName: "Press Release Film Stack",
    itemName: "Press Release Film",
    subCategory: "Packaging",
    unitName: "Roll",
    quantity: "140",
    availableQuantity: "104",
    currency: "USD",
    amount: "1,280.00",
    remark: "Speciality packing material for export and OEM orders.",
    exchangeRate: "84.30",
    shift: "Morning",
    workers: "9",
    noOfWorkingHours: "8.0",
    noOfTotalHours: "9.5",
  },
  {
    inwardSrNo: "INW-CON-2026-0006",
    inwardType: "Purchase",
    inwardDate: asInventoryDate("2026-06-21"),
    invoiceNo: "CON-2421",
    itemSrNo: "CON-006",
    supplierName: "Prime Timber Sources",
    supplierItemName: "PU Adhesive Cartridge",
    itemName: "PU Adhesive Cartridge",
    subCategory: "Adhesive",
    unitName: "Piece",
    quantity: "260",
    availableQuantity: "198",
    currency: "INR",
    amount: "61,100.00",
    remark: "Reserved for decorative assembly and marquetry works.",
    exchangeRate: "1.00",
    shift: "Evening",
    workers: "11",
    noOfWorkingHours: "8.0",
    noOfTotalHours: "9.0",
  },
]);

export const consumablesDefinition: InventoryDefinition<ConsumableRecord> = {
  slug: "consumables",
  title: "Consumables",
  listColumns: consumableColumns,
  editFields: createInventoryEditFields(consumableColumns, consumablesRows),
  formFields: createInventoryFormFields(consumablesRows),
  viewFields: createInventoryViewFields(consumableColumns),
  rows: [],
  initialSort: { key: "inwardDate", direction: "desc" },
};

