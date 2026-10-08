import type { MasterDefinition, MasterRecord } from "./types";
import { createMasterRows } from "./utils";
import { getCachedSupplierMasterRows } from "../supplier-master/api/supplierMasterApi";
import { getCachedTransporterMasterRows } from "../transporter-master/api/transporterMasterApi";

export { customerMasterDefinition } from "../customer-master/customerMasterDefinition";
export { supplierMasterDefinition } from "../supplier-master/supplierMasterDefinition";
export { transporterMasterDefinition } from "../transporter-master/transporterMasterDefinition";
export { warehouseLocationMasterDefinition } from "../warehouse-location-master/warehouseLocationMasterDefinition";

const asDate = (value: string) => new Date(value);

const demoListingRowCount = 12;

function limitDemoListingRows<T extends MasterRecord>(
  _rows: ReadonlyArray<T>,
  _options: { count?: number; uniqueKey?: string } = {},
) {
  return [] as T[];
}

function withAuditFields<T extends MasterRecord>(rows: ReadonlyArray<T>) {
  return rows.map((row) => ({
    ...row,
    createdBy: String(row.createdBy ?? row.createdEditedBy ?? ""),
    editedBy: String(row.editedBy ?? row.updatedBy ?? row.createdEditedBy ?? ""),
    createdDate:
      (row.createdDate ??
        row.createdEditedDate ??
        row.createdEditedAt ??
        null) as MasterRecord[string],
    updatedDate:
      (row.updatedDate ??
        row.updatedAt ??
        row.createdEditedDate ??
        row.createdEditedAt ??
        null) as MasterRecord[string],
  }));
}

const itemRows = withAuditFields(createMasterRows("item-name-master", [
  {
    itemName: "Oak Quarter Cut Veneer",
    itemCode: "ITM-OAK-001",
    category: "Decorative Veneer",
    subCategory: "Natural Veneer",
    color: "Natural Oak",
    gst: "12%",
    hsn: "4408",
    length: "2440",
    width: "1220",
    thickness: "0.60",
    quantitySheets: "24",
    ratePerSqf: "210",
    remark: "Standard oak veneer catalog item.",
    createdEditedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-10"),
  },
  {
    itemName: "Walnut Crown Cut Veneer",
    itemCode: "ITM-WAL-014",
    category: "Decorative Veneer",
    subCategory: "Dyed Veneer",
    color: "Classic Walnut",
    gst: "12%",
    hsn: "4408",
    length: "2480",
    width: "1230",
    thickness: "0.65",
    quantitySheets: "20",
    ratePerSqf: "235",
    remark: "Premium walnut veneer for interior applications.",
    createdEditedBy: "Neha Shah",
    createdEditedDate: asDate("2026-05-16"),
  },
  {
    itemName: "Teak Architectural Sheet",
    itemCode: "ITM-TEK-021",
    category: "Engineered Panel",
    subCategory: "Architectural Panel",
    color: "Golden Teak",
    gst: "18%",
    hsn: "4412",
    length: "2600",
    width: "1250",
    thickness: "0.75",
    quantitySheets: "18",
    ratePerSqf: "250",
    remark: "Architectural teak sheet for premium paneling.",
    createdEditedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-05-22"),
  },
  {
    itemName: "Ash Rift Cut Panel",
    itemCode: "ITM-ASH-032",
    category: "Engineered Panel",
    subCategory: "Structural Panel",
    color: "Soft Ash",
    gst: "18%",
    hsn: "4411",
    length: "2500",
    width: "1200",
    thickness: "0.55",
    quantitySheets: "30",
    ratePerSqf: "198",
    remark: "Ash panel aligned to rift-cut project demand.",
    createdEditedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-06-03"),
  },
  {
    itemName: "Calibrated Board 18mm",
    itemCode: "ITM-PLY-044",
    category: "Plywood",
    subCategory: "Calibrated Board",
    color: "Natural Oak",
    gst: "18%",
    hsn: "4412",
    length: "2440",
    width: "1220",
    thickness: "18",
    quantitySheets: "12",
    ratePerSqf: "175",
    remark: "Calibrated plywood board for CNC-ready production.",
    createdEditedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-06-10"),
  },
  {
    itemName: "Prelam MDF Walnut",
    itemCode: "ITM-MDF-058",
    category: "MDF",
    subCategory: "Prelam Board",
    color: "Classic Walnut",
    gst: "18%",
    hsn: "4411",
    length: "2440",
    width: "1220",
    thickness: "18",
    quantitySheets: "14",
    ratePerSqf: "190",
    remark: "Pre-laminated MDF for wardrobe and panel finish work.",
    createdEditedBy: "Neha Shah",
    createdEditedDate: asDate("2026-06-18"),
  },
]));

const itemCategoryRows = withAuditFields(createMasterRows("item-category-master", [
  {
    categoryName: "Decorative Veneer",
    hsn: "4408",
    gst: "12%",
    remark: "Interior decorative veneer category.",
    createdEditedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-04-18"),
  },
  {
    categoryName: "Engineered Panel",
    hsn: "4412",
    gst: "18%",
    remark: "Structured panels for architectural applications.",
    createdEditedBy: "Neha Shah",
    createdEditedDate: asDate("2026-05-02"),
  },
  {
    categoryName: "Plywood",
    hsn: "4412",
    gst: "18%",
    remark: "Structural board stock for standard production runs.",
    createdEditedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-05-15"),
  },
  {
    categoryName: "MDF",
    hsn: "4411",
    gst: "18%",
    remark: "Composite board category for modular fabrication.",
    createdEditedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-06-01"),
  },
]));

const itemSubCategoryRows = withAuditFields(createMasterRows("item-sub-category-master", [
  {
    itemSubCategory: "Natural Veneer",
    category: "Decorative Veneer",
    createdEditedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-04-20"),
  },
  {
    itemSubCategory: "Dyed Veneer",
    category: "Decorative Veneer",
    createdEditedBy: "Neha Shah",
    createdEditedDate: asDate("2026-05-08"),
  },
  {
    itemSubCategory: "Architectural Panel",
    category: "Engineered Panel",
    createdEditedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-05-19"),
  },
  {
    itemSubCategory: "Structural Panel",
    category: "Engineered Panel",
    createdEditedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-06-02"),
  },
  {
    itemSubCategory: "Calibrated Board",
    category: "Plywood",
    createdEditedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-06-11"),
  },
  {
    itemSubCategory: "Prelam Board",
    category: "MDF",
    createdEditedBy: "Neha Shah",
    createdEditedDate: asDate("2026-06-18"),
  },
]));

const colorRows = withAuditFields(createMasterRows("color-master", [
  {
    colorName: "Natural Oak",
    status: "Active",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-14"),
    updatedDate: asDate("2026-05-02"),
  },
  {
    colorName: "Classic Walnut",
    status: "Active",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-20"),
    updatedDate: asDate("2026-05-11"),
  },
  {
    colorName: "Golden Teak",
    status: "Active",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-06"),
    updatedDate: asDate("2026-05-26"),
  },
  {
    colorName: "Soft Ash",
    status: "Inactive",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-18"),
    updatedDate: asDate("2026-06-04"),
  },
]));

const cutRows = withAuditFields(createMasterRows("cut-master", [
  {
    cutName: "Quarter Cut",
    remark: "Used for linear veneer grain selection.",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-16"),
    updatedDate: asDate("2026-05-06"),
  },
  {
    cutName: "Crown Cut",
    remark: "Preferred for broad cathedral grain patterns.",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-29"),
    updatedDate: asDate("2026-05-18"),
  },
  {
    cutName: "Rift Cut",
    remark: "Used where consistent straight grain is required.",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-12"),
    updatedDate: asDate("2026-05-31"),
  },
  {
    cutName: "Rotary Cut",
    remark: "Bulk inward cut option for production stock.",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-25"),
    updatedDate: asDate("2026-06-07"),
  },
]));

const gradeRows = withAuditFields(createMasterRows("grade-master", [
  {
    gradeName: "A",
    remark: "Premium face-grade veneer and panel stock.",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-18"),
    updatedDate: asDate("2026-05-08"),
  },
  {
    gradeName: "B",
    remark: "Standard production-grade material.",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-30"),
    updatedDate: asDate("2026-05-21"),
  },
  {
    gradeName: "Commercial",
    remark: "Commercial utility grade for cost-sensitive orders.",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-14"),
    updatedDate: asDate("2026-06-02"),
  },
  {
    gradeName: "Reject",
    status: "Inactive",
    remark: "Inactive grade retained for historical stock records.",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-26"),
    updatedDate: asDate("2026-06-09"),
  },
]));

const unitRows = withAuditFields(createMasterRows("unit-master", [
  {
    unitName: "Square Meter",
    symbolicName: "SQM",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    status: "Active",
    createdEditedDate: asDate("2026-04-11"),
    updatedDate: asDate("2026-05-04"),
  },
  {
    unitName: "Sheet",
    symbolicName: "SHT",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    status: "Active",
    createdEditedDate: asDate("2026-04-19"),
    updatedDate: asDate("2026-05-12"),
  },
  {
    unitName: "Bundle",
    symbolicName: "BDL",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    status: "Active",
    createdEditedDate: asDate("2026-05-07"),
    updatedDate: asDate("2026-05-21"),
  },
  {
    unitName: "Piece",
    symbolicName: "PCS",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    status: "Inactive",
    createdEditedDate: asDate("2026-05-24"),
    updatedDate: asDate("2026-06-06"),
  },
]));

const gstRows = withAuditFields(createMasterRows("gst-master", [
  {
    gstPercentage: "5%",
    remark: "Raw material and accessory inward",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    status: "Active",
    createdEditedAt: asDate("2026-04-10"),
    updatedAt: asDate("2026-05-03"),
  },
  {
    gstPercentage: "12%",
    remark: "Decorative sheet and retail panel sales",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    status: "Active",
    createdEditedAt: asDate("2026-04-18"),
    updatedAt: asDate("2026-05-14"),
  },
  {
    gstPercentage: "18%",
    remark: "Premium veneer and architectural panel billing",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    status: "Active",
    createdEditedAt: asDate("2026-05-05"),
    updatedAt: asDate("2026-05-26"),
  },
  {
    gstPercentage: "28%",
    remark: "Restricted category kept for legacy mapping only",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    status: "Inactive",
    createdEditedAt: asDate("2026-05-19"),
    updatedAt: asDate("2026-06-07"),
  },
]));

const hsnRows = withAuditFields(createMasterRows("hsn-master", [
  {
    hsnCode: "4408",
    hsnCodeDescription: "Sheets for veneering, sliced",
    gstPercentage: "12%",
    status: "Active",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-09"),
    updatedDate: asDate("2026-05-01"),
  },
  {
    hsnCode: "4412",
    hsnCodeDescription: "Plywood, veneered panels",
    gstPercentage: "18%",
    status: "Active",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-21"),
    updatedDate: asDate("2026-05-16"),
  },
  {
    hsnCode: "4411",
    hsnCodeDescription: "Fibreboard of wood",
    gstPercentage: "18%",
    status: "Active",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-12"),
    updatedDate: asDate("2026-05-30"),
  },
  {
    hsnCode: "4421",
    hsnCodeDescription: "Other articles of wood",
    gstPercentage: "28%",
    status: "Inactive",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-25"),
    updatedDate: asDate("2026-06-08"),
  },
]));

const currencyRows = withAuditFields(createMasterRows("currency-master", [
  {
    currencyName: "INR",
    remark: "Default local transaction currency",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    status: "Active",
    createdEditedAt: asDate("2026-04-08"),
    updatedAt: asDate("2026-05-02"),
  },
  {
    currencyName: "USD",
    remark: "Used for veneer import billing",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    status: "Active",
    createdEditedAt: asDate("2026-04-19"),
    updatedAt: asDate("2026-05-11"),
  },
  {
    currencyName: "Euro",
    remark: "Used for European supplier settlements",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    status: "Active",
    createdEditedAt: asDate("2026-05-03"),
    updatedAt: asDate("2026-05-24"),
  },
]));

const uniqueOptions = (rows: ReadonlyArray<MasterRecord>, key: string) =>
  Array.from(
    new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean)),
  );

const activeOptions = (rows: ReadonlyArray<MasterRecord>, key: string) =>
  uniqueOptions(
    rows.filter(
      (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
    ),
    key,
  );

const statusOptions = ["Active", "Inactive"];

export const itemSubCategoryMasterOptions = uniqueOptions(
  itemSubCategoryRows,
  "itemSubCategory",
);

export const itemCategoryMasterOptions = uniqueOptions(
  itemCategoryRows,
  "categoryName",
);

export const itemMasterDefinition: MasterDefinition = {
  slug: "item-name-master",
  title: "Item Name Master",
  gridColumns: 4,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "itemName", label: "Item Name" },
    { key: "itemCode", label: "Factory Item Code" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "category", label: "Category", options: itemCategoryMasterOptions },
    { key: "subCategory", label: "Sub Category", options: itemSubCategoryMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "itemName", label: "Item Name", type: "text" },
    { key: "itemCode", label: "Factory Item Code", type: "text" },
    { key: "category", label: "Category", type: "select", options: [] },
    {
      key: "subCategory",
      label: "Sub Category",
      type: "select",
      options: [],
    },
    { key: "color", label: "Color", type: "select", options: [] },
    { key: "unitName", label: "Unit Name", type: "select", options: [] },
    {
      key: "hsn",
      label: "HSN Code",
      type: "select",
      options: [],
      readOnly: true,
    },
    {
      key: "gst",
      label: "GST No",
      type: "select",
      options: [],
      readOnly: true,
    },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const itemCategoryMasterDefinition: MasterDefinition = {
  slug: "item-category-master",
  title: "Item Category Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "categoryName", label: "Category Name" },
    { key: "hsn", label: "HSN Code" },
    { key: "gst", label: "GST No" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "categoryName", label: "Category Name", options: uniqueOptions(itemCategoryRows, "categoryName") },
    { key: "hsn", label: "HSN Code", options: activeOptions(hsnRows, "hsnCode") },
    { key: "gst", label: "GST No", options: activeOptions(hsnRows, "gstPercentage") },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "categoryName", label: "Category Name", type: "text" },
    { key: "hsn", label: "HSN Code", type: "select", options: activeOptions(hsnRows, "hsnCode") },
    {
      key: "gst",
      label: "GST No",
      type: "select",
      options: activeOptions(hsnRows, "gstPercentage"),
      readOnly: true,
      autoFillFrom: {
        rows: hsnRows,
        sourceSlug: "hsn-master",
        sourceKey: "hsn",
        sourceMatchKey: "hsnCode",
        sourceValueKey: "gstPercentage",
      },
    },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const itemSubCategoryMasterDefinition: MasterDefinition = {
  slug: "item-sub-category-master",
  title: "Item Sub-Category Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "itemSubCategory", label: "Item Sub Category" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "category", label: "Category", options: uniqueOptions(itemSubCategoryRows, "category") },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "itemSubCategory", label: "Item Sub Category", type: "text" },
    { key: "category", label: "Category", type: "select", options: activeOptions(itemCategoryRows, "categoryName") },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const colorMasterDefinition: MasterDefinition = {
  slug: "color-master",
  title: "Color Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "colorName", label: "Color name" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: uniqueOptions(colorRows, "createdBy") },
    { key: "editedBy", label: "Updated By", options: uniqueOptions(colorRows, "editedBy") },
  ],
  fields: [
    { key: "colorName", label: "Color Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const cutMasterOptions = uniqueOptions(cutRows, "cutName");
export const gradeMasterOptions = uniqueOptions(gradeRows, "gradeName");
export const gstMasterOptions = uniqueOptions(gstRows, "gstPercentage");
export function getSupplierMasterOptions() {
  return activeOptions(getCachedSupplierMasterRows(), "supplierName");
}

/** @deprecated Prefer getSupplierMasterOptions() for live API cache values. */
export const supplierMasterOptions = getSupplierMasterOptions();

export const currencyMasterOptions = activeOptions(currencyRows, "currencyName");
export const itemMasterOptions = activeOptions(itemRows, "itemName");
export const hsnMasterOptions = activeOptions(hsnRows, "hsnCode");

export function getItemMasterRecord(itemName: string) {
  const normalizedName = itemName.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  return (
    (itemRows as readonly MasterRecord[]).find(
      (row) =>
        String(row.itemName ?? "").trim().toLowerCase() === normalizedName &&
        String(row.status ?? "Active").toLowerCase() !== "inactive",
    ) ?? null
  );
}

export function getHsnGstPercentage(hsnCode: string) {
  const normalizedCode = hsnCode.trim().toLowerCase();

  if (!normalizedCode) {
    return "";
  }

  const match = (hsnRows as readonly MasterRecord[]).find(
    (row) =>
      String(row.hsnCode ?? "").trim().toLowerCase() === normalizedCode &&
      String(row.status ?? "Active").toLowerCase() !== "inactive",
  );

  return match ? String(match.gstPercentage ?? "") : "";
}

export function getSupplierState(supplierName: string) {
  const normalizedName = supplierName.trim().toLowerCase();

  if (!normalizedName) {
    return "";
  }

  const cachedMatch = getCachedSupplierMasterRows().find(
    (row) =>
      String(row.supplierName ?? "").trim().toLowerCase() === normalizedName,
  );

  return cachedMatch ? String(cachedMatch.state ?? "") : "";
}

function normalizeStateValue(state: string) {
  return state.trim().toLowerCase();
}

/** Same warehouse & supplier state → CGST+SGST; different → IGST. */
export function getInwardGstMode(
  warehouseState: string,
  supplierState: string,
): "intra" | "inter" {
  const warehouse = normalizeStateValue(warehouseState);
  const supplier = normalizeStateValue(supplierState);

  if (!warehouse || !supplier) {
    return "intra";
  }

  return warehouse === supplier ? "intra" : "inter";
}

export function getWarehouseAGstMode(
  supplierName: string,
  warehouseState = "",
): "intra" | "inter" {
  return getInwardGstMode(warehouseState, getSupplierState(supplierName));
}

export const cutMasterDefinition: MasterDefinition = {
  slug: "cut-master",
  title: "Cut Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "cutName", label: "Cut Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "cutName", label: "Cut Name", options: cutMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "cutName", label: "Cut Name", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const gradeMasterDefinition: MasterDefinition = {
  slug: "grade-master",
  title: "Grade Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "gradeName", label: "Grade Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gradeName", label: "Grade Name", options: gradeMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "gradeName", label: "Grade Name", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const unitMasterDefinition: MasterDefinition = {
  slug: "unit-master",
  title: "Unit Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "unitName", label: "Unit Name" },
    { key: "symbolicName", label: "Symbolic Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: uniqueOptions(unitRows, "createdBy") },
  ],
  fields: [
    { key: "unitName", label: "Unit Name", type: "text" },
    { key: "symbolicName", label: "Symbolic Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};

export const gstMasterDefinition: MasterDefinition = {
  slug: "gst-master",
  title: "GST Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "gstPercentage", label: "GST %" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "status", label: "Status" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gstPercentage", label: "GST %", options: uniqueOptions(gstRows, "gstPercentage") },
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: uniqueOptions(gstRows, "createdBy") },
  ],
  fields: [
    { key: "gstPercentage", label: "GST %", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};

export const hsnMasterDefinition: MasterDefinition = {
  slug: "hsn-master",
  title: "HSN Master",
  gridColumns: 4,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "hsnCode", label: "HSN Code" },
    { key: "hsnCodeDescription", label: "HSN Code Description" },
    { key: "gstPercentage", label: "GST%" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gstPercentage", label: "GST%", options: uniqueOptions(hsnRows, "gstPercentage") },
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: uniqueOptions(hsnRows, "createdBy") },
  ],
  fields: [
    { key: "hsnCode", label: "HSN Code", type: "text" },
    { key: "hsnCodeDescription", label: "HSN Code Description", type: "text" },
    { key: "gstPercentage", label: "GST%", type: "select", options: activeOptions(gstRows, "gstPercentage") },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};

export const currencyMasterDefinition: MasterDefinition = {
  slug: "currency-master",
  title: "Currency Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "currencyName", label: "Currency Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: uniqueOptions(currencyRows, "createdBy") },
    { key: "currencyName", label: "Currency Name", options: uniqueOptions(currencyRows, "currencyName") },
  ],
  fields: [
    { key: "currencyName", label: "Currency Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};

export const unitMasterOptions = uniqueOptions(unitRows, "unitName");

export function getTransporterMasterOptions() {
  return uniqueOptions(getCachedTransporterMasterRows(), "transporterName");
}

/** @deprecated Prefer getTransporterMasterOptions() for live API cache values. */
export const transporterMasterOptions = getTransporterMasterOptions();

export const transporterTypeOptions = ["Road", "Air", "Rail"];

export function getTransporterAreaOfOperationOptions() {
  return uniqueOptions(
    getCachedTransporterMasterRows(),
    "areaOfOperation",
  );
}

/** @deprecated Prefer getTransporterAreaOfOperationOptions(). */
export const transporterAreaOfOperationOptions =
  getTransporterAreaOfOperationOptions();

