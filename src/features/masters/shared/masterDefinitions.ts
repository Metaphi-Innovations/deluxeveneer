import type { MasterDefinition, MasterRecord } from "./types";
import { createMasterRows } from "./utils";

const asDate = (value: string) => new Date(value);

const demoListingRowCount = 12;

function limitDemoListingRows<T extends MasterRecord>(
  rows: ReadonlyArray<T>,
  options: { count?: number; uniqueKey?: string } = {},
) {
  if (rows.length === 0) {
    return [] as T[];
  }

  const count = options.count ?? demoListingRowCount;
  const usedUniqueValues = new Set(
    options.uniqueKey
      ? rows
          .map((row) => row[options.uniqueKey!])
          .filter((value): value is string => typeof value === "string")
      : [],
  );

  return Array.from({ length: count }, (_, index) => {
    const sourceRow = rows[index % rows.length]!;

    if (index < rows.length) {
      return sourceRow;
    }

    return createMasterDemoRow(
      sourceRow,
      index,
      options.uniqueKey,
      usedUniqueValues,
    );
  });
}

function createMasterDemoRow<T extends MasterRecord>(
  row: T,
  index: number,
  uniqueKey?: string,
  usedUniqueValues?: Set<string>,
) {
  const sequence = String(index + 1).padStart(2, "0");
  const clonedRow = {
    ...row,
    id: `${row.id}-demo-${sequence}`,
  } as MasterRecord;
  const identityKeys = [
    "itemName",
    "itemCode",
    "categoryName",
    "itemSubCategory",
    "colorName",
    "cutName",
    "gradeName",
    "customerName",
    "companyName",
    "unitName",
    "symbolicName",
    "supplierName",
    "transporterName",
    "branchName",
    "warehouseName",
    "warehouseCode",
    "currencyName",
    "currencyCode",
    "hsnCodeDescription",
  ] as const;

  identityKeys.forEach((key) => {
    const value = clonedRow[key];

    if (typeof value === "string" && value.trim()) {
      clonedRow[key] = `${value} ${sequence}`;
    }
  });

  if (uniqueKey && usedUniqueValues) {
    const uniqueValue = getNextUniqueMasterValue(
      uniqueKey,
      index,
      usedUniqueValues,
    );
    clonedRow[uniqueKey] = uniqueValue;
    usedUniqueValues.add(uniqueValue);
  }

  if (typeof clonedRow.remark === "string" && clonedRow.remark.trim()) {
    clonedRow.remark = `${clonedRow.remark} Demo entry ${sequence}.`;
  }

  return clonedRow as T;
}

function getNextUniqueMasterValue(
  key: string,
  index: number,
  usedValues: Set<string>,
) {
  let sequence = index;
  let candidate =
    key === "hsnCode"
      ? String(4400 + sequence)
      : `${key.toUpperCase()}-${String(sequence + 1).padStart(2, "0")}`;

  while (usedValues.has(candidate)) {
    sequence += 1;
    candidate =
      key === "hsnCode"
        ? String(4400 + sequence)
        : `${key.toUpperCase()}-${String(sequence + 1).padStart(2, "0")}`;
  }

  return candidate;
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

const customerRows = withAuditFields(createMasterRows("customer-master", [
  {
    customerName: "Vikram Mehta",
    companyName: "Prime Habitat Studio",
    customerType: "Architect",
    dob: asDate("1986-03-12"),
    email: "vikram@primehabitat.in",
    phoneNumber: "+91 98765 44120",
    address: "Bandra Kurla Complex",
    pincode: "400051",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    gstNo: "27AABCP1122L1ZX",
    gstUpload: "prime-habitat-gst.pdf",
    panNo: "AABCP1122L",
    panUpload: "prime-habitat-pan.pdf",
    remark: "Premium interior fit-out account.",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-22"),
    updatedDate: asDate("2026-05-28"),
  },
  {
    customerName: "Aarav Soni",
    companyName: "Timberline Projects",
    customerType: "Dealer",
    dob: asDate("1989-07-08"),
    email: "aarav@timberline.in",
    phoneNumber: "+91 98250 77891",
    address: "Satellite Road",
    pincode: "380015",
    country: "India",
    state: "Gujarat",
    city: "Ahmedabad",
    gstNo: "29AACCT4488C1ZP",
    gstUpload: "timberline-gst.pdf",
    panNo: "AACCT4488C",
    panUpload: "timberline-pan.pdf",
    remark: "Bulk plywood and veneer dispatch account.",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-03"),
    updatedDate: asDate("2026-06-01"),
  },
  {
    customerName: "Rhea Kapoor",
    companyName: "Aura Living Concepts",
    customerType: "Retail",
    dob: asDate("1992-11-16"),
    email: "rhea@auraliving.in",
    phoneNumber: "+91 98111 23498",
    address: "C G Road",
    pincode: "380009",
    country: "India",
    state: "Gujarat",
    city: "Ahmedabad",
    gstNo: "24AATCA5567D1Z2",
    gstUpload: "aura-living-gst.pdf",
    panNo: "AATCA5567D",
    panUpload: "aura-living-pan.pdf",
    remark: "Focus on designer sample sheets.",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-05-17"),
    updatedDate: asDate("2026-06-05"),
  },
  {
    customerName: "Harsh Vora",
    companyName: "Woodform Spaces",
    customerType: "Architect",
    dob: asDate("1984-01-29"),
    email: "harsh@woodformspaces.com",
    phoneNumber: "+91 98989 67012",
    address: "Connaught Place",
    pincode: "110001",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    gstNo: "07AAFCW9011J1ZW",
    gstUpload: "woodform-gst.pdf",
    panNo: "AAFCW9011J",
    panUpload: "woodform-pan.pdf",
    remark: "Requires FSC-certified veneer selections.",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-03-28"),
    updatedDate: asDate("2026-05-19"),
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

const supplierRows = withAuditFields(createMasterRows("supplier-master", [
  {
    supplierName: "Arihant Veneers LLP",
    supplierType: "Domestic",
    contactPersonName: "Karan Shah",
    designation: "Sales Manager",
    mobileNumber: "+91 98250 11223",
    emailAddress: "karan@arihantveneers.in",
    address: "Narol Industrial Estate",
    pincode: "380051",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    msmeType: "Small",
    msmeNo: "UDYAM-GJ-10-1122334",
    gstNo: "24AAWFA2214F1Z5",
    gstUpload: "arihant-gst.pdf",
    panNo: "AAWFA2214F",
    panUpload: "arihant-pan.pdf",
    status: "Active",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-12"),
    updatedDate: asDate("2026-05-07"),
  },
  {
    supplierName: "Baltic Timber Supply",
    supplierType: "Import",
    contactPersonName: "Elina Markova",
    designation: "Export Coordinator",
    mobileNumber: "+371 22 455 881",
    emailAddress: "elina@baltictimber.eu",
    address: "Riga Export Terminal",
    pincode: "100001",
    city: "Riga",
    state: "Riga",
    country: "Latvia",
    msmeType: "Corporate",
    msmeNo: "EU-CORP-771092",
    gstNo: "LT-EXIM-771092",
    gstUpload: "baltic-gst.pdf",
    panNo: "BTSUP7710K",
    panUpload: "baltic-pan.pdf",
    status: "Active",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-27"),
    updatedDate: asDate("2026-05-20"),
  },
  {
    supplierName: "City Timber Traders",
    supplierType: "Domestic",
    contactPersonName: "Nitin Arora",
    designation: "Proprietor",
    mobileNumber: "+91 98101 44770",
    emailAddress: "nitin@citytimber.in",
    address: "Karol Bagh Timber Market",
    pincode: "110001",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    msmeType: "Medium",
    msmeNo: "UDYAM-DL-05-7784510",
    gstNo: "07AAKFC5561N1Z8",
    gstUpload: "city-timber-gst.pdf",
    panNo: "AAKFC5561N",
    panUpload: "city-timber-pan.pdf",
    status: "Active",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-10"),
    updatedDate: asDate("2026-05-29"),
  },
  {
    supplierName: "Nordic Veneer House",
    supplierType: "Import",
    contactPersonName: "Mikael Sorensen",
    designation: "Account Director",
    mobileNumber: "+45 31 77 9821",
    emailAddress: "mikael@nordicveneer.dk",
    address: "Aarhus Port",
    pincode: "800000",
    city: "Aarhus",
    state: "Central Denmark",
    country: "Denmark",
    msmeType: "Corporate",
    msmeNo: "EU-CORP-883214",
    gstNo: "DK-EXIM-883214",
    gstUpload: "nordic-gst.pdf",
    panNo: "NVHOU8832Q",
    panUpload: "nordic-pan.pdf",
    status: "Inactive",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-05-24"),
    updatedDate: asDate("2026-06-08"),
  },
]));

const transporterRows = withAuditFields(createMasterRows("transporter-master", [
  {
    transporterName: "Amardeep Cargo Logistic",
    branchName: "Ahmedabad",
    transporterId: "TRN-AMD-001",
    type: "Road",
    areaOfOperation: "Ahmedabad",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-05-04"),
    updatedDate: asDate("2026-06-02"),
  },
  {
    transporterName: "National Freight Carrier",
    branchName: "Mumbai",
    transporterId: "TRN-NFC-014",
    type: "Road",
    areaOfOperation: "Mumbai",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-05-12"),
    updatedDate: asDate("2026-06-08"),
  },
  {
    transporterName: "Deluxe Transport Services",
    branchName: "Surat",
    transporterId: "TRN-DTS-021",
    type: "Road",
    areaOfOperation: "Surat",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-21"),
    updatedDate: asDate("2026-06-15"),
  },
  {
    transporterName: "Blue Sky Air Cargo",
    branchName: "Delhi",
    transporterId: "TRN-BSA-032",
    type: "Air",
    areaOfOperation: "Delhi",
    createdEditedBy: "Aditi Desai",
    updatedBy: "Atharva Patil",
    createdEditedDate: asDate("2026-06-01"),
    updatedDate: asDate("2026-06-20"),
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

const warehouseRows = withAuditFields(createMasterRows("warehouse-location-master", [
  {
    warehouseName: "Warehouse A",
    warehouseCode: "WH-A-01",
    warehouseType: "Inward",
    status: "Active",
    address: "Plot 18, GIDC Estate, Changodar",
    city: "Ahmedabad",
    pincode: "382213",
    state: "Gujarat",
    country: "India",
    remark: "Primary inward warehouse for veneer receipts.",
    createdEditedBy: "Atharva Patil",
    updatedBy: "Neha Shah",
    createdEditedDate: asDate("2026-04-13"),
    updatedDate: asDate("2026-05-05"),
  },
  {
    warehouseName: "Warehouse B",
    warehouseCode: "WH-B-02",
    warehouseType: "Storage",
    status: "Active",
    address: "Shed 9, Timber Market Road, Narol",
    city: "Ahmedabad",
    pincode: "382405",
    state: "Gujarat",
    country: "India",
    remark: "Finished inspected stock storage location.",
    createdEditedBy: "Neha Shah",
    updatedBy: "Rohit Jain",
    createdEditedDate: asDate("2026-04-26"),
    updatedDate: asDate("2026-05-18"),
  },
  {
    warehouseName: "Warehouse C",
    warehouseCode: "WH-C-03",
    warehouseType: "Production",
    status: "Active",
    address: "Unit 4, Industrial Layout, Sanand",
    city: "Sanand",
    pincode: "382110",
    state: "Gujarat",
    country: "India",
    remark: "Production stage transfer warehouse.",
    createdEditedBy: "Rohit Jain",
    updatedBy: "Aditi Desai",
    createdEditedDate: asDate("2026-05-09"),
    updatedDate: asDate("2026-05-28"),
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
    { key: "category", label: "Category", type: "select", options: activeOptions(itemCategoryRows, "categoryName") },
    { key: "subCategory", label: "Sub Category", type: "select", options: activeOptions(itemSubCategoryRows, "itemSubCategory") },
    { key: "color", label: "Color", type: "select", options: activeOptions(colorRows, "colorName") },
    { key: "hsn", label: "HSN Code", type: "select", options: activeOptions(hsnRows, "hsnCode") },
    {
      key: "gst",
      label: "GST No",
      type: "select",
      options: activeOptions(gstRows, "gstPercentage"),
      readOnly: true,
      autoFillFrom: {
        rows: limitDemoListingRows(hsnRows),
        sourceSlug: "hsn-master",
        sourceKey: "hsn",
        sourceMatchKey: "hsnCode",
        sourceValueKey: "gstPercentage",
      },
    },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: limitDemoListingRows(itemRows),
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
  rows: limitDemoListingRows(itemCategoryRows),
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
  rows: limitDemoListingRows(itemSubCategoryRows),
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
  rows: limitDemoListingRows(colorRows),
};

export const cutMasterOptions = uniqueOptions(cutRows, "cutName");
export const gradeMasterOptions = uniqueOptions(gradeRows, "gradeName");
export const gstMasterOptions = uniqueOptions(gstRows, "gstPercentage");
export const supplierMasterOptions = activeOptions(supplierRows, "supplierName");
export const currencyMasterOptions = activeOptions(currencyRows, "currencyName");
export const itemMasterOptions = activeOptions(itemRows, "itemName");
export const hsnMasterOptions = activeOptions(hsnRows, "hsnCode");

export const warehouseABillingState = "Gujarat";

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

  const match = (supplierRows as readonly MasterRecord[]).find(
    (row) =>
      String(row.supplierName ?? "").trim().toLowerCase() === normalizedName,
  );

  return match ? String(match.state ?? "") : "";
}

export function getWarehouseAGstMode(
  supplierName: string,
): "intra" | "inter" {
  const supplierState = getSupplierState(supplierName).trim().toLowerCase();

  if (!supplierState) {
    return "intra";
  }

  return supplierState === warehouseABillingState.toLowerCase()
    ? "intra"
    : "inter";
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
  rows: limitDemoListingRows(cutRows),
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
  rows: limitDemoListingRows(gradeRows),
};

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
    { key: "gstNo", label: "GST No" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "customerType", label: "Customer Type", options: uniqueOptions(customerRows, "customerType") },
    { key: "companyName", label: "Company Name", options: uniqueOptions(customerRows, "companyName") },
  ],
  fields: [
    { key: "customerName", label: "Customer Name", type: "text" },
    { key: "companyName", label: "Company Name", type: "text" },
    {
      key: "customerType",
      label: "Customer Type",
      type: "select",
      options: ["Platinum", "Gold", "Silver"],
    },
    { key: "dob", label: "Date of Birth", type: "date" },
    { key: "email", label: "Email", type: "text" },
    { key: "phoneNumber", label: "Phone Number", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "country", label: "Country", type: "select", options: uniqueOptions(customerRows, "country") },
    { key: "state", label: "State", type: "select", options: uniqueOptions(customerRows, "state") },
    { key: "city", label: "City", type: "select", options: uniqueOptions(customerRows, "city") },
    { key: "gstNo", label: "GST No", type: "text" },
    { key: "gstUpload", label: "GST Upload", type: "file" },
    { key: "panNo", label: "PAN No", type: "text" },
    { key: "panUpload", label: "PAN Upload", type: "file" },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: limitDemoListingRows(customerRows),
};

export const unitMasterDefinition: MasterDefinition = {
  slug: "unit-master",
  title: "Unit Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "unitName", label: "Unit Name" },
    { key: "symbolicName", label: "Symbolic Name" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "status", label: "Status" },
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
  ],
  rows: limitDemoListingRows(unitRows),
};

export const supplierMasterDefinition: MasterDefinition = {
  slug: "supplier-master",
  title: "Supplier Master",
  gridColumns: 4,
  columns: [
    { key: "supplierName", label: "Supplier Name" },
    { key: "contactPersonName", label: "Contact Person Name" },
    { key: "emailAddress", label: "Email" },
    { key: "mobileNumber", label: "Phone Number" },
    { key: "gstNo", label: "GST No" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "country", label: "Country", options: uniqueOptions(supplierRows, "country") },
    { key: "msmeType", label: "MSME Type", options: uniqueOptions(supplierRows, "msmeType") },
  ],
  fields: [
    { key: "supplierName", label: "Supplier Name", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "country", label: "Country", type: "select", options: uniqueOptions(supplierRows, "country") },
    { key: "state", label: "State", type: "select", options: uniqueOptions(supplierRows, "state") },
    { key: "city", label: "City", type: "select", options: uniqueOptions(supplierRows, "city") },
    { key: "msmeType", label: "MSME Type", type: "text" },
    { key: "msmeNo", label: "MSME No", type: "text" },
    { key: "gstNo", label: "GST No", type: "text" },
    { key: "fscCode", label: "FSC Code", type: "text" },
    { key: "gstUpload", label: "GST Upload", type: "file" },
    { key: "panNo", label: "PAN No", type: "text" },
    { key: "panUpload", label: "PAN Upload", type: "file" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: limitDemoListingRows(supplierRows),
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
  rows: gstRows,
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
  rows: limitDemoListingRows(hsnRows, { uniqueKey: "hsnCode" }),
};

export const warehouseLocationMasterDefinition: MasterDefinition = {
  slug: "warehouse-location-master",
  title: "Warehouse / Location Master",
  gridColumns: 4,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "warehouseName", label: "Warehouse Name" },
    { key: "warehouseCode", label: "Warehouse Code" },
    { key: "status", label: "Status" },
    { key: "address", label: "Address" },
    { key: "pincode", label: "Pincode" },
    { key: "country", label: "Country" },
    { key: "state", label: "State" },
    { key: "city", label: "City" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "country", label: "Country", options: uniqueOptions(warehouseRows, "country") },
    { key: "state", label: "State", options: uniqueOptions(warehouseRows, "state") },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "warehouseName", label: "Warehouse Name", type: "text" },
    { key: "warehouseCode", label: "Warehouse Code", type: "text" },
    {
      key: "warehouseType",
      label: "Warehouse Type",
      type: "select",
      options: ["Inward", "Storage", "Production"],
    },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "address", label: "Address", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "country", label: "Country", type: "select", options: uniqueOptions(warehouseRows, "country") },
    { key: "state", label: "State", type: "select", options: uniqueOptions(warehouseRows, "state") },
    { key: "city", label: "City", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: warehouseRows,
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
  rows: currencyRows,
};

export const unitMasterOptions = uniqueOptions(unitRows, "unitName");

export const transporterMasterOptions = uniqueOptions(
  transporterRows,
  "transporterName",
);

export const transporterTypeOptions = uniqueOptions(transporterRows, "type");

export const transporterAreaOfOperationOptions = uniqueOptions(
  transporterRows,
  "areaOfOperation",
);

export const transporterMasterDefinition: MasterDefinition = {
  slug: "transporter-master",
  title: "Transporter Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "transporterName", label: "Transporter Name" },
    { key: "branchName", label: "Branch Name" },
    { key: "transporterId", label: "Transporter Id" },
    { key: "type", label: "Type" },
    { key: "areaOfOperation", label: "Area Of Operation" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    {
      key: "type",
      label: "Type",
      options: transporterTypeOptions,
    },
    {
      key: "areaOfOperation",
      label: "Area Of Operation",
      options: transporterAreaOfOperationOptions,
    },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "transporterName", label: "Transporter Name", type: "text" },
    { key: "branchName", label: "Branch Name", type: "text" },
    { key: "transporterId", label: "Transporter Id", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: transporterTypeOptions,
    },
    {
      key: "areaOfOperation",
      label: "Area Of Operation",
      type: "select",
      options: [],
    },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: limitDemoListingRows(transporterRows),
};
