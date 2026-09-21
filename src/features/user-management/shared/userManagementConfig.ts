import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import type { MasterFieldDefinition, MasterFieldValue } from "../../masters/shared";
import {
  getDynamicWarehousePermissionKey,
  type DynamicWarehousePermissionItem,
} from "../../shared/warehousePermission";

export type UserPermissionAction = "view" | "edit" | "create";

export interface UserPermissionFlags {
  create: boolean;
  edit: boolean;
  view: boolean;
}

export interface UserPermissionItem {
  key: string;
  label: string;
}

export interface UserPermissionSection {
  id: string;
  label: string;
  items: readonly UserPermissionItem[];
}

interface UserManagementSeedRow {
  userName: string;
  userType: string;
  department: string;
  approver: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  gender: string;
  bloodGroup: string;
  dateOfBirth: Date;
  age: string;
  phoneNo: string;
  aadhaarNo?: string;
  aadhaarUpload?: string;
  panNo?: string;
  panUpload?: string;
  remarks: string;
  createdBy: string;
  createdDate: Date;
  isActive: boolean;
  permissions: Record<string, UserPermissionFlags>;
  updatedBy: string;
  updatedDate: Date;
}

export interface UserManagementRecord extends EnterpriseTableRow {
  id: string;
  userName: string;
  userType: string;
  department: string;
  approver: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  gender: string;
  bloodGroup: string;
  dateOfBirth: Date;
  age: string;
  phoneNo: string;
  remarks: string;
  createdBy: string;
  createdDate: Date;
  isActive: boolean;
  statusLabel: string;
  updatedBy: string;
  updatedDate: Date;
}

export interface UserManagementDetail extends UserManagementSeedRow {
  id: string;
  statusLabel: string;
}

export const userManagementColumns: readonly EnterpriseTableColumn<UserManagementRecord>[] =
  [
    { key: "userName", label: "User Name" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phoneNo", label: "Phone Number" },
    { key: "remarks", label: "Remarks" },
    { key: "statusLabel", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "createdDate", label: "Created At" },
    { key: "updatedBy", label: "Updated By" },
    { key: "updatedDate", label: "Updated At" },
  ];

export const departmentOptions: string[] = [];

export const userTypeOptions = [
  "Admin",
  "Manager",
  "Supervisor",
  "Executive",
] as const;

export const genderOptions = ["Male", "Female", "Other"] as const;

export const bloodGroupOptions = [
  "A+",
  "B+",
  "AB+",
  "O+",
  "A-",
  "B-",
  "AB-",
  "O-",
] as const;

export const userPermissionSections: readonly UserPermissionSection[] = [
  {
    id: "core",
    label: "Core Access",
    items: [
      { key: "dashboard", label: "Dashboard" },
      { key: "userManagement", label: "User Management" },
    ],
  },
  {
    id: "masters",
    label: "Masters",
    items: [
      { key: "colorMaster", label: "Color" },
      { key: "currencyMaster", label: "Currency" },
      { key: "customerMaster", label: "Customer" },
      { key: "cutMaster", label: "Cut" },
      { key: "departmentMaster", label: "Department" },
      { key: "gradeMaster", label: "Grade" },
      { key: "gstMaster", label: "GST" },
      { key: "hsnMaster", label: "HSN" },
      { key: "itemCategoryMaster", label: "Item Category" },
      { key: "itemMaster", label: "Item Name" },
      { key: "itemSubCategoryMaster", label: "Item Sub Category" },
      { key: "supplierMaster", label: "Supplier" },
      { key: "transporterMaster", label: "Transporter" },
      { key: "unitMaster", label: "Unit" },
      { key: "warehouseLocationMaster", label: "Warehouse / Location" },
    ],
  },
  {
    id: "warehouses",
    label: "Warehouses",
    items: [
      { key: "warehouseA", label: "Warehouse A" },
      { key: "warehouseB", label: "Warehouse B" },
      { key: "warehouseC", label: "Warehouse C" },
    ],
  },
  {
    id: "factory",
    label: "Factory",
    items: [
      { key: "sawing", label: "Sawing" },
      { key: "slicing", label: "Slicing" },
      { key: "drying", label: "Drying" },
      { key: "inspection", label: "Inspection" },
      { key: "grouping", label: "Grouping" },
      { key: "marquetry", label: "Marquetry" },
      { key: "splicing", label: "Splicing" },
      { key: "pressing", label: "Pressing" },
      { key: "cncFluting", label: "Fluting" },
      { key: "embossing", label: "Embossing" },
      { key: "finishing", label: "Finishing" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    items: [{ key: "placeOrder", label: "Orders" }],
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

export function buildUserPermissionSections(
  dynamicWarehouses: readonly DynamicWarehousePermissionItem[] = [],
) {
  return userPermissionSections.map((section) => {
    if (section.id !== "warehouses" || dynamicWarehouses.length === 0) {
      return section;
    }

    return {
      ...section,
      items: [
        ...section.items,
        ...dynamicWarehouses.map((warehouse) => ({
          key: getDynamicWarehousePermissionKey(warehouse.slug),
          label: warehouse.label,
        })),
      ],
    };
  });
}

function getAllPermissionItems(
  dynamicWarehouses: readonly DynamicWarehousePermissionItem[] = [],
) {
  return buildUserPermissionSections(dynamicWarehouses).flatMap(
    (section) => section.items,
  );
}

function buildPermissionState(
  overrides: Partial<Record<string, Partial<UserPermissionFlags>>> = {},
  dynamicWarehouses: readonly DynamicWarehousePermissionItem[] = [],
) {
  return getAllPermissionItems(dynamicWarehouses).reduce<
    Record<string, UserPermissionFlags>
  >((accumulator, item) => {
    accumulator[item.key] = {
      view: false,
      edit: false,
      create: false,
      ...overrides[item.key],
    };

    return accumulator;
  }, {});
}

export const userManagementDetails: UserManagementDetail[] = [];

export const approverOptions: string[] = [];

export const userManagementRows: UserManagementRecord[] = [];

export const userManagementFormFields: readonly MasterFieldDefinition[] = [
  {
    key: "userName",
    label: "User Name",
    type: "text",
    placeholder: "Enter User Name",
  },
  {
    key: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "Enter First Name",
  },
  {
    key: "lastName",
    label: "Last Name",
    type: "text",
    placeholder: "Enter Last Name",
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    options: [...departmentOptions],
    placeholder: "Select Department",
  },
  {
    key: "email",
    label: "Email",
    type: "text",
    placeholder: "Enter Email",
  },
  {
    key: "phoneNo",
    label: "Phone No",
    type: "text",
    placeholder: "Enter Phone No",
  },
  {
    key: "dateOfBirth",
    label: "Date Of Birth",
    type: "date",
    placeholder: "Select Date Of Birth",
  },
  {
    key: "age",
    label: "Age",
    type: "text",
    placeholder: "Enter Age",
  },
  {
    key: "bloodGroup",
    label: "Blood Group",
    type: "select",
    options: [...bloodGroupOptions],
    placeholder: "Select Blood Group",
  },
  {
    key: "address",
    label: "Address",
    type: "text",
    placeholder: "Enter Address",
  },
  {
    key: "pincode",
    label: "Pincode",
    type: "text",
    placeholder: "Enter Pincode",
  },
  {
    key: "country",
    label: "Country",
    type: "select",
    placeholder: "Select Country",
  },
  {
    key: "state",
    label: "State",
    type: "select",
    placeholder: "Select State",
  },
  {
    key: "city",
    label: "City",
    type: "select",
    placeholder: "Select City",
  },
  {
    key: "aadhaarNo",
    label: "Aadhaar No",
    type: "text",
    placeholder: "Enter Aadhaar No",
  },
  {
    key: "aadhaarUpload",
    label: "Aadhaar Upload",
    type: "file",
    placeholder: "Upload Aadhaar",
  },
  {
    key: "panNo",
    label: "PAN No",
    type: "text",
    placeholder: "Enter PAN No",
  },
  {
    key: "panUpload",
    label: "PAN Upload",
    type: "file",
    placeholder: "Upload PAN",
  },
  {
    key: "remarks",
    label: "Remarks",
    type: "text",
    placeholder: "Enter Remarks",
  },
];

export const userManagementConfigureFields: readonly MasterFieldDefinition[] = [
  {
    key: "userName",
    label: "User Name",
    type: "text",
    placeholder: "Selected User",
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    options: [...departmentOptions],
    placeholder: "Select Department",
  },
  {
    key: "role",
    label: "Role",
    type: "select",
    options: [],
    placeholder: "Select Role",
  },
  {
    key: "remarks",
    label: "Remarks",
    type: "text",
    placeholder: "Enter Remarks",
  },
  {
    key: "isActive",
    label: "Status",
    type: "toggle",
  },
];

export const userManagementViewFields = userManagementFormFields;

export function getUserManagementPaths() {
  return {
    list: "/user-management",
    add: "/user-management/add",
    edit: (id: string) => `/user-management/edit/${id}`,
    view: (id: string) => `/user-management/view/${id}`,
  };
}

export function getUserManagementSearchValues(row: UserManagementRecord) {
  return [
    ...userManagementColumns.map(
      (column) => row[column.key as keyof UserManagementRecord],
    ),
    row.role,
    row.department,
    row.userName,
    `${row.firstName} ${row.lastName}`.trim(),
    row.statusLabel,
    row.createdBy,
    row.createdDate,
    row.updatedDate,
  ];
}

export function buildUserManagementInitialValues(
  fields: readonly MasterFieldDefinition[],
  row?: UserManagementDetail,
) {
  return fields.reduce<Record<string, MasterFieldValue>>((accumulator, field) => {
    if (field.key === "isActive") {
      accumulator[field.key] = row?.isActive ?? false;
      return accumulator;
    }

    const value = row?.[field.key as keyof UserManagementDetail];

    if (field.type === "date") {
      accumulator[field.key] = value instanceof Date ? value : null;
      return accumulator;
    }

    accumulator[field.key] = typeof value === "string" ? value : "";
    return accumulator;
  }, {});
}

export function buildDefaultUserPermissions() {
  return buildPermissionState();
}

export function getUserManagementDetail(id: string) {
  return userManagementDetails.find((row) => row.id === id);
}

export function getUserManagementDetailByName(userName: string) {
  return userManagementDetails.find((row) => row.userName === userName);
}

export function getDefaultUserManagementDetail():
  | UserManagementDetail
  | undefined {
  return userManagementDetails[0];
}
