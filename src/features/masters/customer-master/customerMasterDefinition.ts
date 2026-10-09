import type { MasterDefinition } from "../shared/types";

export const customerMasterDefinition: MasterDefinition = {
  slug: "customer-master",
  title: "Customer Master",
  gridColumns: 4,
  columns: [
    { key: "customerName", label: "Customer Name" },
    { key: "companyName", label: "Company Name" },
    { key: "customerType", label: "Customer Type" },
    { key: "email", label: "Email" },
    { key: "phoneNumber", label: "Phone No" },
    { key: "gstNo", label: "GSTIN" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    {
      key: "customerType",
      label: "Customer Type",
      options: ["Platinum", "Gold", "Silver"],
    },
    { key: "companyName", label: "Company Name", options: [] },
  ],
  fields: [
    // Line 1: customer type, customer name, company name, email, phone, dob
    {
      key: "customerType",
      label: "Customer Type",
      type: "select",
      options: ["Platinum", "Gold", "Silver"],
    },
    { key: "customerName", label: "Customer Name", type: "text" },
    { key: "companyName", label: "Company Name", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phoneNumber", label: "Phone Number", type: "text" },
    { key: "dob", label: "Date of Birth", type: "date" },

    // Line 2: address, pincode, country, state, city
    { key: "address", label: "Address", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "country", label: "Country", type: "select", options: [] },
    { key: "state", label: "State", type: "select", options: [] },
    { key: "city", label: "City", type: "select", options: [] },

    // Line 3: gstin, gstin upload, pan, pan upload, remark
    { key: "gstNo", label: "GSTIN", type: "text" },
    { key: "gstUpload", label: "GSTIN Upload", type: "file" },
    { key: "panNo", label: "PAN No", type: "text" },
    { key: "panUpload", label: "PAN Upload", type: "file" },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};
