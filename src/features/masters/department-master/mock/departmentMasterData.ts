import type { MasterDefinition, MasterFieldValue } from "../../shared";
import { createMasterRows } from "../../shared";

const asDate = (value: string) => new Date(value);

export interface DepartmentAccessItem {
  key: string;
  label: string;
}

export interface DepartmentAccessSection {
  id: string;
  label: string;
  items: readonly DepartmentAccessItem[];
}

interface DepartmentMasterSeedRow {
  departmentName: string;
  remark: string;
  status: string;
  createdEditedBy: string;
  updatedBy: string;
  createdEditedDate: Date;
  updatedDate: Date;
  selectedModuleKeys: readonly string[];
}

export interface DepartmentMasterDetail {
  id: string;
  srNo: string;
  departmentName: string;
  remark: string;
  status: string;
  createdEditedBy: string;
  updatedBy: string;
  createdEditedDate: Date;
  updatedDate: Date;
  selectedModuleKeys: readonly string[];
}

export const departmentAccessSections: readonly DepartmentAccessSection[] = [
  {
    id: "masters",
    label: "Master",
    items: [
      { key: "category-master", label: "Category Master" },
      { key: "color-master", label: "Color Master" },
      { key: "currency-master", label: "Currency Master" },
      { key: "cut-master", label: "Cut Master" },
      { key: "customer-master", label: "Customer Master" },
      { key: "department-master", label: "Department Master" },
      { key: "gst-master", label: "GST Master" },
      { key: "hsn-master", label: "HSN Master" },
      { key: "item-name-master", label: "Item Name Master" },
      { key: "sub-category-master", label: "Sub Category Master" },
      { key: "supplier-master", label: "Supplier Master" },
      { key: "transporter-master", label: "Transporter Master" },
      { key: "unit-master", label: "Unit Master" },
      {
        key: "warehouse-location-master",
        label: "Warehouse / Location Master",
      },
    ],
  },
  {
    id: "warehouses",
    label: "Warehouses",
    items: [
      { key: "warehouse-a", label: "Warehouse A" },
      { key: "warehouse-b", label: "Warehouse B" },
      { key: "warehouse-c", label: "Warehouse C" },
    ],
  },
  {
    id: "factory",
    label: "Factory",
    items: [
      { key: "slicing", label: "Slicing" },
      { key: "drying", label: "Drying" },
      { key: "grouping", label: "Grouping" },
      { key: "splicing", label: "Splicing" },
      { key: "pressing", label: "Pressing" },
      { key: "finishing", label: "Finishing" },
      { key: "cnc-fluting", label: "Fluting" },
      { key: "embossing", label: "Embossing" },
      { key: "marquetry", label: "Marquetry" },
    ],
  },
  {
    id: "order",
    label: "Orders",
    items: [{ key: "orders", label: "Orders" }],
  },
  {
    id: "packing",
    label: "Packing",
    items: [{ key: "packing", label: "Packing" }],
  },
  {
    id: "dispatch",
    label: "Dispatch",
    items: [{ key: "dispatch", label: "Dispatch" }],
  },
];

const departmentMasterSeedRows: readonly DepartmentMasterSeedRow[] = [
  {
    departmentName: "Management / Admin",
    remark: "Administrative oversight for all ERP modules.",
    status: "Active",
    createdEditedBy: "Dev Joshi",
    updatedBy: "Tanya Khanna",
    createdEditedDate: asDate("2026-03-08"),
    updatedDate: asDate("2026-06-27"),
    selectedModuleKeys: getAllDepartmentModuleKeys(),
  },
  {
    departmentName: "Production Team",
    remark: "Process-stage execution for active factory operations.",
    status: "Active",
    createdEditedBy: "Dev Joshi",
    updatedBy: "Samar Singh",
    createdEditedDate: asDate("2026-03-15"),
    updatedDate: asDate("2026-06-23"),
    selectedModuleKeys: [
      "item-name-master",
      "unit-master",
      "warehouse-b",
      "warehouse-c",
      "slicing",
      "drying",
      "grouping",
      "splicing",
      "pressing",
      "finishing",
      "cnc-fluting",
      "embossing",
      "marquetry",
      "packing",
    ],
  },
  {
    departmentName: "Warehouse Team",
    remark: "Warehouse inward, stock visibility, and transfer control.",
    status: "Active",
    createdEditedBy: "Neha Sharma",
    updatedBy: "Ritesh Vora",
    createdEditedDate: asDate("2026-03-21"),
    updatedDate: asDate("2026-06-25"),
    selectedModuleKeys: [
      "warehouse-location-master",
      "warehouse-a",
      "warehouse-b",
      "warehouse-c",
      "dispatch",
    ],
  },
  {
    departmentName: "Sales Team",
    remark: "Customer, order, and dispatch coordination access.",
    status: "Active",
    createdEditedBy: "Tanya Khanna",
    updatedBy: "Ananya Saxena",
    createdEditedDate: asDate("2026-04-04"),
    updatedDate: asDate("2026-06-26"),
    selectedModuleKeys: [
      "category-master",
      "color-master",
      "currency-master",
      "customer-master",
      "gst-master",
      "hsn-master",
      "item-name-master",
      "sub-category-master",
      "orders",
      "packing",
      "dispatch",
    ],
  },
];

const departmentMasterRows = createMasterRows(
  "department-master",
  departmentMasterSeedRows.map(({ selectedModuleKeys, ...row }) => row),
);

export const departmentMasterDetails: readonly DepartmentMasterDetail[] =
  departmentMasterSeedRows.map((seedRow, index) => {
    const tableRow = departmentMasterRows[index];

    return {
      id: tableRow?.id ?? `department-master-${index + 1}`,
      srNo: String(tableRow?.srNo ?? index + 1),
      departmentName: seedRow.departmentName,
      remark: seedRow.remark,
      status: seedRow.status,
      createdEditedBy: seedRow.createdEditedBy,
      updatedBy: seedRow.updatedBy,
      createdEditedDate: seedRow.createdEditedDate,
      updatedDate: seedRow.updatedDate,
      selectedModuleKeys: seedRow.selectedModuleKeys,
    };
  });

const departmentRowsForDefinition = departmentMasterDetails.map(
  ({ selectedModuleKeys, ...row }) => ({
    ...row,
    createdBy: row.createdEditedBy,
    editedBy: row.updatedBy,
    createdDate: row.createdEditedDate,
  }),
);

export const departmentMasterDefinition: MasterDefinition = {
  slug: "department-master",
  title: "Department Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "departmentName", label: "Department Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      options: ["Active", "Inactive"],
    },
  ],
  fields: [
    { key: "departmentName", label: "Department Name", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
  ],
  rows: departmentRowsForDefinition.slice(0, 2),
};

export function getDepartmentMasterDetail(id: string) {
  return departmentMasterDetails.find((row) => row.id === id);
}

export function buildDepartmentMasterInitialValues(
  row?: DepartmentMasterDetail,
) {
  return {
    departmentName: row?.departmentName ?? "",
    remark: row?.remark ?? "",
    status: row?.status ?? "Active",
  } satisfies Record<string, MasterFieldValue>;
}

export function getAllDepartmentModuleKeys() {
  return departmentAccessSections.flatMap((section) =>
    section.items.map((item) => item.key),
  );
}
