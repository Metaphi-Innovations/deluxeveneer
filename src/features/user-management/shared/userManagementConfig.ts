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

export const departmentOptions = [
  "Management / Admin",
  "Production Team",
  "Warehouse Team",
  "Dispatch Team",
  "Sales Team",
  "Accounts Team",
] as const;

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

const userManagementSeedRows: UserManagementSeedRow[] = [
  {
    userName: "Rohan Patel",
    userType: "Executive",
    department: "Warehouse Team",
    approver: "Dev Joshi",
    role: "Warehouse Executive",
    firstName: "Rohan",
    lastName: "Patel",
    email: "rohan.patel@deluxeveneers.com",
    country: "India",
    state: "Gujarat",
    city: "Ahmedabad",
    address: "Warehouse Campus, Sarkhej Road",
    pincode: "380051",
    gender: "Male",
    bloodGroup: "B+",
    dateOfBirth: new Date("1995-03-14"),
    age: "31",
    phoneNo: "+91 9876501201",
    remarks: "Warehouse stock visibility and inward coordination.",
    createdBy: "Neha Sharma",
    createdDate: new Date("2026-06-12"),
    updatedBy: "Neha Sharma",
    updatedDate: new Date("2026-06-24"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      userManagement: { view: true },
      warehouseA: { view: true, edit: true, create: true },
      warehouseB: { view: true, edit: true },
      warehouseC: { view: true },
    }),
  },
  {
    userName: "Ananya Saxena",
    userType: "Manager",
    department: "Sales Team",
    approver: "Tanya Khanna",
    role: "Sales Coordinator",
    firstName: "Ananya",
    lastName: "Saxena",
    email: "ananya.saxena@deluxeveneers.com",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    address: "Corporate Office, Connaught Place",
    pincode: "110001",
    gender: "Female",
    bloodGroup: "A+",
    dateOfBirth: new Date("1992-08-22"),
    age: "33",
    phoneNo: "+91 9876501202",
    remarks: "Sales coordination, order intake, and dispatch visibility.",
    createdBy: "Vikram Mehta",
    createdDate: new Date("2026-06-10"),
    updatedBy: "Vikram Mehta",
    updatedDate: new Date("2026-06-26"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      customerMaster: { view: true, create: true, edit: true },
      itemMaster: { view: true },
      placeOrder: { view: true, create: true, edit: true },
      packing: { view: true },
      dispatch: { view: true },
    }),
  },
  {
    userName: "Karan Gupta",
    userType: "Executive",
    department: "Sales Team",
    approver: "Ananya Saxena",
    role: "Sales Executive",
    firstName: "Karan",
    lastName: "Gupta",
    email: "karan.gupta@deluxeveneers.com",
    country: "India",
    state: "Rajasthan",
    city: "Jaipur",
    address: "Regional Sales Office, Tonk Road",
    pincode: "302018",
    gender: "Male",
    bloodGroup: "O+",
    dateOfBirth: new Date("1996-01-09"),
    age: "30",
    phoneNo: "+91 9876501203",
    remarks: "Client coordination for orders and dispatch updates.",
    createdBy: "Aarav Bansal",
    createdDate: new Date("2026-06-08"),
    updatedBy: "Aarav Bansal",
    updatedDate: new Date("2026-06-18"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      customerMaster: { view: true },
      placeOrder: { view: true, create: true },
      dispatch: { view: true },
    }),
  },
  {
    userName: "Samar Singh",
    userType: "Supervisor",
    department: "Production Team",
    approver: "Dev Joshi",
    role: "Production Supervisor",
    firstName: "Samar",
    lastName: "Singh",
    email: "samar.singh@deluxeveneers.com",
    country: "India",
    state: "Gujarat",
    city: "Surat",
    address: "Factory Unit 1, Kamrej",
    pincode: "394185",
    gender: "Male",
    bloodGroup: "A-",
    dateOfBirth: new Date("1989-06-17"),
    age: "37",
    phoneNo: "+91 9876501205",
    remarks: "Factory process execution across active production stages.",
    createdBy: "Vikram Mehta",
    createdDate: new Date("2026-06-07"),
    updatedBy: "Vikram Mehta",
    updatedDate: new Date("2026-06-22"),
    isActive: false,
    permissions: buildPermissionState({
      dashboard: { view: true },
      warehouseB: { view: true },
      slicing: { view: true, edit: true },
      drying: { view: true, edit: true },
      inspection: { view: true, edit: true },
      sawing: { view: true, edit: true },
      pressing: { view: true, edit: true },
      finishing: { view: true, edit: true },
      cncFluting: { view: true, edit: true },
      embossing: { view: true, edit: true },
      grouping: { view: true, edit: true },
      splicing: { view: true, edit: true },
      marquetry: { view: true, edit: true },
    }),
  },
  {
    userName: "Priya Desai",
    userType: "Executive",
    department: "Accounts Team",
    approver: "Tanya Khanna",
    role: "Accounts Executive",
    firstName: "Priya",
    lastName: "Desai",
    email: "priya.desai@deluxeveneers.com",
    country: "India",
    state: "Gujarat",
    city: "Ahmedabad",
    address: "Accounts Office, SG Highway",
    pincode: "380015",
    gender: "Female",
    bloodGroup: "O-",
    dateOfBirth: new Date("1993-02-26"),
    age: "32",
    phoneNo: "+91 9876501206",
    remarks: "Commercial documentation and inward financial visibility.",
    createdBy: "Aarav Bansal",
    createdDate: new Date("2026-06-11"),
    updatedBy: "Aarav Bansal",
    updatedDate: new Date("2026-06-23"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      customerMaster: { view: true },
      supplierMaster: { view: true },
      currencyMaster: { view: true },
      gstMaster: { view: true, edit: true },
      hsnMaster: { view: true, edit: true },
      dispatch: { view: true },
      placeOrder: { view: true },
    }),
  },
  {
    userName: "Dev Joshi",
    userType: "Admin",
    department: "Management / Admin",
    approver: "Tanya Khanna",
    role: "System Administrator",
    firstName: "Dev",
    lastName: "Joshi",
    email: "dev.joshi@deluxeveneers.com",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    address: "Head Office, Barakhamba Road",
    pincode: "110001",
    gender: "Male",
    bloodGroup: "B-",
    dateOfBirth: new Date("1988-12-05"),
    age: "38",
    phoneNo: "+91 9876501207",
    remarks: "Administrative oversight across commercial and factory modules.",
    createdBy: "Vikram Mehta",
    createdDate: new Date("2026-06-09"),
    updatedBy: "Vikram Mehta",
    updatedDate: new Date("2026-06-27"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      userManagement: { view: true, edit: true, create: true },
      rolesPermissions: { view: true, edit: true, create: true },
      colorMaster: { view: true, edit: true, create: true },
      currencyMaster: { view: true, edit: true, create: true },
      customerMaster: { view: true, edit: true, create: true },
      gradeMaster: { view: true, edit: true, create: true },
      itemMaster: { view: true, edit: true, create: true },
      supplierMaster: { view: true, edit: true, create: true },
      warehouseA: { view: true, edit: true, create: true },
      warehouseB: { view: true, edit: true, create: true },
      warehouseC: { view: true, edit: true, create: true },
      placeOrder: { view: true, edit: true, create: true },
      packing: { view: true, edit: true, create: true },
      dispatch: { view: true, edit: true, create: true },
      componentLibrary: { view: true },
    }),
  },
  {
    userName: "Nisha Kapoor",
    userType: "Executive",
    department: "Dispatch Team",
    approver: "Tanya Khanna",
    role: "Dispatch Coordinator",
    firstName: "Nisha",
    lastName: "Kapoor",
    email: "nisha.kapoor@deluxeveneers.com",
    country: "India",
    state: "West Bengal",
    city: "Kolkata",
    address: "Dispatch Block, Unit 3",
    pincode: "700091",
    gender: "Female",
    bloodGroup: "A+",
    dateOfBirth: new Date("1995-09-30"),
    age: "30",
    phoneNo: "+91 9876501208",
    remarks: "Dispatch documentation and packed order release workflow.",
    createdBy: "Neha Sharma",
    createdDate: new Date("2026-06-13"),
    updatedBy: "Neha Sharma",
    updatedDate: new Date("2026-06-28"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      warehouseC: { view: true },
      packing: { view: true },
      dispatch: { view: true, edit: true, create: true },
      placeOrder: { view: true },
    }),
  },
  {
    userName: "Ritesh Vora",
    userType: "Supervisor",
    department: "Warehouse Team",
    approver: "Dev Joshi",
    role: "Warehouse Supervisor",
    firstName: "Ritesh",
    lastName: "Vora",
    email: "ritesh.vora@deluxeveneers.com",
    country: "India",
    state: "Gujarat",
    city: "Surat",
    address: "Warehouse B, Ring Road",
    pincode: "395002",
    gender: "Male",
    bloodGroup: "AB-",
    dateOfBirth: new Date("1991-05-11"),
    age: "35",
    phoneNo: "+91 9876501209",
    remarks: "Warehouse B inventory and movement monitoring access.",
    createdBy: "Aarav Bansal",
    createdDate: new Date("2026-06-15"),
    updatedBy: "Aarav Bansal",
    updatedDate: new Date("2026-06-29"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      warehouseA: { view: true, create: true },
      warehouseB: { view: true, edit: true, create: true },
      warehouseC: { view: true },
    }),
  },
  {
    userName: "Tanya Khanna",
    userType: "Manager",
    department: "Management / Admin",
    approver: "Dev Joshi",
    role: "Executive Approver",
    firstName: "Tanya",
    lastName: "Khanna",
    email: "tanya.khanna@deluxeveneers.com",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    address: "Executive Office, BKC",
    pincode: "400051",
    gender: "Female",
    bloodGroup: "O+",
    dateOfBirth: new Date("1990-07-19"),
    age: "36",
    phoneNo: "+91 9876501210",
    remarks: "Executive visibility for customer, order, and dispatch flow.",
    createdBy: "Neha Sharma",
    createdDate: new Date("2026-06-16"),
    updatedBy: "Neha Sharma",
    updatedDate: new Date("2026-06-30"),
    isActive: true,
    permissions: buildPermissionState({
      dashboard: { view: true },
      customerMaster: { view: true },
      supplierMaster: { view: true },
      placeOrder: { view: true },
      packing: { view: true },
      dispatch: { view: true },
      componentLibrary: { view: true },
    }),
  },
];

export const userManagementDetails: UserManagementDetail[] =
  userManagementSeedRows.slice(0, 2).map((row, index) => ({
    id: `user-${index + 1}`,
    ...row,
    statusLabel: row.isActive ? "Active" : "Inactive",
  }));

export const approverOptions = userManagementDetails.map((row) => row.userName);

export const userManagementRows: UserManagementRecord[] = userManagementDetails.map(
  ({ permissions, ...row }) => row,
);

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

export function getDefaultUserManagementDetail() {
  return userManagementDetails[0];
}
