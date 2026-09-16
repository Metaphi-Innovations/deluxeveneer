import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import type { MasterFieldDefinition, MasterFieldValue } from "../../masters/shared";
import {
  buildDefaultUserPermissions,
  type UserPermissionFlags,
} from "../../user-management/shared";

interface RolePermissionSeedRow {
  roleName: string;
  department: string;
  remark: string;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  isActive: boolean;
  permissions: Record<string, UserPermissionFlags>;
}

export interface RolePermissionRecord extends EnterpriseTableRow {
  id: string;
  roleName: string;
  department: string;
  remark: string;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  isActive: boolean;
  statusLabel: string;
}

export interface RolePermissionDetail {
  id: string;
  roleName: string;
  department: string;
  remark: string;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  isActive: boolean;
  statusLabel: string;
  permissions: Record<string, UserPermissionFlags>;
}

export const rolePermissionColumns: readonly EnterpriseTableColumn<RolePermissionRecord>[] =
  [
    { key: "roleName", label: "Role Name" },
    { key: "department", label: "Department Name" },
    { key: "statusLabel", label: "Status" },
    { key: "remark", label: "Remarks" },
    { key: "createdBy", label: "Created By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ];

const defaultPermissions = buildDefaultUserPermissions();

const rolePermissionSeedRows: readonly RolePermissionSeedRow[] = [
  {
    roleName: "ADMIN",
    department: "Management / Admin",
    remark: "Administrative control across all ERP modules.",
    createdBy: "Dev Joshi",
    createdDate: new Date("2026-02-21"),
    updatedDate: new Date("2026-05-05"),
    isActive: true,
    permissions: defaultPermissions,
  },
  {
    roleName: "PRODUCTION TEAM",
    department: "Production Team",
    remark: "Factory execution access for process movement and completion.",
    createdBy: "Dev Joshi",
    createdDate: new Date("2026-03-11"),
    updatedDate: new Date("2026-06-12"),
    isActive: true,
    permissions: defaultPermissions,
  },
  {
    roleName: "WAREHOUSE TEAM",
    department: "Warehouse Team",
    remark: "Warehouse inward, stock control, and material issue visibility.",
    createdBy: "Neha Sharma",
    createdDate: new Date("2026-03-18"),
    updatedDate: new Date("2026-06-19"),
    isActive: true,
    permissions: defaultPermissions,
  },
  {
    roleName: "DISPATCH TEAM",
    department: "Dispatch Team",
    remark: "Packing dispatch preparation and outward execution access.",
    createdBy: "Tanya Khanna",
    createdDate: new Date("2026-04-02"),
    updatedDate: new Date("2026-06-24"),
    isActive: true,
    permissions: defaultPermissions,
  },
  {
    roleName: "SALES TEAM",
    department: "Sales Team",
    remark: "Order intake, customer coordination, and dispatch tracking.",
    createdBy: "Tanya Khanna",
    createdDate: new Date("2026-04-07"),
    updatedDate: new Date("2026-06-26"),
    isActive: true,
    permissions: defaultPermissions,
  },
  {
    roleName: "ACCOUNTS TEAM",
    department: "Accounts Team",
    remark: "Commercial validation, tax visibility, and order audit access.",
    createdBy: "Priya Desai",
    createdDate: new Date("2026-04-14"),
    updatedDate: new Date("2026-06-28"),
    isActive: true,
    permissions: defaultPermissions,
  },
];

const rolePermissionDetails: readonly RolePermissionDetail[] =
  rolePermissionSeedRows.slice(0, 2).map((row, index) => ({
    id: `role-${index + 1}`,
    ...row,
    statusLabel: row.isActive ? "Active" : "Inactive",
  }));

export const rolePermissionRows: readonly RolePermissionRecord[] =
  rolePermissionDetails.map(({ permissions, ...row }) => row);

export const rolePermissionFormFields: readonly MasterFieldDefinition[] = [
  {
    key: "roleName",
    label: "Role Name",
    type: "text",
    placeholder: "Enter Role Name",
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    options: [],
    placeholder: "Select Department",
  },
  {
    key: "remark",
    label: "Remark",
    type: "text",
    placeholder: "Enter Remark",
  },
];

export const rolePermissionConfigureFields: readonly MasterFieldDefinition[] = [
  {
    key: "roleName",
    label: "Role Name",
    type: "text",
    placeholder: "Selected Role",
    readOnly: true,
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    options: [],
    placeholder: "Select Department",
  },
  {
    key: "remark",
    label: "Remark",
    type: "text",
    placeholder: "Enter Remark",
  },
];

export function getRolePermissionPaths() {
  return {
    list: "/roles-permissions",
    add: "/roles-permissions/add",
    configure: (id: string) => `/roles-permissions/configure/${id}`,
  };
}

export function getRolePermissionSearchValues(row: RolePermissionRecord) {
  return [
    row.roleName,
    row.department,
    row.statusLabel,
    row.remark,
    row.createdBy,
    row.createdDate,
    row.updatedDate,
  ];
}

export function buildRolePermissionInitialValues(
  fields: readonly MasterFieldDefinition[],
  row?: RolePermissionDetail,
) {
  return fields.reduce<Record<string, MasterFieldValue>>((accumulator, field) => {
    if (field.key === "isActive") {
      accumulator[field.key] = row?.isActive ?? true;
      return accumulator;
    }

    const value = row?.[field.key as keyof RolePermissionDetail];
    accumulator[field.key] = typeof value === "string" ? value : "";
    return accumulator;
  }, {});
}

export function withRolePermissionDepartmentOptions(
  fields: readonly MasterFieldDefinition[],
  departmentNames: readonly string[],
  currentDepartment = "",
) {
  const options = Array.from(
    new Set(
      [...departmentNames, currentDepartment]
        .map((department) => department.trim())
        .filter(Boolean),
    ),
  );

  return fields.map((field) =>
    field.key === "department"
      ? {
          ...field,
          options,
        }
      : field,
  );
}

export function getRolePermissionDetail(id: string) {
  return rolePermissionDetails.find((row) => row.id === id);
}

export function buildDefaultRolePermissions() {
  return buildDefaultUserPermissions();
}
