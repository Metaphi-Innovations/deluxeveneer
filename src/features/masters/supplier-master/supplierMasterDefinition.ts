import type { MasterDefinition } from "../shared/types";

export const MSME_TYPE_OPTIONS = [
  "Micro Enterprise",
  "Small Enterprise",
  "Medium Enterprise",
  "Large",
  "No MSME",
] as const;

export const supplierMasterDefinition: MasterDefinition = {
  slug: "supplier-master",
  title: "Supplier Master",
  gridColumns: 4,
  columns: [
    { key: "supplierName", label: "Supplier Name" },
    { key: "contactPersonName", label: "Contact Person Name" },
    { key: "emailAddress", label: "Email" },
    { key: "mobileNumber", label: "Phone Number" },
    { key: "gstNo", label: "GSTIN" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "country", label: "Country", options: [] },
    { key: "msmeType", label: "MSME Type", options: [...MSME_TYPE_OPTIONS] },
  ],
  fields: [
    { key: "supplierName", label: "Supplier Name", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "country", label: "Country", type: "select", options: [] },
    { key: "state", label: "State", type: "select", options: [] },
    { key: "city", label: "City", type: "select", options: [] },
    { key: "msmeType", label: "MSME Type", type: "select", options: [...MSME_TYPE_OPTIONS] },
    { key: "msmeNo", label: "MSME No", type: "text" },
    { key: "gstNo", label: "GSTIN", type: "text" },
    { key: "fscCode", label: "FSC Code", type: "text" },
    { key: "gstUpload", label: "GSTIN Upload", type: "file" },
    { key: "panNo", label: "PAN No", type: "text" },
    { key: "panUpload", label: "PAN Upload", type: "file" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
  ],
  rows: [],
};
